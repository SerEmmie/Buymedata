import { supabaseAdmin } from './supabaseAdmin';
import { bachsClient } from './bachs';
import { Payout, PayoutStatus } from '../types';

export interface CreatorBalanceSummary {
  creatorId: string;
  availableBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  inFlightPayouts: number;
}

/**
 * Calculates genuine creator balance directly from immutable double-entry ledger entries
 * stored in Supabase PostgreSQL.
 */
export async function calculateServerCreatorBalance(creatorId: string): Promise<CreatorBalanceSummary> {
  const [ledgerRes, payoutRes] = await Promise.all([
    supabaseAdmin
      .from('ledger_entries')
      .select('account_type, entry_type, amount')
      .eq('account_owner', creatorId),
    supabaseAdmin
      .from('payouts')
      .select('amount, status')
      .eq('creator_id', creatorId),
  ]);

  let totalEarned = 0;
  let debitedFromAvailable = 0;

  (ledgerRes.data || []).forEach((entry: any) => {
    if (entry.account_type === 'CREATOR_AVAILABLE') {
      const amount = Number(entry.amount || 0);
      if (entry.entry_type === 'CREDIT') {
        totalEarned += amount;
      } else if (entry.entry_type === 'DEBIT') {
        debitedFromAvailable += amount;
      }
    }
  });

  let inFlightPayouts = 0;
  let totalWithdrawn = 0;

  (payoutRes.data || []).forEach((p: any) => {
    const amount = Number(p.amount || 0);
    if (p.status === 'successful') {
      totalWithdrawn += amount;
    } else if (p.status === 'pending' || p.status === 'processing') {
      inFlightPayouts += amount;
    }
  });

  const availableBalance = Math.max(0, totalEarned - debitedFromAvailable - inFlightPayouts);

  return {
    creatorId,
    availableBalance,
    totalEarned,
    totalWithdrawn,
    inFlightPayouts,
  };
}

/**
 * Executes a payout withdrawal for a creator via Bachs.io and records
 * immutable double-entry ledger entries in Supabase PostgreSQL.
 */
export async function processServerPayout(params: {
  creatorId: string;
  amount: number;
  paymentAccountId: string;
}): Promise<{ success: boolean; payout: Payout }> {
  const { creatorId, amount, paymentAccountId } = params;

  // 1. Validate creator account status
  const { data: userRow } = await supabaseAdmin
    .from('users')
    .select('account_status')
    .eq('id', creatorId)
    .maybeSingle();

  if (userRow?.account_status === 'suspended') {
    throw new Error(
      'Your account is under administrative review. Payout withdrawals are currently disabled.'
    );
  }

  // 2. Verify minimum withdrawal limit
  if (amount < 2000) {
    throw new Error('Minimum payout threshold is ₦2,000.');
  }

  // 3. Verify available balance strictly from ledger
  const balanceSummary = await calculateServerCreatorBalance(creatorId);
  if (amount > balanceSummary.availableBalance) {
    throw new Error(
      `Insufficient available balance. You have ₦${balanceSummary.availableBalance.toLocaleString()} available for payout.`
    );
  }

  // 4. Fetch destination bank account
  const { data: paymentAccount, error: accErr } = await supabaseAdmin
    .from('payment_accounts')
    .select('*')
    .eq('id', paymentAccountId)
    .maybeSingle();

  if (accErr || !paymentAccount) {
    throw new Error('Selected bank account was not found.');
  }

  // 5. Initiate Bachs Payout
  const payoutId = `pyo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const transferRef = `BMD-TRF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const now = new Date().toISOString();
  const fee = 50;
  const netAmount = amount - fee;

  const rawAccountNumber =
    paymentAccount.account_number ||
    String(paymentAccount.masked_account_number || '').replace(/\D/g, '');

  const transferRes = await bachsClient.createPayout({
    amount: netAmount,
    accountNumber: rawAccountNumber,
    bankCode: paymentAccount.bank_code,
    accountName: paymentAccount.account_name,
    reason: `BuyMeData creator withdrawal (${creatorId})`,
    reference: transferRef,
  });

  const transferStatus = transferRes.data.status;
  const isSuccessful = transferStatus === 'success';
  const payoutStatus: PayoutStatus = isSuccessful ? 'successful' : 'processing';

  const bankDetails = {
    bankName: paymentAccount.bank_name,
    maskedAccountNumber: paymentAccount.masked_account_number,
    accountName: paymentAccount.account_name,
  };

  // 6. Insert payout record
  const { error: payoutErr } = await supabaseAdmin.from('payouts').insert({
    id: payoutId,
    creator_id: creatorId,
    amount,
    fee,
    net_amount: netAmount,
    currency: 'NGN',
    payout_account_id: paymentAccount.id,
    bank_details: bankDetails,
    provider_reference: transferRef,
    status: payoutStatus,
    requested_at: now,
    processed_at: isSuccessful ? now : null,
  });

  if (payoutErr) {
    throw new Error(`Failed to record payout: ${payoutErr.message}`);
  }

  // If transfer was executed immediately, record ledger entries
  if (isSuccessful) {
    const ledgerTxnId = `ltxn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const ts = Date.now();
    await supabaseAdmin.from('ledger_entries').insert([
      {
        id: `led_${ts}_1`,
        ledger_transaction_id: ledgerTxnId,
        account_owner: creatorId,
        account_type: 'CREATOR_AVAILABLE',
        entry_type: 'DEBIT',
        amount,
        currency: 'NGN',
        description: `Payout withdrawal to ${paymentAccount.bank_name} (${paymentAccount.masked_account_number})`,
        reference_id: payoutId,
        created_at: now,
      },
      {
        id: `led_${ts}_2`,
        ledger_transaction_id: ledgerTxnId,
        account_owner: 'PLATFORM',
        account_type: 'PAYOUT_OUTFLOW',
        entry_type: 'CREDIT',
        amount,
        currency: 'NGN',
        description: `Disbursement to bank account ${paymentAccount.masked_account_number} (Ref: ${transferRef})`,
        reference_id: payoutId,
        created_at: now,
      },
    ]);
  }

  // In-app notification
  const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  await supabaseAdmin.from('notifications').insert({
    id: notifId,
    user_id: creatorId,
    title: isSuccessful ? '💸 Payout Disbursed!' : '⏳ Payout Processing',
    message: isSuccessful
      ? `Your withdrawal of ₦${netAmount.toLocaleString()} has been sent to your ${paymentAccount.bank_name} account.`
      : `Your withdrawal of ₦${netAmount.toLocaleString()} is processing via Bachs transfers.`,
    type: 'payout_processed',
    is_read: false,
    related_resource_id: payoutId,
    created_at: now,
  });

  const payout: Payout = {
    id: payoutId,
    creatorId,
    amount,
    fee,
    netAmount,
    currency: 'NGN',
    payoutAccountId: paymentAccount.id,
    bankDetails,
    providerReference: transferRef,
    status: payoutStatus,
    requestedAt: now,
    processedAt: isSuccessful ? now : undefined,
  };

  return { success: true, payout };
}
