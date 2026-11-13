import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { getSigningSecret } from '../auth/admin-password';

export interface DoSpacesConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKey: string;
  secretKey: string;
}

const STORAGE_CONFIG_FILE = path.join(process.cwd(), 'data', 'storage-config.json');
const LOCAL_RESUMES_DIR = path.join(process.cwd(), 'data', 'resumes');
const SECRET_KEY_SALT = 'talentpulse-do-spaces-secrets-v1';

// In-memory runtime config cache
let cachedConfig: DoSpacesConfig | null = null;
let s3ClientInstanceVirtual: S3Client | null = null;
let s3ClientInstancePathStyle: S3Client | null = null;

function getEncryptedSecretsPath(): string {
  const candidates = [
    path.join(os.homedir(), '.talentpulse'),
    path.join(os.tmpdir(), '.talentpulse'),
  ];
  for (const dir of candidates) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
      }
      fs.accessSync(dir, fs.constants.W_OK);
      return path.join(dir, 'do-spaces.enc.json');
    } catch {
      // Try next directory
    }
  }
  return path.join(os.tmpdir(), 'talentpulse-do-spaces.enc.json');
}

function deriveEncryptionKey(): Buffer {
  return crypto.scryptSync(getSigningSecret(), SECRET_KEY_SALT, 32);
}

function encryptSecretPayload(payload: { accessKey: string; secretKey: string }): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    v: 1,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64'),
  });
}

function decryptSecretPayload(raw: string): { accessKey: string; secretKey: string } | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== 1 || !parsed.iv || !parsed.tag || !parsed.data) return null;
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      deriveEncryptionKey(),
      Buffer.from(parsed.iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(parsed.tag, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(parsed.data, 'base64')),
      decipher.final(),
    ]).toString('utf8');
    const obj = JSON.parse(decrypted);
    return {
      accessKey: typeof obj.accessKey === 'string' ? obj.accessKey : '',
      secretKey: typeof obj.secretKey === 'string' ? obj.secretKey : '',
    };
  } catch {
    return null;
  }
}

export function isMaskedOrEmptyCredential(value?: string): boolean {
  if (!value || typeof value !== 'string') return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (trimmed.includes('...') || trimmed.includes('••') || /^\*+$/.test(trimmed)) {
    return true;
  }
  return false;
}

