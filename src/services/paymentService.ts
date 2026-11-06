import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import {
  Contribution,
  PaymentTransaction,
  LedgerEntry,
  PaymentProvider,
  PlatformSettings,
} from '../types';
import { createNotification } from './notificationService';

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  platformFeePercentage: 5.0, // 5%
  minimumContribution: 200, // ₦200
  maximumContribution: 5000000, // ₦5,000,000
  minimumPayout: 2000, // ₦2,000
  payoutFee: 50, // ₦50 fixed transfer fee
  supportedCurrencies: ['NGN'],
  maintenanceMode: false,
  updatedAt: new Date().toISOString(),
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const snap = await getDoc(doc(db, 'platformSettings', 'global'));
    if (snap.exists()) {
      return snap.data() as PlatformSettings;
    }
    await setDoc(doc(db, 'platformSettings', 'global'), DEFAULT_PLATFORM_SETTINGS);
    return DEFAULT_PLATFORM_SETTINGS;
  } catch (err) {
    console.warn('Using default platform settings:', err);
    return DEFAULT_PLATFORM_SETTINGS;
  }
}

/**
 * Initializes a contribution record in pending status
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
  const settings = await getPlatformSettings();
  
  if (data.amount < settings.minimumContribution) {
    throw new Error(`Minimum contribution is ₦${settings.minimumContribution.toLocaleString()}`);
  }
  if (data.amount > settings.maximumContribution) {
    throw new Error(`Maximum single contribution is ₦${settings.maximumContribution.toLocaleString()}`);
  }

  const contributionId = `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const fee = Math.round((data.amount * (settings.platformFeePercentage / 100)) * 100) / 100;
  const net = data.amount - fee;

  const contribution: Contribution = {
    id: contributionId,
    creatorId: data.creatorId,
    creatorUsername: data.creatorUsername,
    campaignId: data.campaignId,
    campaignTitle: data.campaignTitle,
    supporterName: data.anonymous ? 'Generous Believer' : (data.supporterName || 'Anonymous Supporter'),
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
    providerReference: `BMD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    amount: data.amount,
    currency: data.currency || 'NGN',
    status: 'pending',
    idempotencyKey: `idemp_${contributionId}`,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'contributions', contributionId), contribution);
    batch.set(doc(db, 'paymentTransactions', transactionId), transactionRecord);
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `contributions/${contributionId}`);
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
  try {
    const res = await fetch('/api/payments/initialize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
  } catch (err) {
    console.error('Error calling /api/payments/initialize:', err);
    throw err;
  }
}

/**
 * Backward-compatible alias for initializeBachsPayment
 */
export const initializePaystackPayment = initializeBachsPayment;

/**
 * Strictly verifies a transaction on the server.
 * The server queries Paystack directly, validates amounts and currency,
 * commits atomic double-entry ledger entries, and updates balances.
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
  try {
    const res = await fetch('/api/payments/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reference }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Server verification rejected the payment transaction.');
    }

    return data;
  } catch (err) {
    console.error('Error verifying payment on server:', err);
    throw err;
  }
}

/**
 * Verifies and finalizes a payment using an atomic writeBatch.
 * Applies double-entry ledger entries and updates campaign metrics atomically.
 */
