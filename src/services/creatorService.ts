import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { CreatorProfile, ThemePreset, SocialLinks, CreatorPublicSettings } from '../types';

export const DEFAULT_SUGGESTED_AMOUNTS = [500, 1000, 2000, 5000];

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
const DEFAULT_COVER =
  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';

function mapDbCreatorProfile(row: Record<string, any>): CreatorProfile {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name || 'Creator',
    username: row.username,
    biography: row.biography || '',
    profileImage: row.profile_image || DEFAULT_AVATAR,
    coverImage: row.cover_image || DEFAULT_COVER,
    category: row.category || 'Creative & Tech',
    website: row.website || '',
    socialLinks: (row.social_links || {}) as SocialLinks,
    supportButtonText: row.support_button_text || 'Buy me data 📶',
    suggestedAmounts: Array.isArray(row.suggested_amounts) && row.suggested_amounts.length
      ? row.suggested_amounts.map(Number)
      : DEFAULT_SUGGESTED_AMOUNTS,
    currencyPreference: row.currency_preference || 'NGN',
    theme: (row.theme || 'crimson') as ThemePreset,
    publicSettings: (row.public_settings || {
      showTotalRaised: true,
      showSupporterCount: true,
      showSupporterMessages: true,
      allowAnonymous: true,
    }) as CreatorPublicSettings,
    published: row.published !== false,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export async function checkUsernameAvailability(
  username: string,
  currentUserId?: string
): Promise<boolean> {
  const clean = username.toLowerCase().trim().replace(/^@/, '');
  if (!clean || clean.length < 3 || clean.length > 30) return false;

  // Characters allowed: a-z, 0-9, underscore
  if (!/^[a-z0-9_]+$/.test(clean)) return false;

  // Forbidden reserved words for system routes
  const reserved = [
    'admin', 'dashboard', 'auth', 'login', 'register', 'checkout', 'api',
    'help', 'about', 'terms', 'privacy', 'payouts', 'docs', 'assets',
    'settings', 'notifications', 'how-it-works', 'faq', 'guidelines', 'refund-policy',
    'campaigns', 'explore', 'support', 'onboarding',
  ];
  if (reserved.includes(clean)) return false;

  if (!isSupabaseConfigured()) {
    return true;
  }

  try {
    const { data, error } = await supabase
      .from('creator_profiles')
      .select('user_id')
      .eq('username', clean)
      .maybeSingle();

    if (error) {
      console.warn('Supabase username lookup notice:', error.message);
      return true;
    }

    if (!data) return true;
    if (currentUserId && data.user_id === currentUserId) return true;
    return false;
  } catch (err) {
    console.warn('Username query notice:', err);
    return true;
  }
}

export async function getCreatorProfileByUsername(
  username: string
): Promise<CreatorProfile | null> {
  const clean = username.toLowerCase().trim().replace(/^@/, '');
  if (!clean || !isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('username', clean)
      .maybeSingle();

    if (error) {
      console.error('Error fetching creator profile by username:', error.message);
      return null;
    }

    return data ? mapDbCreatorProfile(data) : null;
  } catch (err) {
    console.error('Failed to fetch creator profile by username:', err);
    return null;
  }
}

export async function getCreatorProfileByUserId(
  userId: string
): Promise<CreatorProfile | null> {
  if (!userId || !isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching creator profile by userId:', error.message);
      return null;
    }

    return data ? mapDbCreatorProfile(data) : null;
  } catch (err) {
    console.warn('Could not fetch creator profile:', err);
    return null;
  }
}

export async function saveCreatorProfile(
  profile: Partial<CreatorProfile> & { userId: string }
): Promise<CreatorProfile> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please check your environment variables.');
  }

  const now = new Date().toISOString();
  const cleanUsername = (profile.username || `creator_${Date.now()}`)
    .toLowerCase()
    .trim()
    .replace(/^@/, '');

  const payload = {
    user_id: profile.userId,
    display_name: profile.displayName || 'Creator',
    username: cleanUsername,
    biography: profile.biography ?? '',
    profile_image: profile.profileImage || DEFAULT_AVATAR,
    cover_image: profile.coverImage || DEFAULT_COVER,
    category: profile.category || 'Creative & Tech',
    website: profile.website ?? '',
    social_links: profile.socialLinks || {},
    support_button_text: profile.supportButtonText || 'Buy me data 📶',
    suggested_amounts: profile.suggestedAmounts?.length
      ? profile.suggestedAmounts
      : DEFAULT_SUGGESTED_AMOUNTS,
    currency_preference: profile.currencyPreference || 'NGN',
    theme: profile.theme || 'crimson',
    public_settings: profile.publicSettings || {
      showTotalRaised: true,
      showSupporterCount: true,
      showSupporterMessages: true,
      allowAnonymous: true,
    },
    published: profile.published ?? true,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('creator_profiles')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to save creator profile in Supabase.');
  }

  // Keep users.username in sync cleanly
  await supabase
    .from('users')
    .update({ username: cleanUsername, updated_at: now })
    .eq('id', profile.userId);

  return mapDbCreatorProfile(data);
}

/**
 * Verifies database reachability without attempting anonymous writes blocked by RLS.
 */
export async function seedDemoDataIfEmpty(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('creator_profiles').select('id').limit(1);
  } catch (err) {
    console.warn('Supabase connectivity check skipped:', err);
  }
}