function cleanCredentialValue(value?: string): string {
  if (!value || typeof value !== 'string') return '';
  // Trim whitespace and accidental surrounding quotes from copied credentials
  return value.trim().replace(/^["']|["']$/g, '').trim();
}

function writeNonSecretConfigFile(config: { endpoint: string; region: string; bucket: string }): void {
  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(
    STORAGE_CONFIG_FILE,
    JSON.stringify(
      {
        endpoint: config.endpoint,
        region: config.region,
        bucket: config.bucket,
      },
      null,
      2
    ) + '\n',
    'utf8'
  );
}

function writeEncryptedCredentials(accessKey: string, secretKey: string): void {
  const encPath = getEncryptedSecretsPath();
  const payload = encryptSecretPayload({ accessKey, secretKey });
  fs.writeFileSync(encPath, payload, { encoding: 'utf8', mode: 0o600 });
}

function readEncryptedCredentials(): { accessKey: string; secretKey: string } {
  const encPath = getEncryptedSecretsPath();
  try {
    if (fs.existsSync(encPath)) {
      const raw = fs.readFileSync(encPath, 'utf8');
      const parsed = decryptSecretPayload(raw);
      if (parsed) return parsed;
    }
  } catch {
    // Ignore read failure and fall back to env vars
  }
  return { accessKey: '', secretKey: '' };
}

/**
 * Normalizes a DigitalOcean Spaces endpoint URL and extracts the clean regional domain.
 * DigitalOcean Spaces URLs can be:
 * - Regional endpoint: https://sgp1.digitaloceanspaces.com (Correct for S3Client)
 * - Origin / Bucket URL: https://<bucket>.sgp1.digitaloceanspaces.com (Often copied from DO Console)
 *
 * S3Client in virtual-host style prepends the bucket to the endpoint hostname:
 * ${bucket}.${endpoint_host}
 * If the endpoint already contains the bucket name, S3Client will duplicate it:
 * <bucket>.<bucket>.sgp1.digitaloceanspaces.com
 * which fails TLS certificate verification:
 * "Hostname/IP does not match certificate's altnames: *.sgp1.digitaloceanspaces.com"
 *
 * This function extracts the clean regional endpoint (e.g. https://sgp1.digitaloceanspaces.com)
 * and detected region, completely preventing duplicate bucket subdomains.
 */
export function normalizeSpacesEndpoint(
  rawEndpoint?: string,
  bucket?: string,
  region?: string
): { endpoint: string; region: string } {
  let ep = (rawEndpoint || '').trim();
  let reg = (region || '').trim().toLowerCase();
  const b = (bucket || '').trim().toLowerCase();

  // If no endpoint specified, construct regional endpoint
  if (!ep) {
    reg = reg || 'nyc3';
    return { endpoint: `https://${reg}.digitaloceanspaces.com`, region: reg };
  }

  // Ensure scheme
  if (!ep.startsWith('http://') && !ep.startsWith('https://')) {
    ep = `https://${ep}`;
  }

  try {
    const parsed = new URL(ep);
    let host = parsed.hostname.toLowerCase();

    // Strip duplicate bucket prefix if user entered origin URL: <bucket>.<region>.digitaloceanspaces.com
    if (b && host.startsWith(`${b}.`)) {
      host = host.slice(b.length + 1);
    }

    // Match DigitalOcean Spaces domain pattern
    const doMatch = host.match(/^(?:([a-z0-9-]+)\.)?digitaloceanspaces\.com$/i);
    if (doMatch) {
      if (doMatch[1]) {
        reg = doMatch[1];
      } else {
        reg = reg || 'nyc3';
      }
      return {
        endpoint: `https://${reg}.digitaloceanspaces.com`,
        region: reg,
      };
    }

    // Generic or custom S3 endpoint
    return {
      endpoint: `${parsed.protocol}//${host}${parsed.port ? ':' + parsed.port : ''}`,
      region: reg || 'nyc3',
    };
  } catch {
    reg = reg || 'nyc3';
    return { endpoint: `https://${reg}.digitaloceanspaces.com`, region: reg };
  }
}

/**
 * Loads DigitalOcean Spaces configuration.
 * Non-secret routing metadata is stored in data/storage-config.json.
 * Secret credentials are stored encrypted outside the repo in ~/.talentpulse/do-spaces.enc.json
 * (or loaded from DO_SPACES_* environment variables).
 */
export function getDoSpacesConfig(): DoSpacesConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  let fileConfig: Partial<DoSpacesConfig> = {};
  try {
    if (fs.existsSync(STORAGE_CONFIG_FILE)) {
      const content = fs.readFileSync(STORAGE_CONFIG_FILE, 'utf8');
      fileConfig = JSON.parse(content);
    }
  } catch (err) {
    console.warn('[DO Spaces] Failed reading data/storage-config.json:', err);
  }

  const encryptedCreds = readEncryptedCredentials();

  // Auto-migrate and strip any legacy plaintext keys from data/storage-config.json
  const legacyAccessKey = cleanCredentialValue(fileConfig.accessKey);
  const legacySecretKey = cleanCredentialValue(fileConfig.secretKey);
  if ('accessKey' in fileConfig || 'secretKey' in fileConfig) {
    try {
      if (
        (!encryptedCreds.accessKey && !isMaskedOrEmptyCredential(legacyAccessKey)) ||
        (!encryptedCreds.secretKey && !isMaskedOrEmptyCredential(legacySecretKey))
      ) {
        const nextAccess = !isMaskedOrEmptyCredential(legacyAccessKey) ? legacyAccessKey : encryptedCreds.accessKey;
        const nextSecret = !isMaskedOrEmptyCredential(legacySecretKey) ? legacySecretKey : encryptedCreds.secretKey;
        if (nextAccess || nextSecret) {
          writeEncryptedCredentials(nextAccess, nextSecret);
          encryptedCreds.accessKey = nextAccess;
          encryptedCreds.secretKey = nextSecret;
        }
      }
      const normalizedLegacy = normalizeSpacesEndpoint(
        fileConfig.endpoint || process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
        fileConfig.bucket || process.env.DO_SPACES_BUCKET || process.env.DO_SPACES_BUCKET_NAME || 'talent-pulse-storage',
        fileConfig.region || process.env.DO_SPACES_REGION || 'nyc3'
      );
      writeNonSecretConfigFile({
        endpoint: normalizedLegacy.endpoint,
        region: normalizedLegacy.region,
        bucket: (fileConfig.bucket || process.env.DO_SPACES_BUCKET || process.env.DO_SPACES_BUCKET_NAME || 'talent-pulse-storage').trim(),
      });
    } catch (migrationErr) {
      console.warn('[DO Spaces] Failed stripping legacy keys from storage-config.json:', migrationErr);
    }
  }

  const rawEndpoint = fileConfig.endpoint || process.env.DO_SPACES_ENDPOINT || 'https://nyc3.digitaloceanspaces.com';
  const rawRegion = fileConfig.region || process.env.DO_SPACES_REGION || 'nyc3';
  const bucket = fileConfig.bucket || process.env.DO_SPACES_BUCKET || process.env.DO_SPACES_BUCKET_NAME || 'talent-pulse-storage';
  const accessKey =
    encryptedCreds.accessKey ||
    cleanCredentialValue(process.env.DO_SPACES_KEY || process.env.DO_SPACES_ACCESS_KEY_ID || '');
  const secretKey =
    encryptedCreds.secretKey ||
    cleanCredentialValue(process.env.DO_SPACES_SECRET || process.env.DO_SPACES_SECRET_ACCESS_KEY || '');

  const normalized = normalizeSpacesEndpoint(rawEndpoint, bucket, rawRegion);

  cachedConfig = {
    endpoint: normalized.endpoint,
    region: normalized.region,
    bucket: bucket.trim(),
    accessKey: cleanCredentialValue(accessKey),
    secretKey: cleanCredentialValue(secretKey),
  };

  return cachedConfig;
}

/**
 * Converts DigitalOcean Spaces / S3 SDK errors into clear, actionable human-readable messages.
 * Prevents AWS SDK's generic "UnknownError" from being shown to users.
 */
export function formatDoSpacesError(
  err: any, 
  config?: { bucket?: string; region?: string; endpoint?: string }
): string {
  if (!err) return 'Unknown error occurred while contacting DigitalOcean Spaces.';
  
  const code = (err.name || err.Code || err.code || '').trim();
  const rawMsg = (err.message || '').trim();
  const httpStatus = err.$metadata?.httpStatusCode;
  const bucket = config?.bucket || 'target';
  const region = config?.region || 'configured';

  // 1. Invalid or non-existent Access Key ID
  if (code === 'InvalidAccessKeyId' || rawMsg.includes('InvalidAccessKeyId')) {
    return 'Invalid Access Key ID: The Access Key ID does not exist in DigitalOcean Spaces. Note: You must use a "Spaces Access Key" (from DigitalOcean Cloud Console > API > Spaces Keys), not a Personal Access Token.';
  }

  // 2. Secret Key mismatch
  if (code === 'SignatureDoesNotMatch' || rawMsg.includes('SignatureDoesNotMatch')) {
    return 'Invalid Secret Key: The Secret Access Key does not match the Access Key ID. Please copy and paste the Secret Key generated for this Spaces Access Key.';
  }

  // 3. Bucket does not exist or region mismatch
  if (code === 'NoSuchBucket' || rawMsg.includes('NoSuchBucket') || httpStatus === 404) {
    return `Bucket Not Found (404): Bucket "${bucket}" was not found in region "${region}". Please verify your bucket name and region.`;
  }

  // 4. Access Denied (permission issue or wrong bucket permissions)
  if (code === 'AccessDenied' || rawMsg.includes('AccessDenied') || httpStatus === 403) {
    return `Access Denied (HTTP 403): The provided Spaces credentials do not have permission to access bucket "${bucket}". Please verify that the Spaces key has Read and Write permissions for this bucket.`;
  }

  // 5. Hostname / TLS certificate mismatch
  if (
    code === 'ERR_TLS_CERT_ALTNAME_INVALID' ||
    rawMsg.includes('altnames') ||
    rawMsg.includes('certificate')
  ) {
    return `SSL Certificate Mismatch: The endpoint URL had duplicate bucket prefixes. Please use the regional endpoint: https://${region}.digitaloceanspaces.com.`;
  }

  // 6. Network connection failure
  if (code === 'ENOTFOUND' || rawMsg.includes('getaddrinfo ENOTFOUND')) {
    return `Network Host Not Found: Cannot resolve host "${config?.endpoint}". Please check your internet connection and endpoint URL.`;
  }

  if (code === 'ECONNREFUSED' || code === 'ETIMEDOUT') {
    return `Connection Failed: Timeout or refused when reaching "${config?.endpoint}".`;
  }

  // 7. If raw message is meaningful and not "UnknownError"
  if (rawMsg && rawMsg !== 'UnknownError') {
    return `${code && code !== 'Unknown' ? `[${code}] ` : ''}${rawMsg}`;
  }

  // 8. Fallback showing the error code and HTTP status
  if (code && code !== 'UnknownError' && code !== 'Unknown') {
    return `${code}${httpStatus ? ` (HTTP ${httpStatus})` : ''}: Verification failed against DigitalOcean Spaces bucket "${bucket}".`;
  }

  return `Connection failed with HTTP ${httpStatus || 400}: Verification failed against DigitalOcean Spaces bucket "${bucket}". Please check Access Key, Secret Key, and Bucket Name.`;
}

/**
 * Save new Spaces configuration:
 * - Non-secret endpoint/region/bucket go to data/storage-config.json
 * - Secret accessKey/secretKey are AES-256-GCM encrypted outside the codebase
 */
export function saveDoSpacesConfig(newConfig: Partial<DoSpacesConfig>): DoSpacesConfig {
  const current = getDoSpacesConfig();
  const bucket = newConfig.bucket !== undefined && newConfig.bucket.trim().length > 0
    ? newConfig.bucket.trim()
    : current.bucket;
  const rawRegion = newConfig.region !== undefined && newConfig.region.trim().length > 0
    ? newConfig.region.trim()
    : current.region;
  const rawEndpoint = newConfig.endpoint !== undefined && newConfig.endpoint.trim().length > 0
    ? newConfig.endpoint.trim()
    : current.endpoint;

  const normalized = normalizeSpacesEndpoint(rawEndpoint, bucket, rawRegion);

  // Preserve existing accessKey if new one is empty or masked
  let mergedAccessKey = current.accessKey;
  if (newConfig.accessKey !== undefined && !isMaskedOrEmptyCredential(newConfig.accessKey)) {
    mergedAccessKey = cleanCredentialValue(newConfig.accessKey);
  }

  // Preserve existing secretKey if new one is empty or masked
  let mergedSecretKey = current.secretKey;
  if (newConfig.secretKey !== undefined && !isMaskedOrEmptyCredential(newConfig.secretKey)) {
    mergedSecretKey = cleanCredentialValue(newConfig.secretKey);
  }

  const merged: DoSpacesConfig = {
    endpoint: normalized.endpoint,
    region: normalized.region,
    bucket,
    accessKey: mergedAccessKey,
    secretKey: mergedSecretKey,
  };

  try {
    writeNonSecretConfigFile({
      endpoint: merged.endpoint,
      region: merged.region,
      bucket: merged.bucket,
    });
    if (merged.accessKey || merged.secretKey) {
      writeEncryptedCredentials(merged.accessKey, merged.secretKey);
    }
  } catch (err) {
    console.error('[DO Spaces] Failed saving config:', err);
  }

  // Invalidate cache and client instances
  cachedConfig = merged;
  s3ClientInstanceVirtual = null;
  s3ClientInstancePathStyle = null;

  return merged;
}

export function isDoSpacesConfigured(): boolean {
  const cfg = getDoSpacesConfig();
  return Boolean(cfg.accessKey && cfg.secretKey && cfg.bucket);
}

function buildS3Client(config: {
  endpoint: string;
  region: string;
  accessKey: string;
  secretKey: string;
}, forcePathStyle: boolean): S3Client {
  return new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    credentials: {
      accessKeyId: cleanCredentialValue(config.accessKey),
      secretAccessKey: cleanCredentialValue(config.secretKey),
    },
    forcePathStyle,
    // Disable default AWS SDK v3 automatic flexible checksums that break S3-compatible providers like DO Spaces
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  });
}

