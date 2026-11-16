import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Support both VITE_SUPABASE_ANON_KEY and VITE_SUPABASE_PUBLISHABLE_KEY
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  ''
).trim();

const validUrl = supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co';
const validKey = supabaseKey && supabaseKey.length > 10 ? supabaseKey : 'placeholder-anon-key';

/**
 * Checks whether valid Supabase client credentials have been supplied.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('placeholder') &&
    !supabaseUrl.includes('YOUR_PROJECT_REF') &&
    supabaseKey &&
    supabaseKey.length > 20 &&
    !supabaseKey.includes('placeholder') &&
    !supabaseKey.includes('YOUR_ANON_KEY')
  );
}

/**
 * Client-side Supabase client singleton for browser data querying, storage, and authentication.
 * Never uses the service role key.
 */
export const supabase: SupabaseClient = createClient(validUrl, validKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
});

/**
 * Verifies live browser-side connectivity to Supabase PostgreSQL.
 */
export async function testSupabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return {
      connected: false,
      error: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY.',
    };
  }
  try {
    const { error } = await supabase.from('creator_profiles').select('id').limit(1);
    if (error) {
      return { connected: false, error: error.message };
    }
    return { connected: true };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : 'Unable to reach Supabase.',
    };
  }
}
