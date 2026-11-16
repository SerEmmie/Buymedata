import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  Campaign,
  CampaignUpdate,
  CampaignStatus,
  CampaignVisibility,
  Contribution,
  PaymentStatus,
} from '../types';
import { slugify } from '../utils/formatters';

export function mapDbCampaign(row: Record<string, any>): Campaign {
  return {
    id: row.id,
    creatorId: row.creator_id,
    creatorUsername: row.creator_username,
    creatorDisplayName: row.creator_display_name || undefined,
    creatorAvatar: row.creator_avatar || undefined,
    title: row.title,
    slug: row.slug,
    summary: row.summary || '',
    description: row.description || '',
    coverImage: row.cover_image || undefined,
    category: row.category || 'Creative & Tech',
    targetAmount: Number(row.target_amount || 0),
    currency: row.currency || 'NGN',
    amountRaised: Number(row.amount_raised || 0),
    contributorCount: Number(row.contributor_count || 0),
    status: (row.status || 'active') as CampaignStatus,
    visibility: (row.visibility || 'public') as CampaignVisibility,
    deadline: row.deadline || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function mapDbCampaignUpdate(row: Record<string, any>): CampaignUpdate {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    creatorId: row.creator_id,
    title: row.title,
    content: row.content || '',
    images: Array.isArray(row.images) ? row.images : [],
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapDbContribution(row: Record<string, any>): Contribution {
  return {
    id: row.id,
    creatorId: row.creator_id,
    creatorUsername: row.creator_username || undefined,
    campaignId: row.campaign_id || undefined,
    campaignTitle: row.campaign_title || undefined,
    supporterName: row.supporter_name || 'Anonymous Supporter',
    supporterEmail: row.supporter_email || '',
    amount: Number(row.amount || 0),
    currency: row.currency || 'NGN',
    message: row.message || '',
    anonymous: Boolean(row.anonymous),
    publicMessage: row.public_message !== false,
    paymentStatus: (row.payment_status || 'pending') as PaymentStatus,
    paymentTransactionId: row.payment_transaction_id || undefined,
    platformFee: Number(row.platform_fee || 0),
    netAmount: Number(row.net_amount || 0),
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export async function createCampaign(
  campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'amountRaised' | 'contributorCount'>
): Promise<Campaign> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const id = `cmp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();
  const baseSlug = slugify(campaignData.title);
  const slug = campaignData.slug || `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
  const cleanCreatorUsername = campaignData.creatorUsername.toLowerCase().trim().replace(/^@/, '');

  const payload = {
    id,
    creator_id: campaignData.creatorId,
    creator_username: cleanCreatorUsername,
    creator_display_name: campaignData.creatorDisplayName || null,
    creator_avatar: campaignData.creatorAvatar || null,
    title: campaignData.title,
    slug,
    summary: campaignData.summary || '',
    description: campaignData.description || '',
    cover_image: campaignData.coverImage || null,
    category: campaignData.category || 'Creative & Tech',
    target_amount: Number(campaignData.targetAmount || 0),
    currency: campaignData.currency || 'NGN',
    amount_raised: 0,
    contributor_count: 0,
    status: campaignData.status || 'active',
    visibility: campaignData.visibility || 'public',
    deadline: campaignData.deadline || null,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('campaigns')
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to create campaign.');
  }

  return mapDbCampaign(data);
}

export async function updateCampaign(campaignId: string, updates: Partial<Campaign>): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const dbUpdates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (updates.title !== undefined) dbUpdates.title = updates.title;
  if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
  if (updates.summary !== undefined) dbUpdates.summary = updates.summary;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.coverImage !== undefined) dbUpdates.cover_image = updates.coverImage || null;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.targetAmount !== undefined) dbUpdates.target_amount = Number(updates.targetAmount);
  if (updates.currency !== undefined) dbUpdates.currency = updates.currency;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility;
  if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline || null;

  const { error } = await supabase.from('campaigns').update(dbUpdates).eq('id', campaignId);
  if (error) {
    throw new Error(error.message || 'Failed to update campaign.');
  }
}

export async function setCampaignStatus(campaignId: string, status: CampaignStatus): Promise<void> {
  await updateCampaign(campaignId, { status });
}

export async function deleteCampaign(campaignId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.from('campaigns').delete().eq('id', campaignId);
  if (error) {
    throw new Error(error.message || 'Failed to delete campaign.');
  }
}

export async function getCampaignById(campaignId: string): Promise<Campaign | null> {
  if (!campaignId || !isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching campaign:', error.message);
      return null;
    }

    return data ? mapDbCampaign(data) : null;
  } catch (err) {
    console.error('Error fetching campaign:', err);
    return null;
  }
}

