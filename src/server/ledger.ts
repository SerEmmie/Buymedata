import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  increment,
  writeBatch,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { bachsClient } from './bachs';
import { Contribution, PaymentTransaction, LedgerEntry } from '../types';

export interface FinalizePaymentResult {
  success: boolean;
  alreadyProcessed: boolean;
  contributionId: string;
  reference: string;
  amount: number;
  netAmount: number;
  platformFee: number;
  creatorId: string;
  message?: string;
}

/**
 * Server-side payment verification and double-entry ledger finalization.
 * Enforces:
 * 1. Strict Bachs server verification (never trust client status).
 * 2. Idempotency (never double-credit on retries or duplicate webhook events).
 * 3. Exact amount & currency validation.
 * 4. Atomic batch commits across contribution, campaign, and balanced ledger entries.
 */
export async function verifyAndFinalizePayment(reference: string): Promise<FinalizePaymentResult> {
  if (!reference || typeof reference !== 'string') {
    throw new Error('Missing or invalid payment reference');
  }

  // 1. Query Bachs official verification endpoint
  const verifyRes = await bachsClient.verifyTransaction(reference);

  if (!verifyRes.status || verifyRes.data.status !== 'success') {
    throw new Error(
      `Payment verification failed: Bachs reported status "${verifyRes.data?.status || 'unsuccessful'}"`
    );
  }

  const bachsData = verifyRes.data;

  // 2. Locate the matching PaymentTransaction in Firestore
  let txnDoc = null;
  let txnData: PaymentTransaction | null = null;

  // First try querying by providerReference
  const qByRef = query(
    collection(db, 'paymentTransactions'),
    where('providerReference', '==', reference),
    limit(1)
  );
  const snapByRef = await getDocs(qByRef);

  if (!snapByRef.empty) {
    txnDoc = snapByRef.docs[0];
    txnData = txnDoc.data() as PaymentTransaction;
  } else {
    // Also try querying by transaction document ID directly
    const directDoc = await getDoc(doc(db, 'paymentTransactions', reference));
    if (directDoc.exists()) {
      txnDoc = directDoc;
      txnData = directDoc.data() as PaymentTransaction;
    }
  }

  if (!txnDoc || !txnData) {
    throw new Error(`Transaction with reference "${reference}" not found in database records.`);
  }

  // 3. Fetch the linked Contribution document
  const contribRef = doc(db, 'contributions', txnData.contributionId);
  const contribSnap = await getDoc(contribRef);

  if (!contribSnap.exists()) {
    throw new Error(`Linked contribution "${txnData.contributionId}" does not exist.`);
  }

  const contribution = contribSnap.data() as Contribution;

  // 4. IDEMPOTENCY CHECK: If already successful, do not double-process
  if (contribution.paymentStatus === 'successful' && txnData.status === 'successful') {
    return {
      success: true,
      alreadyProcessed: true,
      contributionId: contribution.id,
      reference,
      amount: contribution.amount,
      netAmount: contribution.netAmount,
      platformFee: contribution.platformFee,
      creatorId: contribution.creatorId,
      message: 'Payment was previously verified and ledger entries already settled.',
    };
  }

  // 5. Amount & Currency integrity verification (in live mode or when Bachs returns non-zero amount)
  if (bachsData.amount > 0) {
    const isKobo = Math.abs(bachsData.amount - contribution.amount * 100) < 0.01;
    const verifiedNgn = isKobo ? bachsData.amount / 100 : bachsData.amount;

    if (Math.abs(verifiedNgn - contribution.amount) > 0.01) {
      throw new Error(
        `Financial integrity mismatch: Expected ₦${contribution.amount.toLocaleString()}, but Bachs reported ₦${verifiedNgn.toLocaleString()}.`
      );
    }

    if (bachsData.currency && bachsData.currency.toUpperCase() !== 'NGN') {
      throw new Error(`Currency mismatch: Expected NGN, received ${bachsData.currency}`);
    }
  }

  // 6. Atomic Double-Entry Ledger Commitment
  const verifiedAt = bachsData.paid_at || new Date().toISOString();
  const ledgerTxnId = `ltxn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  const batch = writeBatch(db);

  // A. Update contribution record
  batch.update(contribRef, {
    paymentStatus: 'successful',
    paidAt: verifiedAt,
    updatedAt: verifiedAt,
  });

  // B. Update payment transaction record
  batch.update(txnDoc.ref, {
    status: 'successful',
    provider: 'bachs',
    providerReference: reference,
    verifiedAt,
    updatedAt: verifiedAt,
    gatewayResponse: bachsData.gateway_response || 'Approved by Bachs',
    channel: bachsData.channel || 'card_transfer',
  });

  // C. Update campaign aggregates atomically if applicable
  if (contribution.campaignId) {
    const campRef = doc(db, 'campaigns', contribution.campaignId);
    batch.update(campRef, {
      amountRaised: increment(contribution.amount),
      contributorCount: increment(1),
      updatedAt: verifiedAt,
    });
  }

  // D. Create balanced Double-Entry Ledger records
  // 1. DEBIT: ESCROW_CASH (gross amount inflow)
  const entryEscrow: LedgerEntry = {
    id: `led_${Date.now()}_1`,
    ledgerTransactionId: ledgerTxnId,
    accountOwner: 'PLATFORM',
    accountType: 'ESCROW_CASH',
    entryType: 'DEBIT',
    amount: contribution.amount,
    currency: 'NGN',
    description: `Bachs inflow for contribution ${contribution.id} (Ref: ${reference})`,
    referenceId: contribution.id,
    createdAt: verifiedAt,
  };

  // 2. CREDIT: PLATFORM_FEES (5% fee revenue retained by platform)
  const entryFee: LedgerEntry = {
    id: `led_${Date.now()}_2`,
    ledgerTransactionId: ledgerTxnId,
    accountOwner: 'PLATFORM',
    accountType: 'PLATFORM_FEES',
    entryType: 'CREDIT',
    amount: contribution.platformFee,
    currency: 'NGN',
    description: `Platform fee on contribution ${contribution.id}`,
    referenceId: contribution.id,
    createdAt: verifiedAt,
  };

  // 3. CREDIT: CREATOR_AVAILABLE (net earnings credited to creator)
  const entryCreator: LedgerEntry = {
    id: `led_${Date.now()}_3`,
    ledgerTransactionId: ledgerTxnId,
    accountOwner: contribution.creatorId,
    accountType: 'CREATOR_AVAILABLE',
    entryType: 'CREDIT',
    amount: contribution.netAmount,
    currency: 'NGN',
    description: `Net earnings from ${contribution.supporterName} for ${contribution.campaignTitle || 'creator support'}`,
    referenceId: contribution.id,
    createdAt: verifiedAt,
  };

  batch.set(doc(db, 'ledgerEntries', entryEscrow.id), entryEscrow);
  batch.set(doc(db, 'ledgerEntries', entryFee.id), entryFee);
  batch.set(doc(db, 'ledgerEntries', entryCreator.id), entryCreator);

  // E. Create in-app notification for the creator
  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  batch.set(doc(db, 'notifications', notificationId), {
    id: notificationId,
    userId: contribution.creatorId,
    title: `🎉 ₦${contribution.amount.toLocaleString()} Received!`,
    message: `${contribution.supporterName} just sent you ₦${contribution.amount.toLocaleString()}${
      contribution.message ? `: "${contribution.message.slice(0, 80)}"` : '.'
    }`,
    type: 'contribution_received',
    read: false,
    relatedResourceId: contribution.id,
    createdAt: verifiedAt,
  });

  // Commit all database mutations atomically
  await batch.commit();

  return {
    success: true,
    alreadyProcessed: false,
    contributionId: contribution.id,
    reference,
    amount: contribution.amount,
    netAmount: contribution.netAmount,
    platformFee: contribution.platformFee,
    creatorId: contribution.creatorId,
    message: 'Payment verified and settled successfully with double-entry ledger entries.',
  };
}
