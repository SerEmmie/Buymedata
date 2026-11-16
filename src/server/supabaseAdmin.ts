import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const serverUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const serviceRoleKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  ''
).trim();

const validUrl = serverUrl && serverUrl.startsWith('http') ? serverUrl : 'https://placeholder.supabase.co';
const validKey = serviceRoleKey && serviceRoleKey.length > 10 ? serviceRoleKey : 'placeholder-service-key';

/**
 * Checks whether valid server-side Supabase credentials are configured.
 */
export function isSupabaseAdminConfigured(): boolean {
  return Boolean(
    serverUrl &&
    serverUrl.startsWith('http') &&
    !serverUrl.includes('placeholder') &&
    !serverUrl.includes('YOUR_PROJECT_REF') &&
    serviceRoleKey &&
    serviceRoleKey.length > 20 &&
    !serviceRoleKey.includes('placeholder') &&
    !serviceRoleKey.includes('YOUR_SERVICE_ROLE_KEY')
  );
}

/**
 * Lists missing Supabase environment variables for diagnostics without exposing secrets.
 */
export function getMissingSupabaseEnvVars(): string[] {
  const missing: string[] = [];
  if (!process.env.VITE_SUPABASE_URL && !process.env.SUPABASE_URL) {
    missing.push('VITE_SUPABASE_URL');
  }
  if (!process.env.VITE_SUPABASE_ANON_KEY && !process.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    missing.push('VITE_SUPABASE_ANON_KEY (or VITE_SUPABASE_PUBLISHABLE_KEY)');
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    missing.push('SUPABASE_SERVICE_ROLE_KEY');
  }
  return missing;
}

/**
 * Verifies live server-side connectivity to Supabase.
 */
export async function checkServerSupabaseStatus(): Promise<{
  configured: boolean;
  connected: boolean;
  schemaReady: boolean;
  missingVars: string[];
  error?: string;
}> {
  const missingVars = getMissingSupabaseEnvVars();
  const configured = isSupabaseAdminConfigured();

  if (!configured) {
    return {
      configured: false,
      connected: false,
      schemaReady: false,
      missingVars,
      error: `Missing Supabase credentials: ${missingVars.join(', ')}`,
    };
  }

  try {
    // 1. Verify live authenticated API reachability via Supabase Auth Admin
    const { error: authError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (authError) {
      return {
        configured: true,
        connected: false,
        schemaReady: false,
        missingVars,
        error: authError.message,
      };
    }

    // 2. Verify PostgreSQL tables have been migrated
    const { error: dbError } = await supabaseAdmin.from('users').select('id').limit(1);
    if (dbError) {
      return {
        configured: true,
        connected: true,
        schemaReady: false,
        missingVars,
        error: dbError.message,
      };
    }

    return {
      configured: true,
      connected: true,
      schemaReady: true,
      missingVars,
    };
  } catch (err) {
    return {
      configured: true,
      connected: false,
      schemaReady: false,
      missingVars,
      error: err instanceof Error ? err.message : 'Supabase connection error',
    };
  }
}

/**
 * Server-side Supabase client with elevated privileges for webhook reconciliation,
 * double-entry ledger settlement, and administrative tasks.
 * This client runs strictly inside Node.js and is NEVER bundled into client-side code.
 */
export const supabaseAdmin: SupabaseClient = createClient(validUrl, validKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