/**
 * Creates or retrieves S3 client instance configured for DigitalOcean Spaces.
 * Supports both virtual-host-style (default) and path-style addressing.
 */
export function getDoSpacesClient(customConfig?: Partial<DoSpacesConfig>, forcePathStyle: boolean = false): S3Client {
  const base = customConfig ? { ...getDoSpacesConfig(), ...customConfig } : getDoSpacesConfig();
  const normalized = normalizeSpacesEndpoint(base.endpoint, base.bucket, base.region);

  if (customConfig) {
    return buildS3Client(
      {
        endpoint: normalized.endpoint,
        region: normalized.region,
        accessKey: base.accessKey,
        secretKey: base.secretKey,
      },
      forcePathStyle
    );
  }

  if (forcePathStyle) {
    if (!s3ClientInstancePathStyle) {
      s3ClientInstancePathStyle = buildS3Client(
        {
          endpoint: normalized.endpoint,
          region: normalized.region,
          accessKey: base.accessKey,
          secretKey: base.secretKey,
        },
        true
      );
    }
    return s3ClientInstancePathStyle;
  }

  if (!s3ClientInstanceVirtual) {
    s3ClientInstanceVirtual = buildS3Client(
      {
        endpoint: normalized.endpoint,
        region: normalized.region,
        accessKey: base.accessKey,
        secretKey: base.secretKey,
      },
      false
    );
  }
  return s3ClientInstanceVirtual;
}

