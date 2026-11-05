import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { paystackClient } from './paystack';
import { Payout, PaymentAccount, LedgerEntry, User } from '../types';

export interface CreatorBalanceSummary {
  creatorId: string;
  availableBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  inFlightPayouts: number;
}

/**
 * Calculates genuine creator balance directly from immutable double-entry ledger entries.
 * Never relies on single mutable number fields.
 */
export async function calculateServerCreatorBalance(creatorId: string): Promise<CreatorBalanceSummary> {
  // 1. Fetch all ledger entries where accountOwner == creatorId
  const qLedger = query(
    collection(db, 'ledgerEntries'),
    where('accountOwner', '==', creatorId)
  );
  const ledgerSnap = await getDocs(qLedger);

  let totalEarned = 0;
  let debitedFromAvailable = 0;

  ledgerSnap.docs.forEach((d) => {
    const entry = d.data() as LedgerEntry;
    if (entry.accountType === 'CREATOR_AVAILABLE') {
      if (entry.entryType === 'CREDIT') {
        totalEarned += entry.amount || 0;
      } else if (entry.entryType === 'DEBIT') {
        debitedFromAvailable += entry.amount || 0;
      }
    }
  });

  // 2. Fetch in-flight (pending / processing) payouts that have not yet had ledger entries posted
  const qPayouts = query(
    collection(db, 'payouts'),
    where('creatorId', '==', creatorId)
  );
  const payoutSnap = await getDocs(qPayouts);

  let inFlightPayouts = 0;
  let totalWithdrawn = 0;

  payoutSnap.docs.forEach((d) => {
    const p = d.data() as Payout;
    if (p.status === 'successful') {
      totalWithdrawn += p.amount || 0;
    } else if (p.status === 'pending' || p.status === 'processing') {
      inFlightPayouts += p.amount || 0;
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
 * Executes a payout withdrawal for a creator.
 * Integrates Paystack Transfer Recipient and Transfer Initiation.
 * Posts double-entry ledger entries upon disbursement.
 */
export async function processServerPayout(params: {
  creatorId: string;
  amount: number;
  paymentAccountId: string;
}): Promise<{ success: boolean; payout: Payout }> {
  const { creatorId, amount, paymentAccountId } = params;

  // 1. Validate creator account status
  const userSnap = await getDoc(doc(db, 'users', creatorId));
  if (userSnap.exists()) {
    const user = userSnap.data() as User;
    if (user.accountStatus === 'suspended') {
      throw new Error('Your account is under administrative review. Payout withdrawals are currently disabled.');
    }
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
  const accountSnap = await getDoc(doc(db, 'paymentAccounts', paymentAccountId));
  if (!accountSnap.exists()) {
    throw new Error('Selected bank account was not found.');
  }
  const paymentAccount = accountSnap.data() as PaymentAccount;

  // 5. Create / Fetch Paystack Transfer Recipient
  const recipientRes = await paystackClient.createTransferRecipient({
    accountName: paymentAccount.accountName,
    accountNumber: paymentAccount.accountNumber || paymentAccount.maskedAccountNumber.replace(/\D/g, ''),
    bankCode: paymentAccount.bankCode,
  });

  const recipientCode = recipientRes.data.recipient_code;

  // 6. Generate reference & initiate Paystack Transfer
  const payoutId = `pyo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const transferRef = `BMD-TRF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const now = new Date().toISOString();
  const fee = 50; // Standard ₦50 NIP transfer fee
  const netAmount = amount - fee;

  const transferRes = await paystackClient.initiateTransfer({
    amount: netAmount,
    recipientCode,
    reason: `BuyMeData creator withdrawal (${creatorId})`,
    reference: transferRef,
  });

  const transferStatus = transferRes.data.status;
  const isSuccessful = transferStatus === 'success';

  // 7. Atomic Database Commit: Payout record + Double-entry ledger entries
  const payout: Payout = {
    id: payoutId,
    creatorId,
    amount,
    fee,
    netAmount,
    currency: 'NGN',
    payoutAccountId: paymentAccount.id,
    bankDetails: {
      bankName: paymentAccount.bankName,
      maskedAccountNumber: paymentAccount.maskedAccountNumber,
      accountName: paymentAccount.accountName,
    },
    providerReference: transferRef,
    status: isSuccessful ? 'successful' : 'processing',
    requestedAt: now,
    processedAt: isSuccessful ? now : undefined,
  };

  const ledgerTxnId = `ltxn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const batch = writeBatch(db);

  batch.set(doc(db, 'payouts', payoutId), payout);

  // If transfer was executed immediately, record ledger entries
  if (isSuccessful) {
    // DEBIT: CREATOR_AVAILABLE (reduces creator balance)
    const entryDebit: LedgerEntry = {
      id: `led_${Date.now()}_1`,
      ledgerTransactionId: ledgerTxnId,
      accountOwner: creatorId,
      accountType: 'CREATOR_AVAILABLE',
      entryType: 'DEBIT',
      amount,
      currency: 'NGN',
      description: `Payout withdrawal to ${paymentAccount.bankName} (${paymentAccount.maskedAccountNumber})`,
      referenceId: payoutId,
      createdAt: now,
    };

    // CREDIT: PAYOUT_OUTFLOW (funds disbursed from platform escrow)
    const entryCredit: LedgerEntry = {
      id: `led_${Date.now()}_2`,
      ledgerTransactionId: ledgerTxnId,
      accountOwner: 'PLATFORM',
      accountType: 'PAYOUT_OUTFLOW',
      entryType: 'CREDIT',
      amount,
      currency: 'NGN',
      description: `Disbursement to bank account ${paymentAccount.maskedAccountNumber} (Ref: ${transferRef})`,
      referenceId: payoutId,
      createdAt: now,
    };

    batch.set(doc(db, 'ledgerEntries', entryDebit.id), entryDebit);
    batch.set(doc(db, 'ledgerEntries', entryCredit.id), entryCredit);
  }

  // In-app notification
  const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  batch.set(doc(db, 'notifications', notifId), {
    id: notifId,
    userId: creatorId,
    title: isSuccessful ? '💸 Payout Disbursed!' : '⏳ Payout Processing',
    message: isSuccessful
      ? `Your withdrawal of ₦${netAmount.toLocaleString()} has been sent to your ${paymentAccount.bankName} account.`
      : `Your withdrawal of ₦${netAmount.toLocaleString()} is processing via Paystack transfers.`,
    type: 'payout_processed',
    read: false,
    relatedResourceId: payoutId,
    createdAt: now,
  });

  await batch.commit();

  return { success: true, payout };
}
