import crypto from 'crypto';

export interface AdminUserRecord {
  id: string;
  email: string;
  password_hash: string;
  salt: string;
  full_name: string;
  role: string;
  is_active: boolean;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
  must_change_password?: boolean;
}

// Primary initial super admin email
export const DESIGNATED_ADMIN_EMAIL = 'admin@talentpulse.com';

// Pre-seeded cryptographic hash for default admin password (lahore123$)
export const DEFAULT_ADMIN_SALT = '4a8f9c2d1b7e5f3a0c6e8d2b4f1a9c3e';
export const DEFAULT_ADMIN_HASH = '112a7db7ddf8ecb2f88b4c5b54f8433c46b80d7a0fd49ba94d0f57ce59a79f3dfc9edc2350bf34548827105435888425c81d181f10844989269ca89583fa72dc';

// Ephemeral runtime secret to prevent static signature forgery if env var is unset
const RUNTIME_SECRET = crypto.randomBytes(32).toString('hex');

export function getSigningSecret(): string {
  return process.env.SUPABASE_SECRET_KEY || process.env.APP_SECRET || RUNTIME_SECRET;
}

/**
 * Hash password with PBKDF2 (SHA-512) and salt.
 * 100,000 iterations, 64-byte key length.
 */
export function hashAdminPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

/**
 * Generate a cryptographically random salt
 */
export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Timing-safe verification of plain text password against stored hash and salt
 */
export function verifyAdminPassword(password: string, salt: string, storedHash: string): boolean {
  try {
    const computedHash = hashAdminPassword(password, salt);
    const computedBuffer = Buffer.from(computedHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');
    if (computedBuffer.length !== storedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(computedBuffer, storedBuffer);
  } catch {
    return false;
  }
}

/**
 * Generate a temporary readable initial password
 */
export function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'TP-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate a secure signed invite token for a newly provisioned admin user
 */
export function generateInviteToken(payload: { email: string; role: string }): string {
  const data = {
    email: payload.email.trim().toLowerCase(),
    role: payload.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days validity
    nonce: crypto.randomBytes(8).toString('hex'),
  };

  const jsonStr = JSON.stringify(data);
  const dataBase64 = Buffer.from(jsonStr).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSigningSecret())
    .update(dataBase64)
    .digest('base64url');

  return `${dataBase64}.${signature}`;
}

/**
 * Verify and decode an invite token
 */
export function verifyInviteToken(token: string): { email: string; role: string; exp: number } | null {
  try {
    if (!token || !token.includes('.')) return null;
    const [dataBase64, signature] = token.split('.');
    if (!dataBase64 || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', getSigningSecret())
      .update(dataBase64)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const jsonStr = Buffer.from(dataBase64, 'base64url').toString('utf8');
    const parsed = JSON.parse(jsonStr);

    if (!parsed || !parsed.email || typeof parsed.exp !== 'number') return null;
    if (Date.now() > parsed.exp) return null; // Expired

    return parsed;
  } catch {
    return null;
  }
}

export interface AdminSessionPayload {
  userId: string;
  email: string;
  role: string;
  exp: number;
}

/**
 * Generate signed session token for authenticated admin
 */
export function generateAdminSessionToken(user: { id: string; email: string; role: string }): string {
  const data = {
    userId: user.id,
    email: user.email.trim().toLowerCase(),
    role: user.role,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours validity
    nonce: crypto.randomBytes(8).toString('hex'),
  };

  const jsonStr = JSON.stringify(data);
  const dataBase64 = Buffer.from(jsonStr).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSigningSecret())
    .update(dataBase64)
    .digest('base64url');

  return `${dataBase64}.${signature}`;
}

/**
 * Verify signed admin session token from request cookie or Authorization header
 */
export function verifyAdminSessionToken(token: string): AdminSessionPayload | null {
  try {
    if (!token || !token.includes('.')) return null;
    const [dataBase64, signature] = token.split('.');
    if (!dataBase64 || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', getSigningSecret())
      .update(dataBase64)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const jsonStr = Buffer.from(dataBase64, 'base64url').toString('utf8');
    const parsed = JSON.parse(jsonStr);

    if (!parsed || !parsed.email || typeof parsed.exp !== 'number') return null;
    if (Date.now() > parsed.exp) return null;

    return parsed;
  } catch {
    return null;
  }
}
