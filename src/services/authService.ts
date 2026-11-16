import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { User, UserRole } from '../types';
import {
  saveCreatorProfile,
  getCreatorProfileByUserId,
  checkUsernameAvailability,
} from './creatorService';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

export function mapSupabaseUser(su: SupabaseUser): AuthUser {
  const meta = su.user_metadata || {};
  return {
    uid: su.id,
    email: su.email || null,
    displayName: meta.full_name || meta.name || su.email?.split('@')[0] || 'Creator',
    photoURL: meta.avatar_url || meta.picture || null,
    emailVerified: Boolean(su.email_confirmed_at || su.confirmed_at),
  };
}

function sanitizeUsernameCandidate(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .trim()
    .replace(/^@/, '')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 24);
  return cleaned.length >= 3 ? cleaned : `creator_${Math.random().toString(36).slice(2, 6)}`;
}

async function resolveUniqueUsername(candidate: string, currentUserId: string): Promise<string> {
  const base = sanitizeUsernameCandidate(candidate);
  const avail = await checkUsernameAvailability(base, currentUserId);
  if (avail) return base;
  return `${base.slice(0, 20)}_${Math.random().toString(36).slice(2, 6)}`;
}

function mapDbUser(row: Record<string, any>): User {
  return {
    uid: row.id,
    fullName: row.full_name || 'Creator',
    email: row.email || '',
    username: row.username || '',
    role: (row.role || 'creator') as UserRole,
    accountStatus: row.account_status || 'active',
    emailVerified: Boolean(row.email_verified),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

/**
 * Ensures the signed-in Supabase Auth user has corresponding rows in
 * `public.users` and `public.creator_profiles`. Runs safely on signup, login,
 * Google OAuth callback, and Magic Link return.
 */
export async function ensureUserAndCreatorProfile(
  su: SupabaseUser,
  preferredUsername?: string
): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;

  const existingUser = await getUserProfile(su.id);
  const meta = su.user_metadata || {};
  const storedClaim =
    typeof window !== 'undefined'
      ? window.localStorage.getItem('buymedata_claimed_username') || ''
      : '';

  const rawName =
    meta.full_name ||
    meta.name ||
    existingUser?.fullName ||
    su.email?.split('@')[0] ||
    'Creator';

  let userRecord = existingUser;

  if (!userRecord) {
    const candidate =
      preferredUsername ||
      meta.claimed_username ||
      storedClaim ||
      su.email?.split('@')[0] ||
      `user_${su.id.slice(0, 6)}`;

    const uniqueUsername = await resolveUniqueUsername(candidate, su.id);
    const finalRole: UserRole = su.email === 'EmmybikeCEO@gmail.com' ? 'admin' : 'creator';
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          id: su.id,
          email: su.email || '',
          full_name: rawName,
          username: uniqueUsername,
          role: finalRole,
          account_status: 'active',
          email_verified: Boolean(su.email_confirmed_at || su.confirmed_at),
          created_at: now,
          updated_at: now,
        },
        { onConflict: 'id' }
      )
      .select('*')
      .single();

    if (error) {
      console.error('Error creating user profile in Supabase:', error.message);
      throw new Error(error.message);
    }

    userRecord = mapDbUser(data);
  }

  // Ensure Creator Profile exists
  const existingCreator = await getCreatorProfileByUserId(su.id);
  if (!existingCreator && (userRecord.role === 'creator' || userRecord.role === 'admin')) {
    const creatorUsername = await resolveUniqueUsername(
      userRecord.username || preferredUsername || storedClaim || rawName,
      su.id
    );
    await saveCreatorProfile({
      userId: su.id,
      displayName: userRecord.fullName || rawName,
      username: creatorUsername,
      profileImage: meta.avatar_url || meta.picture || undefined,
      published: true,
      theme: 'crimson',
    }).catch((err) => console.warn('Creator profile auto-init notice:', err));
  }

  if (typeof window !== 'undefined' && storedClaim) {
    window.localStorage.removeItem('buymedata_claimed_username');
  }

  return userRecord;
}

