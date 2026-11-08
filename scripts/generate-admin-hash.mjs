import crypto from 'crypto';

// Parameters
const email = (process.argv[2] || 'admin@talentpulse.com').trim().toLowerCase();
const customPassword = process.argv[3];

// Generate salt & password
const salt = crypto.randomBytes(16).toString('hex');
const password = customPassword || 'AdminPass_' + crypto.randomBytes(6).toString('base64url') + '!';

// PBKDF2 SHA-512, 100,000 iterations, 64-byte key length (matching lib/auth/admin-password.ts)
const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');

console.log('================================================================');
console.log('  TALENTPULSE DIRECT - ADMIN PASSWORD RECOVERY TOOL');
console.log('================================================================');
console.log(`Target Email:   ${email}`);
console.log(`New Password:   ${password}`);
console.log(`Salt:           ${salt}`);
console.log(`Hash (PBKDF2):  ${hash}`);
console.log('================================================================');
console.log('\n--- OPTION 1: Run this SQL query in your Supabase SQL Editor ---\n');
console.log(`INSERT INTO public.admin_users (email, password_hash, salt, full_name, role, is_active, last_login_at)
VALUES (
  '${email}',
  '${hash}',
  '${salt}',
  'Super Admin',
  'super_admin',
  true,
  NULL
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  salt = EXCLUDED.salt,
  role = 'super_admin',
  is_active = true,
  last_login_at = NULL,
  updated_at = NOW();`);
console.log('\n================================================================\n');