/**
 * Tests connection to the DigitalOcean Spaces bucket.
 * Tests virtual-host style first, with fallback to path-style addressing if SSL hostname mismatch occurs.
 * If bucket listing is restricted, tests write probe to confirm access.
 */
export async function testDoSpacesConnection(testConfig?: Partial<DoSpacesConfig>): Promise<{
  success: boolean;
  message: string;
  bucket?: string;
  endpoint?: string;
}> {
  const stored = getDoSpacesConfig();
  const base = testConfig ? { ...stored, ...testConfig } : stored;
  const normalized = normalizeSpacesEndpoint(base.endpoint, base.bucket, base.region);

  const hasNewAccessKey = Boolean(testConfig?.accessKey && !isMaskedOrEmptyCredential(testConfig.accessKey));
  const hasNewSecretKey = Boolean(testConfig?.secretKey && !isMaskedOrEmptyCredential(testConfig.secretKey));

  // Unmask credentials if omitted, but prevent testing a new Access Key against a stale Secret Key
  const resolvedAccessKey = hasNewAccessKey
    ? cleanCredentialValue(testConfig!.accessKey)
    : stored.accessKey;
  const resolvedSecretKey = hasNewSecretKey
    ? cleanCredentialValue(testConfig!.secretKey)
    : stored.secretKey;

  if (hasNewAccessKey && !hasNewSecretKey && resolvedAccessKey !== stored.accessKey && stored.secretKey) {
    return {
      success: false,
      message: 'When entering a new Access Key ID, please also enter its matching Secret Access Key so the pair can be verified together.',
      bucket: base.bucket,
      endpoint: normalized.endpoint,
    };
  }

  const config = {
    ...base,
    endpoint: normalized.endpoint,
    region: normalized.region,
    accessKey: resolvedAccessKey,
    secretKey: resolvedSecretKey,
  };

  if (!config.accessKey || !config.secretKey || !config.bucket) {
    return {
      success: false,
      message: 'Access Key, Secret Key, and Bucket Name are required to test connection. Please ensure all credentials are provided.',
      bucket: config.bucket,
      endpoint: config.endpoint,
    };
  }

  // Detect accidental Personal Access Token (starts with dop_v1_)
  if (config.accessKey.startsWith('dop_v1_')) {
    return {
      success: false,
      message: 'Invalid key type: The Access Key entered is a Personal Access Token (starts with dop_v1_). DigitalOcean Spaces requires a "Spaces Access Key". Go to DigitalOcean Cloud Console > API > Spaces Keys to generate an Access Key and Secret Key.',
      bucket: config.bucket,
      endpoint: config.endpoint,
    };
  }

  let lastError: any = null;

  // 1. Try standard virtual-host addressing
  try {
    const s3 = getDoSpacesClient(config, false);
    await s3.send(new ListObjectsV2Command({
      Bucket: config.bucket,
      MaxKeys: 1,
    }));

    return {
      success: true,
      message: `Successfully connected to DigitalOcean Spaces bucket "${config.bucket}" (${config.endpoint}).`,
      bucket: config.bucket,
      endpoint: config.endpoint,
    };
  } catch (err: any) {
    lastError = err;
    const isTlsOrHostnameError = 
      err?.message?.includes('altnames') || 
      err?.message?.includes('certificate') || 
      err?.code === 'ERR_TLS_CERT_ALTNAME_INVALID' ||
      err?.name === 'PermanentRedirect';

    // 2. If TLS altname or hostname mismatch, fallback to path-style addressing
    if (isTlsOrHostnameError) {
      try {
        const s3PathStyle = getDoSpacesClient(config, true);
        await s3PathStyle.send(new ListObjectsV2Command({
          Bucket: config.bucket,
          MaxKeys: 1,
        }));

        return {
          success: true,
          message: `Successfully connected to DigitalOcean Spaces bucket "${config.bucket}" via path-style endpoint.`,
          bucket: config.bucket,
          endpoint: config.endpoint,
        };
      } catch (pathErr: any) {
        lastError = pathErr;
      }
    }

    // 3. If listing is restricted (AccessDenied 403), check if object write is permitted via probe
    if (lastError?.name === 'AccessDenied' || lastError?.$metadata?.httpStatusCode === 403) {
      try {
        const s3 = getDoSpacesClient(config, false);
        const probeKey = 'Talent Pulse/.connection-test';
        await s3.send(new PutObjectCommand({
          Bucket: config.bucket,
          Key: probeKey,
          Body: Buffer.from('connection test probe'),
          ContentType: 'text/plain',
        }));
        await s3.send(new DeleteObjectCommand({
          Bucket: config.bucket,
          Key: probeKey,
        }));

        return {
          success: true,
          message: `Successfully verified write & delete access to DigitalOcean Spaces bucket "${config.bucket}".`,
          bucket: config.bucket,
          endpoint: config.endpoint,
        };
      } catch (probeErr: any) {
        if (probeErr && probeErr.name !== 'Unknown') {
          lastError = probeErr;
        }
      }
    }

    const formatted = formatDoSpacesError(lastError, config);
    console.warn(`[DO Spaces] Connection test failed: ${formatted}`);
    return {
      success: false,
      message: formatted,
      bucket: config.bucket,
      endpoint: config.endpoint,
    };
  }
}