export function getSafePostAuthPath(nextPath?: string | null): string {
  const candidate =
    nextPath ||
    (typeof window !== 'undefined' ? window.localStorage.getItem('buymedata_post_auth_next') : null);
  if (candidate && candidate.startsWith('/') && !candidate.startsWith('//')) {
    return candidate;
  }
  return '/dashboard';
}

export async function registerWithEmail(
  fullName: string,
  email: string,
  password: string,
  username: string,
  role: UserRole = 'creator',
  nextPath?: string
): Promise<{ user: AuthUser; sessionActive: boolean }> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured yet. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.'
    );
  }

  const cleanUsername = sanitizeUsernameCandidate(username);
  const safeNext = getSafePostAuthPath(nextPath);
  if (typeof window !== 'undefined' && nextPath) {
    window.localStorage.setItem('buymedata_post_auth_next', safeNext);
  }
  const redirectUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${safeNext}` : undefined;

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        full_name: fullName || cleanUsername,
        claimed_username: cleanUsername,
        requested_role: role === 'admin' ? 'creator' : role,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Registration did not return a user account. Please try again.');
  }

  if (data.session) {
    await ensureUserAndCreatorProfile(data.user, cleanUsername);
    return { user: mapSupabaseUser(data.user), sessionActive: true };
  }

  // Email confirmation is enabled in Supabase: save username hint for first verified login
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('buymedata_claimed_username', cleanUsername);
  }

  return { user: mapSupabaseUser(data.user), sessionActive: false };
}

export async function loginWithEmail(email: string, password: string): Promise<AuthUser> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured yet. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.'
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Sign in succeeded but no user was returned.');
  }

  await ensureUserAndCreatorProfile(data.user);
  return mapSupabaseUser(data.user);
}

/**
 * Sends a passwordless one-time magic link to the user's email via Supabase Auth.
 */
export async function sendOneTimeEmailLink(
  email: string,
  claimedUsername?: string,
  nextPath?: string
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured yet. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.'
    );
  }

  const cleanClaim = claimedUsername ? sanitizeUsernameCandidate(claimedUsername) : undefined;
  const safeNext = getSafePostAuthPath(nextPath);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('buymedata_email_for_link', email.trim());
    if (cleanClaim) {
      window.localStorage.setItem('buymedata_claimed_username', cleanClaim);
    }
    if (nextPath) {
      window.localStorage.setItem('buymedata_post_auth_next', safeNext);
    }
  }

  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: {
      emailRedirectTo:
        typeof window !== 'undefined' ? `${window.location.origin}${safeNext}` : undefined,
      data: cleanClaim ? { claimed_username: cleanClaim } : undefined,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Initiates Google OAuth sign-in via Supabase Auth.
 * Supabase redirects the browser to Google and back to `/dashboard` (or `?next=`).
 */
export async function loginWithGoogle(claimedUsername?: string, nextPath?: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured yet. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.'
    );
  }

  const safeNext = getSafePostAuthPath(nextPath);
  if (typeof window !== 'undefined') {
    if (claimedUsername) {
      window.localStorage.setItem(
        'buymedata_claimed_username',
        sanitizeUsernameCandidate(claimedUsername)
      );
    }
    if (nextPath) {
      window.localStorage.setItem('buymedata_post_auth_next', safeNext);
    }
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo:
        typeof window !== 'undefined' ? `${window.location.origin}${safeNext}` : undefined,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getUserProfile(uid: string): Promise<User | null> {
  if (!uid || !isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (error) {
      console.error('Failed to get user profile from Supabase:', error.message);
      return null;
    }

    return data ? mapDbUser(data) : null;
  } catch (err) {
    console.error('Failed to get user profile:', err);
    return null;
  }
}

export async function resetPassword(email: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured yet.');
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo:
      typeof window !== 'undefined' ? `${window.location.origin}/dashboard/settings` : undefined,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function logoutUser(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Supabase sign out error:', error.message);
  }
}