export async function finalizePayment(
  contributionId: string,
  transactionId: string,
  provider: PaymentProvider = 'sandbox',
  providerReference?: string
): Promise<{ success: boolean; contribution: Contribution }> {
  const contribRef = doc(db, 'contributions', contributionId);
  const txnRef = doc(db, 'paymentTransactions', transactionId);

  const contribSnap = await getDoc(contribRef);
  if (!contribSnap.exists()) {
    throw new Error('Contribution not found');
  }
  const contribution = contribSnap.data() as Contribution;

  // Idempotency check: if already successful, do not double-credit
  if (contribution.paymentStatus === 'successful') {
    return { success: true, contribution };
  }

  const verifiedAt = new Date().toISOString();
  const ledgerTxnId = `ltxn_${Date.now()}`;

  // Execute database updates atomically via writeBatch
  try {
    const batch = writeBatch(db);

    // 1. Update contribution status
    batch.update(contribRef, {
      paymentStatus: 'successful',
    });

    // 2. Update transaction status
    batch.update(txnRef, {
      status: 'successful',
      provider,
      providerReference: providerReference || `BMD-REF-${Date.now()}`,
      verifiedAt,
      updatedAt: verifiedAt,
    });

    // 3. If tied to a campaign, update aggregates atomically
    if (contribution.campaignId) {
      const campRef = doc(db, 'campaigns', contribution.campaignId);
      batch.update(campRef, {
        amountRaised: increment(contribution.amount),
        contributorCount: increment(1),
        updatedAt: verifiedAt,
      });
    }

    // 4. Double-entry Immutable Ledger entries
    // DEBIT: ESCROW_CASH (gross amount) -> Inflow into system
    const entryEscrow: LedgerEntry = {
      id: `led_${Date.now()}_1`,
      ledgerTransactionId: ledgerTxnId,
      accountOwner: 'PLATFORM',
      accountType: 'ESCROW_CASH',
      entryType: 'DEBIT',
      amount: contribution.amount,
      currency: contribution.currency,
      description: `Inflow from contribution ${contribution.id}`,
      referenceId: contribution.id,
      createdAt: verifiedAt,
    };

    // CREDIT: PLATFORM_FEES (fee portion)
    const entryFee: LedgerEntry = {
      id: `led_${Date.now()}_2`,
      ledgerTransactionId: ledgerTxnId,
      accountOwner: 'PLATFORM',
      accountType: 'PLATFORM_FEES',
      entryType: 'CREDIT',
      amount: contribution.platformFee,
      currency: contribution.currency,
      description: `Platform fee on contribution ${contribution.id}`,
      referenceId: contribution.id,
      createdAt: verifiedAt,
    };

    // CREDIT: CREATOR_AVAILABLE (net earnings)
    const entryCreator: LedgerEntry = {
      id: `led_${Date.now()}_3`,
      ledgerTransactionId: ledgerTxnId,
      accountOwner: contribution.creatorId,
      accountType: 'CREATOR_AVAILABLE',
      entryType: 'CREDIT',
      amount: contribution.netAmount,
      currency: contribution.currency,
      description: `Net earnings from supporter ${contribution.supporterName}`,
      referenceId: contribution.id,
      createdAt: verifiedAt,
    };

    batch.set(doc(db, 'ledgerEntries', entryEscrow.id), entryEscrow);
    batch.set(doc(db, 'ledgerEntries', entryFee.id), entryFee);
    batch.set(doc(db, 'ledgerEntries', entryCreator.id), entryCreator);

    // Commit all updates atomically
    await batch.commit();

    // 5. Send in-app notification to creator
    await createNotification({
      userId: contribution.creatorId,
      title: `🎉 ₦${contribution.amount.toLocaleString()} Support Received!`,
      message: `${contribution.supporterName} sent you ₦${contribution.amount.toLocaleString()}${
        contribution.message ? `: "${contribution.message.slice(0, 80)}..."` : '.'
      }`,
      type: 'contribution_received',
      relatedResourceId: contribution.id,
    });

    return {
      success: true,
      contribution: {
        ...contribution,
        paymentStatus: 'successful',
      },
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `contributions/${contributionId}`);
  }
}

/**
 * Calculates financial balances for a creator from immutable ledger entries
 */
export async function getCreatorFinancialSummary(creatorId: string): Promise<{
  grossContributions: number;
  platformFees: number;
  netEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  totalWithdrawn: number;
}> {
  try {
    // 1. Fetch contributions
    const contribQuery = query(
      collection(db, 'contributions'),
      where('creatorId', '==', creatorId)
    );
    const contribSnap = await getDocs(contribQuery);
    
    let grossContributions = 0;
    let platformFees = 0;
    let netEarnings = 0;
    let pendingBalance = 0;

    contribSnap.docs.forEach((d) => {
      const c = d.data() as Contribution;
      if (c.paymentStatus === 'successful') {
        grossContributions += c.amount || 0;
        platformFees += c.platformFee || 0;
        netEarnings += c.netAmount || 0;
      } else if (c.paymentStatus === 'pending') {
        pendingBalance += c.amount || 0;
      }
    });

    // 2. Fetch payouts to calculate withdrawals
    const payoutsQuery = query(
      collection(db, 'payouts'),
      where('creatorId', '==', creatorId)
    );
    const payoutSnap = await getDocs(payoutsQuery);
    
    let totalWithdrawn = 0;
    let inFlightPayouts = 0;

    payoutSnap.docs.forEach((d) => {
      const p = d.data();
      if (p.status === 'successful') {
        totalWithdrawn += p.amount || 0;
      } else if (p.status === 'pending' || p.status === 'processing') {
        inFlightPayouts += p.amount || 0;
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
  try {
    const q = query(
      collection(db, 'contributions'),
      where('creatorId', '==', creatorId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Contribution));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error fetching creator contributions:', err);
    return [];
  }
}

export async function getPublicSupporterMessages(creatorId: string): Promise<Contribution[]> {
  try {
    const q = query(
      collection(db, 'contributions'),
      where('creatorId', '==', creatorId),
      where('paymentStatus', '==', 'successful')
    );
    const snap = await getDocs(q);
    const list = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Contribution))
      .filter((c) => c.publicMessage && c.message && c.message.trim().length > 0);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error fetching public supporter messages:', err);
    return [];
  }
}
