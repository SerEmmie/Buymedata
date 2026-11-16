import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  Contribution,
  PaymentTransaction,
  PaymentProvider,
  PaymentStatus,
  PlatformSettings,
} from '../types';

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  platformFeePercentage: 5.0,
  minimumContribution: 200,
  maximumContribution: 5000000,
  minimumPayout: 2000,
  payoutFee: 50,
  supportedCurrencies: ['NGN'],
  maintenanceMode: false,
  updatedAt: new Date().toISOString(),
};

function mapDbPlatformSettings(row: Record<string, any>): PlatformSettings {
  return {
    platformFeePercentage: Number(row.platform_fee_percentage ?? 5.0),
    minimumContribution: Number(row.minimum_contribution ?? 200),
    maximumContribution: Number(row.maximum_contribution ?? 5000000),
    minimumPayout: Number(row.minimum_payout ?? 2000),
    payoutFee: Number(row.payout_fee ?? 50),
    supportedCurrencies: Array.isArray(row.supported_currencies) ? row.supported_currencies : ['NGN'],
    maintenanceMode: Boolean(row.maintenance_mode),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function mapDbContribution(row: Record<string, any>): Contribution {
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

export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (!isSupabaseConfigured()) return DEFAULT_PLATFORM_SETTINGS;

  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .eq('id', 'global')
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_PLATFORM_SETTINGS;
    }

    return mapDbPlatformSettings(data);
  } catch (err) {
    console.warn('Using default platform settings:', err);
    return DEFAULT_PLATFORM_SETTINGS;
  }
}

/**
 * Initializes a pending contribution & payment transaction record in Supabase PostgreSQL.
 */
export async function initializeContribution(data: {
  creatorId: string;
  creatorUsername?: string;
  campaignId?: string;
  campaignTitle?: string;
  supporterName: string;
  supporterEmail: string;
  amount: number;
  currency: string;
  message?: string;
  anonymous: boolean;
  publicMessage: boolean;
}): Promise<{ contribution: Contribution; transactionRecord: PaymentTransaction }> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const settings = await getPlatformSettings();

  if (data.amount < settings.minimumContribution) {
    throw new Error(`Minimum contribution is ₦${settings.minimumContribution.toLocaleString()}`);
  }
  if (data.amount > settings.maximumContribution) {
    throw new Error(`Maximum single contribution is ₦${settings.maximumContribution.toLocaleString()}`);
  }

  const contributionId = `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const providerReference = `BMD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const now = new Date().toISOString();

  const fee = Math.round(data.amount * (settings.platformFeePercentage / 100) * 100) / 100;
  const net = data.amount - fee;

  const contribution: Contribution = {
    id: contributionId,
    creatorId: data.creatorId,
    creatorUsername: data.creatorUsername,
    campaignId: data.campaignId || undefined,
    campaignTitle: data.campaignTitle,
    supporterName: data.anonymous
      ? 'Generous Believer'
      : data.supporterName || 'Anonymous Supporter',
    supporterEmail: data.supporterEmail,
    amount: data.amount,
    currency: data.currency || 'NGN',
    message: data.message || '',
    anonymous: data.anonymous,
    publicMessage: data.publicMessage,
    paymentStatus: 'pending',
    paymentTransactionId: transactionId,
    platformFee: fee,
    netAmount: net,
    createdAt: now,
  };

  const transactionRecord: PaymentTransaction = {
    id: transactionId,
    contributionId,
    provider: 'bachs',
    providerReference,
    amount: data.amount,
    currency: data.currency || 'NGN',
    status: 'pending',
    idempotencyKey: `idemp_${contributionId}`,
    createdAt: now,
    updatedAt: now,
  };

  // Insert without .select() so anonymous supporters can initialize checkout under RLS
  const { error: contribErr } = await supabase.from('contributions').insert({
    id: contributionId,
    creator_id: data.creatorId,
    creator_username: data.creatorUsername || null,
    campaign_id: data.campaignId || null,
    campaign_title: data.campaignTitle || null,
    supporter_name: contribution.supporterName,
    supporter_email: contribution.supporterEmail,
    amount: contribution.amount,
    currency: contribution.currency,
    message: contribution.message || '',
    anonymous: contribution.anonymous,
    public_message: contribution.publicMessage,
    payment_status: 'pending',
    payment_transaction_id: transactionId,
    platform_fee: fee,
    net_amount: net,
    created_at: now,
    updated_at: now,
  });

  if (contribErr) {
    throw new Error(contribErr.message || 'Failed to record contribution.');
  }

  const { error: txnErr } = await supabase.from('payment_transactions').insert({
    id: transactionId,
    contribution_id: contributionId,
    provider: 'bachs',
    provider_reference: providerReference,
    amount: data.amount,
    currency: contribution.currency,
    status: 'pending',
    idempotency_key: transactionRecord.idempotencyKey,
    created_at: now,
    updated_at: now,
  });

  if (txnErr) {
    throw new Error(txnErr.message || 'Failed to create payment transaction.');
  }

  return { contribution, transactionRecord };
}

