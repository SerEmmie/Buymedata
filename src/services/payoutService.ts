import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { PaymentAccount, Payout, PayoutStatus } from '../types';
import { getPlatformSettings, getCreatorFinancialSummary } from './paymentService';
import { createNotification } from './notificationService';
import { getUserProfile } from './authService';

function mapDbPaymentAccount(row: Record<string, any>): PaymentAccount {
  return {
    id: row.id,
    userId: row.user_id,
    provider: row.provider || 'bachs',
    bankName: row.bank_name,
    bankCode: row.bank_code,
    maskedAccountNumber: row.masked_account_number,
    accountNumber: row.account_number || undefined,
    accountName: row.account_name,
    verificationStatus: row.verification_status || 'verified',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

export function mapDbPayout(row: Record<string, any>): Payout {
  return {
    id: row.id,
    creatorId: row.creator_id,
    amount: Number(row.amount || 0),
    fee: Number(row.fee || 0),
    netAmount: Number(row.net_amount || 0),
    currency: row.currency || 'NGN',
    payoutAccountId: row.payout_account_id,
    bankDetails: row.bank_details || {
      bankName: '',
      maskedAccountNumber: '',
      accountName: '',
    },
    providerReference: row.provider_reference || undefined,
    status: (row.status || 'pending') as PayoutStatus,
    failureReason: row.failure_reason || undefined,
    requestedAt: row.requested_at || new Date().toISOString(),
    processedAt: row.processed_at || undefined,
    completedAt: row.completed_at || undefined,
  };
}

export async function getCreatorPaymentAccount(userId: string): Promise<PaymentAccount | null> {
  if (!userId || !isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('payment_accounts')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error getting payment account:', error.message);
      return null;
    }

    return data ? mapDbPaymentAccount(data) : null;
  } catch (err) {
    console.error('Error getting payment account:', err);
    return null;
  }
}

export async function savePaymentAccount(accountData: {
  userId: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}): Promise<PaymentAccount> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const maskedAccountNumber = `•••• ${accountData.accountNumber.slice(-4)}`;
  const id = `pacc_${accountData.userId}`;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('payment_accounts')
    .upsert(
      {
        id,
        user_id: accountData.userId,
        provider: 'bachs',
        bank_name: accountData.bankName,
        bank_code: accountData.bankCode,
        masked_account_number: maskedAccountNumber,
        account_number: accountData.accountNumber,
        account_name: accountData.accountName,
        verification_status: 'verified',
        updated_at: now,
      },
      { onConflict: 'id' }
    )
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to save bank account.');
  }

  return mapDbPaymentAccount(data);
}

export async function requestPayout(
  creatorId: string,
  amount: number,
  paymentAccount: PaymentAccount
): Promise<Payout> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const user = await getUserProfile(creatorId);
  if (user?.accountStatus === 'suspended') {
    throw new Error(
      'Your account is currently under administrative restriction. Payout requests are restricted.'
    );
  }

  const settings = await getPlatformSettings();
  const summary = await getCreatorFinancialSummary(creatorId);

  if (amount < settings.minimumPayout) {
    throw new Error(`Minimum payout request is ₦${settings.minimumPayout.toLocaleString()}`);
  }

  if (amount > summary.availableBalance) {
    throw new Error(
      `Insufficient available balance. You have ₦${summary.availableBalance.toLocaleString()} available.`
    );
  }

  const fee = settings.payoutFee || 50;
  const netAmount = amount - fee;
  const payoutId = `pyo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const providerReference = `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const now = new Date().toISOString();

  const bankDetails = {
    bankName: paymentAccount.bankName,
    maskedAccountNumber: paymentAccount.maskedAccountNumber,
    accountName: paymentAccount.accountName,
  };

  const { data, error } = await supabase
    .from('payouts')
    .insert({
      id: payoutId,
      creator_id: creatorId,
      amount,
      fee,
      net_amount: netAmount,
      currency: 'NGN',
      payout_account_id: paymentAccount.id,
      bank_details: bankDetails,
      provider_reference: providerReference,
      status: 'pending',
      requested_at: now,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message || 'Failed to submit payout request.');
  }

  await createNotification({
    userId: creatorId,
    title: 'Payout Request Submitted',
    message: `Your withdrawal of ₦${amount.toLocaleString()} to ${paymentAccount.bankName} (${paymentAccount.maskedAccountNumber}) is pending processing.`,
    type: 'system_alert',
    relatedResourceId: payoutId,
  });

  return mapDbPayout(data);
}

export async function getCreatorPayouts(creatorId: string): Promise<Payout[]> {
  if (!creatorId || !isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('creator_id', creatorId)
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error fetching creator payouts:', error.message);
      return [];
    }

    return (data || []).map(mapDbPayout);
  } catch (err) {
    console.error('Error fetching creator payouts:', err);
    return [];
  }
}
