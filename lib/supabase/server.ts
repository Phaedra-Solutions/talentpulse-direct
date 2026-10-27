import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Supports both modern Secret API key (sb_sec_...) and legacy service_role key
const supabaseSecretKey = 
  process.env.SUPABASE_SECRET_KEY || 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isServerSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseSecretKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project') &&
  !supabaseSecretKey.includes('your-secret-key') &&
  !supabaseSecretKey.includes('your-service-role-key')
);

/**
 * Creates a server-side Supabase client for Server Actions and Route Handlers.
 * Uses service role key when available to bypass RLS for administrative actions,
 * or anon key if service role is omitted.
 */
export function getSupabaseServerClient(): SupabaseClient | null {
  if (!isServerSupabaseConfigured || !supabaseUrl || !supabaseSecretKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