/**
 * Returns formatted month and year subfolder name: e.g. "November-2026" or "March-2025"
 */
export function formatMonthYearFolder(date: Date = new Date()): string {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${month}-${year}`;
}

/**
 * Sanitizes a filename to ensure safe S3 object keys
 */
export function sanitizeFilename(filename: string): string {
  const base = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return base.length > 100 ? `${base.slice(0, 90)}_${base.slice(-10)}` : base;
}

/**
 * Constructs the canonical private object key according to requirement:
 * Main folder: "Talent Pulse"
 * Sub-folder: "{Month}-{Year}"
 * Sub-folder: "candidate"
 * File: "${candidateId}_{sanitizedFilename}"
 * Example: "Talent Pulse/November-2026/candidate/cand-123_john_doe_resume.pdf"
 */
export function buildResumeStorageKey(
  candidateId: string,
  originalFilename: string,
  date: Date = new Date()
): string {
  const monthYear = formatMonthYearFolder(date);
  const cleanFilename = sanitizeFilename(originalFilename || 'resume.pdf');
  const safeCandidateId = candidateId.replace(/[^a-zA-Z0-9_-]/g, '');
  return `Talent Pulse/${monthYear}/candidate/${safeCandidateId}_${cleanFilename}`;
}

export interface UploadResumeParams {
  fileBuffer: Buffer | Uint8Array;
  filename: string;
  contentType?: string;
  candidateId: string;
  oldResumeKey?: string | null;
  date?: Date;
}

export interface UploadResumeResult {
  success: boolean;
  storageKey: string;
  bucket: string;
  filename: string;
  sizeBytes: number;
  isSimulated?: boolean;
  error?: string;
}

// In-memory fallback store
const inMemoryResumeStore = new Map<string, { buffer: Buffer; contentType: string; filename: string }>();

/**
 * Helper to cache file locally to disk under data/resumes/...
 */
export function cacheResumeLocally(storageKey: string, buffer: Buffer): void {
  try {
    const fullPath = path.join(LOCAL_RESUMES_DIR, storageKey);
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(fullPath, buffer);
  } catch (err) {
    console.warn('[DO Spaces] Local disk caching warning:', err);
  }
}

/**
 * Helper to delete locally cached file
 */
export function deleteLocalResumeCache(storageKey: string): void {
  try {
    const fullPath = path.join(LOCAL_RESUMES_DIR, storageKey);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  } catch (err) {
    console.warn('[DO Spaces] Failed deleting local disk resume:', err);
  }
}

/**
 * Helper to send PutObjectCommand with comprehensive fallbacks:
 * 1. Virtual-host with ACL: 'private'
 * 2. Virtual-host without ACL (if ACLs disabled on bucket)
 * 3. Path-style addressing (if TLS certificate altnames mismatch)
 * 4. Path-style without ACL
 */
async function sendPutObjectWithFallbacks(
  bucket: string,
  key: string,
  buffer: Buffer,
  contentType: string,
  metadata: Record<string, string>
): Promise<void> {
  const s3Virtual = getDoSpacesClient(undefined, false);
  const s3PathStyle = getDoSpacesClient(undefined, true);

  const baseParams = {
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
    Metadata: metadata,
  };

  try {
    // 1. Standard virtual host with ACL
    await s3Virtual.send(new PutObjectCommand({ ...baseParams, ACL: 'private' }));
    return;
  } catch (err1: any) {
    const isAclError = 
      err1?.message?.includes('AccessControlList') || 
      err1?.name === 'AccessControlListNotSupported';
    const isTlsError = 
      err1?.message?.includes('altnames') || 
      err1?.message?.includes('certificate') || 
      err1?.code === 'ERR_TLS_CERT_ALTNAME_INVALID';

    if (isAclError) {
      // 2. Retry virtual host without ACL
      try {
        await s3Virtual.send(new PutObjectCommand(baseParams));
        return;
      } catch (errAclFallback: any) {
        if (
          errAclFallback?.message?.includes('altnames') || 
          errAclFallback?.message?.includes('certificate')
        ) {
          // Retry path style
          await s3PathStyle.send(new PutObjectCommand(baseParams));
          return;
        }
        throw errAclFallback;
      }
    }

    if (isTlsError) {
      // 3. Retry path style with ACL
      try {
        await s3PathStyle.send(new PutObjectCommand({ ...baseParams, ACL: 'private' }));
        return;
      } catch (errPathAcl: any) {
        // 4. Retry path style without ACL
        await s3PathStyle.send(new PutObjectCommand(baseParams));
        return;
      }
    }

    throw err1;
  }
}

/**
 * Uploads a candidate resume to DigitalOcean Spaces under the required folder hierarchy:
 * "Talent Pulse/{Month-Year}/candidate/{candidateId}_{filename}"
 * Sets ACL to 'private' so the file is NOT publicly accessible.
 * If an oldResumeKey is provided, it automatically deletes the previous file from storage.
 */
export async function uploadResumeToSpaces(params: UploadResumeParams): Promise<UploadResumeResult> {
  const { fileBuffer, filename, contentType = 'application/pdf', candidateId, oldResumeKey, date } = params;
  const newStorageKey = buildResumeStorageKey(candidateId, filename, date);
  const buffer = Buffer.isBuffer(fileBuffer) ? fileBuffer : Buffer.from(fileBuffer);
  const cfg = getDoSpacesConfig();

  // Cache locally on disk immediately
  cacheResumeLocally(newStorageKey, buffer);

  // Store in memory map
  inMemoryResumeStore.set(newStorageKey, { buffer, contentType, filename });

  // Requirement: "Updating the resume file by the candidate should delete the previously saved file and add the new file in replacement."
  if (oldResumeKey && oldResumeKey !== newStorageKey) {
    try {
      await deleteResumeFromSpaces(oldResumeKey);
    } catch (err) {
      console.warn(`[DO Spaces] Failed to delete previous resume at key "${oldResumeKey}":`, err);
    }
  }

  if (!isDoSpacesConfigured()) {
    console.warn('[DO Spaces] DO_SPACES_KEY or DO_SPACES_SECRET not set. Stored resume on disk and in memory.');
    return {
      success: true,
      storageKey: newStorageKey,
      bucket: cfg.bucket,
      filename,
      sizeBytes: buffer.length,
      isSimulated: true,
    };
  }

  try {
    await sendPutObjectWithFallbacks(
      cfg.bucket,
      newStorageKey,
      buffer,
      contentType,
      {
        'candidate-id': candidateId,
        'original-filename': encodeURIComponent(filename),
        'uploaded-at': new Date().toISOString(),
      }
    );

    return {
      success: true,
      storageKey: newStorageKey,
      bucket: cfg.bucket,
      filename,
      sizeBytes: buffer.length,
    };
  } catch (err: any) {
    console.error('[DO Spaces] Upload failed:', err);
    // File is safely cached locally on disk so users and candidates never lose data
    return {
      success: false,
      storageKey: newStorageKey,
      bucket: cfg.bucket,
      filename,
      sizeBytes: buffer.length,
      error: err.message || 'Failed to upload to DigitalOcean Spaces',
    };
  }
}

/**
 * Deletes a candidate resume from DigitalOcean Spaces and local cache
 */
export async function deleteResumeFromSpaces(storageKey: string): Promise<boolean> {
  if (!storageKey) return false;

  // Clean in-memory fallback store
  inMemoryResumeStore.delete(storageKey);

  // Clean local disk cache
  deleteLocalResumeCache(storageKey);

  if (!isDoSpacesConfigured()) {
    return true;
  }

  try {
    const s3 = getDoSpacesClient(undefined, false);
    const cfg = getDoSpacesConfig();
    try {
      await s3.send(new DeleteObjectCommand({
        Bucket: cfg.bucket,
        Key: storageKey,
      }));
    } catch (delErr: any) {
      if (delErr?.message?.includes('altnames') || delErr?.message?.includes('certificate')) {
        const s3Path = getDoSpacesClient(undefined, true);
        await s3Path.send(new DeleteObjectCommand({
          Bucket: cfg.bucket,
          Key: storageKey,
        }));
      } else {
        throw delErr;
      }
    }
    return true;
  } catch (err) {
    console.error(`[DO Spaces] Error deleting object "${storageKey}":`, err);
    return false;
  }
}

/**
 * Downloads a resume object directly from DO Spaces or local cache for internal streaming to authorized users
 */
export async function getResumeObjectStream(storageKey: string): Promise<{
  stream?: NodeJS.ReadableStream | ReadableStream | null;
  buffer?: Buffer;
  contentType: string;
  contentLength?: number;
  filename: string;
} | null> {
  // 1. Check memory store
  if (inMemoryResumeStore.has(storageKey)) {
    const item = inMemoryResumeStore.get(storageKey)!;
    return {
      buffer: item.buffer,
      contentType: item.contentType,
      contentLength: item.buffer.length,
      filename: item.filename,
    };
  }

  // 2. Check local disk cache
  try {
    const localFilePath = path.join(LOCAL_RESUMES_DIR, storageKey);
    if (fs.existsSync(localFilePath)) {
      const fileBuf = fs.readFileSync(localFilePath);
      const filename = storageKey.split('/').pop() || 'resume.pdf';
      return {
        buffer: fileBuf,
        contentType: 'application/pdf',
        contentLength: fileBuf.length,
        filename,
      };
    }
  } catch (err) {
    console.warn('[DO Spaces] Local disk read error:', err);
  }

  // 3. Check DigitalOcean Spaces S3 bucket
  if (!isDoSpacesConfigured()) {
    return null;
  }

  try {
    const cfg = getDoSpacesConfig();
    let response: any = null;

    try {
      const s3 = getDoSpacesClient(undefined, false);
      response = await s3.send(new GetObjectCommand({
        Bucket: cfg.bucket,
        Key: storageKey,
      }));
    } catch (getErr: any) {
      if (getErr?.message?.includes('altnames') || getErr?.message?.includes('certificate')) {
        const s3Path = getDoSpacesClient(undefined, true);
        response = await s3Path.send(new GetObjectCommand({
          Bucket: cfg.bucket,
          Key: storageKey,
        }));
      } else {
        throw getErr;
      }
    }

    const contentType = response.ContentType || 'application/pdf';
    const contentLength = response.ContentLength;
    const metadataFilename = response.Metadata?.['original-filename'] 
      ? decodeURIComponent(response.Metadata['original-filename']) 
      : storageKey.split('/').pop() || 'resume.pdf';

    // If body can be converted to buffer, cache locally
    if (response.Body && typeof (response.Body as any).transformToByteArray === 'function') {
      const bytes = await (response.Body as any).transformToByteArray();
      const buf = Buffer.from(bytes);
      cacheResumeLocally(storageKey, buf);
      return {
        buffer: buf,
        contentType,
        contentLength: buf.length,
        filename: metadataFilename,
      };
    }

    return {
      stream: response.Body as any,
      contentType,
      contentLength,
      filename: metadataFilename,
    };
  } catch (err) {
    console.warn(`[DO Spaces] GetObject failed for "${storageKey}": ${formatDoSpacesError(err, getDoSpacesConfig())}`);
    return null;
  }
}

/**
 * Generates a short-lived presigned download URL (valid for authorized internal sessions only)
 */
export async function getResumeSignedDownloadUrl(storageKey: string, expiresInSeconds = 300): Promise<string | null> {
  if (!isDoSpacesConfigured()) {
    return null;
  }

  try {
    const s3 = getDoSpacesClient(undefined, false);
    const cfg = getDoSpacesConfig();
    const command = new GetObjectCommand({
      Bucket: cfg.bucket,
      Key: storageKey,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
    return url;
  } catch (err) {
    console.error(`[DO Spaces] Failed to generate signed URL for "${storageKey}":`, err);
    return null;
  }
}