/**
 * Initializes a payment checkout session on the backend Bachs.io API.
 */
export async function initializeBachsPayment(params: {
  email: string;
  amount: number;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
}): Promise<{
  success: boolean;
  checkoutUrl?: string;
  authorizationUrl?: string;
  accessCode?: string;
  reference: string;
  mode: 'test' | 'live';
}> {
  const res = await fetch('/api/payments/initialize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to initialize payment gateway.');
  }

  return {
    success: true,
    checkoutUrl: data.data?.checkout_url || data.data?.authorization_url,
    authorizationUrl: data.data?.authorization_url || data.data?.checkout_url,
    accessCode: data.data?.access_code || data.data?.id,
    reference: data.data?.reference || params.reference,
    mode: data.mode || 'test',
  };
}

export const initializePaystackPayment = initializeBachsPayment;

/**
 * Strictly verifies a transaction on the Express backend and commits atomic
 * Supabase double-entry ledger entries.
 */
export async function verifyPaymentOnServer(reference: string): Promise<{
  success: boolean;
  alreadyProcessed: boolean;
  contributionId: string;
  reference: string;
  amount: number;
  netAmount: number;
  platformFee: number;
  creatorId: string;
}> {
  const res = await fetch('/api/payments/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reference }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Server verification rejected the payment transaction.');
  }

  return data;
}

/**
 * Backward-compatible finalization helper delegating settlement to the server verification API.
 */
export async function finalizePayment(
  contributionId: string,
  transactionId: string,
  _provider: PaymentProvider = 'bachs',
  providerReference?: string
): Promise<{ success: boolean; contribution: Contribution }> {
  const ref = providerReference || transactionId;
  await verifyPaymentOnServer(ref);

  const { data } = await supabase
    .from('contributions')
    .select('*')
    .eq('id', contributionId)
    .maybeSingle();

  if (!data) {
    throw new Error('Contribution not found after verification.');
  }

  return {
    success: true,
    contribution: mapDbContribution(data),
  };
}

export async function getCreatorFinancialSummary(creatorId: string): Promise<{
  grossContributions: number;
  platformFees: number;
  netEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
}> {
  if (!creatorId || !isSupabaseConfigured()) {
    return {
      grossContributions: 0,
      platformFees: 0,
      netEarnings: 0,
      availableBalance: 0,
      pendingBalance: 0,
      totalWithdrawn: 0,
    };
  }

  try {
    const [contribRes, payoutsRes] = await Promise.all([
      supabase
        .from('contributions')
        .select('amount, platform_fee, net_amount, payment_status')
        .eq('creator_id', creatorId),
      supabase
        .from('payouts')
        .select('amount, status')
        .eq('creator_id', creatorId),
    ]);

    let grossContributions = 0;
    let platformFees = 0;
    let netEarnings = 0;
    let pendingBalance = 0;

    (contribRes.data || []).forEach((c: any) => {
      const amount = Number(c.amount || 0);
      if (c.payment_status === 'successful') {
        grossContributions += amount;
        platformFees += Number(c.platform_fee || 0);
        netEarnings += Number(c.net_amount || 0);
      } else if (c.payment_status === 'pending') {
        pendingBalance += amount;
      }
    });

    let totalWithdrawn = 0;
    let inFlightPayouts = 0;

    (payoutsRes.data || []).forEach((p: any) => {
      const amount = Number(p.amount || 0);
      if (p.status === 'successful') {
        totalWithdrawn += amount;
      } else if (p.status === 'pending' || p.status === 'processing') {
        inFlightPayouts += amount;
      }
    });

    const availableBalance = Math.max(0, netEarnings - totalWithdrawn - inFlightPayouts);

    return {
      grossContributions,
      platformFees,
      netEarnings,
      availableBalance,
      pendingBalance,
      totalWithdrawn,
    };
  } catch (err) {
    console.error('Error calculating financial summary:', err);
    return {
      grossContributions: 0,
      platformFees: 0,
      netEarnings: 0,
      availableBalance: 0,
      pendingBalance: 0,
      totalWithdrawn: 0,
    };
  }
}

export async function getCreatorContributions(creatorId: string): Promise<Contribution[]> {
  if (!creatorId || !isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('contributions')
      .select('*')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching creator contributions:', error.message);
      return [];
    }

    return (data || []).map(mapDbContribution);
  } catch (err) {
    console.error('Error fetching creator contributions:', err);
    return [];
  }
}

export async function getPublicSupporterMessages(creatorId: string): Promise<Contribution[]> {
  if (!creatorId || !isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('contributions')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('payment_status', 'successful')
      .eq('public_message', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching public supporter messages:', error.message);
      return [];
    }

    return (data || [])
      .map(mapDbContribution)
      .filter((c) => Boolean(c.message && c.message.trim().length > 0));
  } catch (err) {
    console.error('Error fetching public supporter messages:', err);
    return [];
  }
}
