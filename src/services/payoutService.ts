import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { PaymentAccount, Payout, PayoutStatus } from '../types';
import { getPlatformSettings, getCreatorFinancialSummary } from './paymentService';
import { createNotification } from './notificationService';
import { getUserProfile } from './authService';

export async function getCreatorPaymentAccount(userId: string): Promise<PaymentAccount | null> {
  try {
    const q = query(
      collection(db, 'paymentAccounts'),
      where('userId', '==', userId),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { id: d.id, ...d.data() } as PaymentAccount;
    }
    return null;
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
  const maskedAccountNumber = `•••• ${accountData.accountNumber.slice(-4)}`;
  const id = `pacc_${accountData.userId}`;
  const now = new Date().toISOString();

  const account: PaymentAccount = {
    id,
    userId: accountData.userId,
    provider: 'paystack_bank',
    bankName: accountData.bankName,
    bankCode: accountData.bankCode,
    maskedAccountNumber,
    accountName: accountData.accountName,
    verificationStatus: 'verified',
    createdAt: now,
    updatedAt: now,
  };

  try {
    await setDoc(doc(db, 'paymentAccounts', id), account);
    return account;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `paymentAccounts/${id}`);
  }
}

export async function requestPayout(
  creatorId: string,
  amount: number,
  paymentAccount: PaymentAccount
): Promise<Payout> {
  const user = await getUserProfile(creatorId);
  if (user?.accountStatus === 'suspended') {
    throw new Error('Your account is currently under administrative restriction. Payout requests are restricted.');
  }

  const settings = await getPlatformSettings();
  const summary = await getCreatorFinancialSummary(creatorId);

  if (amount < settings.minimumPayout) {
    throw new Error(`Minimum payout request is ₦${settings.minimumPayout.toLocaleString()}`);
  }

  if (amount > summary.availableBalance) {
    throw new Error(`Insufficient available balance. You have ₦${summary.availableBalance.toLocaleString()} available.`);
  }

  const fee = settings.payoutFee || 50;
  const netAmount = amount - fee;
  const payoutId = `pyo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

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
    providerReference: `TRF-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
    status: 'pending',
    requestedAt: now,
  };

  try {
    await setDoc(doc(db, 'payouts', payoutId), payout);

    // Notify creator
    await createNotification({
      userId: creatorId,
      title: 'Payout Request Submitted',
      message: `Your withdrawal of ₦${amount.toLocaleString()} to ${paymentAccount.bankName} (${paymentAccount.maskedAccountNumber}) is pending processing.`,
      type: 'system_alert',
      relatedResourceId: payoutId,
    });

    return payout;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `payouts/${payoutId}`);
  }
}

export async function getCreatorPayouts(creatorId: string): Promise<Payout[]> {
  try {
    const q = query(
      collection(db, 'payouts'),
      where('creatorId', '==', creatorId)
    );
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Payout));
    return list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  } catch (err) {
    console.error('Error fetching creator payouts:', err);
    return [];
  }
}