export async function getCampaignBySlug(creatorUsername: string, slug: string): Promise<Campaign | null> {
  if (!creatorUsername || !slug || !isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('creator_username', creatorUsername.toLowerCase().trim().replace(/^@/, ''))
      .eq('slug', slug)
      .maybeSingle();

    if (error) {
      console.error('Error fetching campaign by slug:', error.message);
      return null;
    }

    return data ? mapDbCampaign(data) : null;
  } catch (err) {
    console.error('Error fetching campaign by slug:', err);
    return null;
  }
}

export async function getCreatorCampaigns(creatorId: string): Promise<Campaign[]> {
  if (!creatorId || !isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting creator campaigns:', error.message);
      return [];
    }

    return (data || []).map(mapDbCampaign);
  } catch (err) {
    console.error('Error getting creator campaigns:', err);
    return [];
  }
}

export async function getPublicCampaigns(): Promise<Campaign[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('status', 'active')
      .eq('visibility', 'public')
      .order('created_at', { ascending: false })
      .limit(12);

    if (error) {
      console.error('Error getting public campaigns:', error.message);
      return [];
    }

    return (data || []).map(mapDbCampaign);
  } catch (err) {
    console.error('Error getting public campaigns:', err);
    return [];
  }
}

export async function getCampaignVerifiedProgress(campaignId: string): Promise<{
  verifiedAmount: number;
  contributorCount: number;
  contributions: Contribution[];
}> {
  if (!campaignId || !isSupabaseConfigured()) {
    return { verifiedAmount: 0, contributorCount: 0, contributions: [] };
  }

  try {
    const { data, error } = await supabase
      .from('contributions')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('payment_status', 'successful')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error computing verified campaign progress:', error.message);
      return { verifiedAmount: 0, contributorCount: 0, contributions: [] };
    }

    const successful = (data || []).map(mapDbContribution);
    const verifiedAmount = successful.reduce((sum, c) => sum + (c.amount || 0), 0);

    return {
      verifiedAmount,
      contributorCount: successful.length,
      contributions: successful,
    };
  } catch (err) {
    console.error('Error computing verified campaign progress:', err);
    return { verifiedAmount: 0, contributorCount: 0, contributions: [] };
  }
}

export async function addCampaignUpdate(
  campaignId: string,
  creatorId: string,
  title: string,
  content: string,
  images: string[] = []
): Promise<CampaignUpdate> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const id = `upd_${Date.now()}`;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('campaign_updates')
    .insert({
      id,
      campaign_id: campaignId,
      creator_id: creatorId,
      title,
      content,
      images,
      created_at: now,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to add campaign update.');
  }

  return mapDbCampaignUpdate(data);
}

export async function deleteCampaignUpdate(updateId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.from('campaign_updates').delete().eq('id', updateId);
  if (error) {
    throw new Error(error.message || 'Failed to delete campaign update.');
  }
}

export async function getCampaignUpdates(campaignId: string): Promise<CampaignUpdate[]> {
  if (!campaignId || !isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('campaign_updates')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting campaign updates:', error.message);
      return [];
    }

    return (data || []).map(mapDbCampaignUpdate);
  } catch (err) {
    console.error('Error getting campaign updates:', err);
    return [];
  }
}
