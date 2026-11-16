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
const SECRET_KEY_SALT = 'talentpulse-do-spaces-secrets-v1';

export class DoSpacesConfigError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(
    message = 'DigitalOcean Spaces is not configured. Valid DO_SPACES_KEY, DO_SPACES_SECRET, and DO_SPACES_BUCKET credentials are required (empty or placeholder values are not permitted).',
    code = 'DO_SPACES_NOT_CONFIGURED',
    statusCode = 503
  ) {
    super(message);
    this.name = 'DoSpacesConfigError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

// In-memory runtime config cache with file/env signature invalidation
let cachedConfig: DoSpacesConfig | null = null;
let cachedConfigSignature: string | null = null;
let s3ClientInstanceVirtual: S3Client | null = null;
let s3ClientInstancePathStyle: S3Client | null = null;

function getFileStamp(filePath: string): string {
  try {
    if (!fs.existsSync(filePath)) return 'missing';
    const stat = fs.statSync(filePath);
    return `${stat.mtimeMs}:${stat.size}`;
  } catch {
    return 'err';
  }
}

function getConfigSignature(): string {
  const jwtSecretFile = path.join(process.cwd(), 'data', '.jwt_secret');
  return [
    getFileStamp(STORAGE_CONFIG_FILE),
    getFileStamp(getEncryptedSecretsPath()),
    getFileStamp(jwtSecretFile),
    process.env.DO_SPACES_ENDPOINT || '',
    process.env.DO_SPACES_REGION || '',
    process.env.DO_SPACES_BUCKET || process.env.DO_SPACES_BUCKET_NAME || '',
    process.env.DO_SPACES_KEY || process.env.DO_SPACES_ACCESS_KEY_ID || '',
    process.env.DO_SPACES_SECRET || process.env.DO_SPACES_SECRET_ACCESS_KEY || '',
  ].join('|');
}

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
  const trimmed = value.trim().replace(/^["']|["']$/g, '').trim();
  if (!trimmed) return true;
  if (trimmed.includes('...') || trimmed.includes('••') || /^\*+$/.test(trimmed)) {
    return true;
  }
  const lower = trimmed.toLowerCase();
  if (
    lower === 'do00examplekey123' ||
    lower === 'example_secret_access_key_xyz' ||
    lower.startsWith('your-') ||
    lower.startsWith('your_') ||
    lower.startsWith('my_') ||
    lower.includes('examplekey') ||
    lower.includes('example_secret') ||
    lower.includes('placeholder') ||
    lower === 'replace_me' ||
    lower === 'changeme'
  ) {
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
  const signature = getConfigSignature();
  if (cachedConfig && cachedConfigSignature === signature) {
    return cachedConfig;
  }

  // Signature changed (e.g., data/storage-config.json or credentials removed/updated)
  s3ClientInstanceVirtual = null;
  s3ClientInstancePathStyle = null;

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

  const envAccessKey = cleanCredentialValue(process.env.DO_SPACES_KEY || process.env.DO_SPACES_ACCESS_KEY_ID || '');
  const envSecretKey = cleanCredentialValue(process.env.DO_SPACES_SECRET || process.env.DO_SPACES_SECRET_ACCESS_KEY || '');

  const rawAccessKey = !isMaskedOrEmptyCredential(encryptedCreds.accessKey)
    ? encryptedCreds.accessKey
    : !isMaskedOrEmptyCredential(envAccessKey)
      ? envAccessKey
      : '';
  const rawSecretKey = !isMaskedOrEmptyCredential(encryptedCreds.secretKey)
    ? encryptedCreds.secretKey
    : !isMaskedOrEmptyCredential(envSecretKey)
      ? envSecretKey
      : '';

  const normalized = normalizeSpacesEndpoint(rawEndpoint, bucket, rawRegion);

  cachedConfig = {
    endpoint: normalized.endpoint,
    region: normalized.region,
    bucket: bucket.trim(),
    accessKey: cleanCredentialValue(rawAccessKey),
    secretKey: cleanCredentialValue(rawSecretKey),
  };
  cachedConfigSignature = getConfigSignature();

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
    console.warn('[DO Spaces] Failed saving config:', err instanceof Error ? err.message : err);
  }

  // Invalidate cache and client instances
  cachedConfig = merged;
  cachedConfigSignature = getConfigSignature();
  s3ClientInstanceVirtual = null;
  s3ClientInstancePathStyle = null;

  return merged;
}

function isPlaceholderBucket(bucket?: string): boolean {
  if (!bucket || typeof bucket !== 'string') return true;
  const lower = bucket.trim().toLowerCase();
  return !lower || lower === 'your-spaces-bucket' || lower === 'your_spaces_bucket';
}

export function isDoSpacesConfigured(): boolean {
  const cfg = getDoSpacesConfig();
  return Boolean(
    !isMaskedOrEmptyCredential(cfg.accessKey) &&
    !isMaskedOrEmptyCredential(cfg.secretKey) &&
    !isPlaceholderBucket(cfg.bucket)
  );
}

export function assertDoSpacesConfigured(customConfig?: Partial<DoSpacesConfig>): DoSpacesConfig {
  const cfg = customConfig ? { ...getDoSpacesConfig(), ...customConfig } : getDoSpacesConfig();
  if (
    isMaskedOrEmptyCredential(cfg.accessKey) ||
    isMaskedOrEmptyCredential(cfg.secretKey) ||
    isPlaceholderBucket(cfg.bucket)
  ) {
    throw new DoSpacesConfigError();
  }
  return cfg;
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
 * Throws DoSpacesConfigError (DO_SPACES_NOT_CONFIGURED) if credentials are empty or placeholders.
 * Supports both virtual-host-style (default) and path-style addressing.
 */
export function getDoSpacesClient(customConfig?: Partial<DoSpacesConfig>, forcePathStyle: boolean = false): S3Client {
  const base = assertDoSpacesConfigured(customConfig);
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

  if (
    isMaskedOrEmptyCredential(config.accessKey) ||
    isMaskedOrEmptyCredential(config.secretKey) ||
    isPlaceholderBucket(config.bucket)
  ) {
    return {
      success: false,
      message: 'Valid Access Key, Secret Key, and Bucket Name are required (empty or placeholder values are not allowed).',
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
  code?: string;
  statusCode?: number;
  error?: string;
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

  try {
    const validCfg = assertDoSpacesConfigured();

    await sendPutObjectWithFallbacks(
      validCfg.bucket,
      newStorageKey,
      buffer,
      contentType,
      {
        'candidate-id': candidateId,
        'original-filename': encodeURIComponent(filename),
        'uploaded-at': new Date().toISOString(),
      }
    );

    // Delete previous resume only after the replacement upload succeeds
    if (oldResumeKey && oldResumeKey !== newStorageKey) {
      try {
        await deleteResumeFromSpaces(oldResumeKey);
      } catch (err) {
        console.warn(`[DO Spaces] Failed to delete previous resume at key "${oldResumeKey}":`, err);
      }
    }

    return {
      success: true,
      storageKey: newStorageKey,
      bucket: validCfg.bucket,
      filename,
      sizeBytes: buffer.length,
    };
  } catch (err: any) {
    if (err instanceof DoSpacesConfigError) {
      console.warn(`[DO Spaces] Upload rejected (${err.code}): ${err.message}`);
      return {
        success: false,
        storageKey: newStorageKey,
        bucket: cfg.bucket,
        filename,
        sizeBytes: buffer.length,
        code: err.code,
        statusCode: err.statusCode,
        error: err.message,
      };
    }

    const formattedError = formatDoSpacesError(err, cfg);
    const errorCode = (err?.name || err?.Code || err?.code || 'DO_SPACES_UPLOAD_FAILED').trim();
    console.warn(`[DO Spaces] Upload failed (${errorCode}): ${formattedError}`);
    return {
      success: false,
      storageKey: newStorageKey,
      bucket: cfg.bucket,
      filename,
      sizeBytes: buffer.length,
      code: errorCode,
      statusCode: 502,
      error: formattedError,
    };
  }
}

/**
 * Deletes a candidate resume from DigitalOcean Spaces.
 * Returns false if credentials are not configured or deletion fails.
 */
export async function deleteResumeFromSpaces(storageKey: string): Promise<boolean> {
  if (
    !storageKey ||
    storageKey.startsWith('data:') ||
    storageKey.startsWith('http://') ||
    storageKey.startsWith('https://') ||
    storageKey.startsWith('attached://')
  ) {
    return false;
  }

  try {
    const cfg = assertDoSpacesConfigured();
    const s3 = getDoSpacesClient(undefined, false);
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
  } catch (err: any) {
    if (err instanceof DoSpacesConfigError) {
      console.warn(`[DO Spaces] Delete skipped (${err.code}): ${err.message}`);
      return false;
    }
    console.warn(`[DO Spaces] Error deleting object "${storageKey}": ${formatDoSpacesError(err, getDoSpacesConfig())}`);
    return false;
  }
}

/**
 * Downloads a resume object directly from DigitalOcean Spaces for internal streaming to authorized users.
 * Throws DoSpacesConfigError (DO_SPACES_NOT_CONFIGURED) when credentials are empty or placeholders.
 */
export async function getResumeObjectStream(storageKey: string): Promise<{
  stream?: NodeJS.ReadableStream | ReadableStream | null;
  buffer?: Buffer;
  contentType: string;
  contentLength?: number;
  filename: string;
} | null> {
  const cfg = assertDoSpacesConfigured();

  try {
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

    if (response.Body && typeof (response.Body as any).transformToByteArray === 'function') {
      const bytes = await (response.Body as any).transformToByteArray();
      const buf = Buffer.from(bytes);
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
  } catch (err: any) {
    const code = (err?.name || err?.Code || err?.code || '').trim();
    const formatted = formatDoSpacesError(err, cfg);
    console.warn(`[DO Spaces] GetObject failed for "${storageKey}": ${formatted}`);
    if (code === 'NoSuchKey') {
      return null;
    }
    throw new DoSpacesConfigError(formatted, code || 'DO_SPACES_READ_FAILED', 502);
  }
}

/**
 * Generates a short-lived presigned download URL (valid for authorized internal sessions only).
 * Throws DoSpacesConfigError (DO_SPACES_NOT_CONFIGURED) when credentials are empty or placeholders.
 */
export async function getResumeSignedDownloadUrl(storageKey: string, expiresInSeconds = 300): Promise<string | null> {
  const cfg = assertDoSpacesConfigured();

  try {
    const s3 = getDoSpacesClient(undefined, false);
    const command = new GetObjectCommand({
      Bucket: cfg.bucket,
      Key: storageKey,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
    return url;
  } catch (err) {
    console.warn(`[DO Spaces] Failed to generate signed URL for "${storageKey}": ${formatDoSpacesError(err, cfg)}`);
    return null;
  }
}
