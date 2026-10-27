import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Supports both modern Publishable API keys (sb_pub_...) and legacy anon keys (JWT ey...)
const supabasePublicKey = 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabasePublicKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project') &&
  !supabasePublicKey.includes('your-anon-key') &&
  !supabasePublicKey.includes('your-publishable-key')
);

let clientInstance: SupabaseClient | null = null;

/**
 * Creates or retrieves the singleton browser Supabase client.
 * If credentials are not yet set in .env.local, returns null safely.
 */
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null;
  }

  if (!clientInstance && supabaseUrl && supabasePublicKey) {
    clientInstance = createClient(supabaseUrl, supabasePublicKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return clientInstance;
}
