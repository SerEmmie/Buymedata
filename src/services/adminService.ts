import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  setDoc,
  updateDoc,
  where,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import {
  User,
  Campaign,
  Contribution,
  Payout,
  Report,
  AdminAuditLog,
  PlatformSettings,
  LedgerEntry,
} from '../types';
import { createNotification } from './notificationService';

export async function logAdminAction(data: {
  administratorId: string;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const log: AdminAuditLog = {
    id,
    administratorId: data.administratorId,
    action: data.action,
    entityType: data.entityType,
    entityId: data.entityId,
    reason: data.reason || '',
    metadata: data.metadata || {},
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'adminAuditLogs', id), log);
  } catch (err) {
    console.warn('Failed to record admin audit log:', err);
  }
}

export async function getAdminAuditLogs(): Promise<AdminAuditLog[]> {
  try {
    const snap = await getDocs(collection(db, 'adminAuditLogs'));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AdminAuditLog));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error getting audit logs:', err);
    return [];
  }
}

export async function getAdminOverviewMetrics(): Promise<{
  totalUsers: number;
  totalCreators: number;
  totalCampaigns: number;
  totalTransactionsVolume: number;
  platformFeesCollected: number;
  pendingPayoutsCount: number;
  pendingReportsCount: number;
}> {
  try {
    const [usersSnap, profilesSnap, campsSnap, contribsSnap, payoutsSnap, reportsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'creatorProfiles')),
      getDocs(collection(db, 'campaigns')),
      getDocs(collection(db, 'contributions')),
      getDocs(collection(db, 'payouts')),
      getDocs(collection(db, 'reports')),
    ]);

    let totalTransactionsVolume = 0;
    let platformFeesCollected = 0;

    contribsSnap.docs.forEach((d) => {
      const c = d.data() as Contribution;
      if (c.paymentStatus === 'successful') {
        totalTransactionsVolume += c.amount || 0;
        platformFeesCollected += c.platformFee || 0;
      }
    });

    const pendingPayoutsCount = payoutsSnap.docs.filter((d) => d.data().status === 'pending').length;
    const pendingReportsCount = reportsSnap.docs.filter((d) => d.data().status === 'pending').length;

    return {
      totalUsers: usersSnap.size,
      totalCreators: profilesSnap.size,
      totalCampaigns: campsSnap.size,
      totalTransactionsVolume,
      platformFeesCollected,
      pendingPayoutsCount,
      pendingReportsCount,
    };
  } catch (err) {
    console.error('Error fetching admin metrics:', err);
    return {
      totalUsers: 0,
      totalCreators: 0,
      totalCampaigns: 0,
      totalTransactionsVolume: 0,
      platformFeesCollected: 0,
      pendingPayoutsCount: 0,
      pendingReportsCount: 0,
    };
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => ({ ...d.data() } as User));
  } catch (err) {
    console.error('Error getting users:', err);
    return [];
  }
}

export async function toggleUserSuspension(adminId: string, userId: string, suspend: boolean, reason?: string): Promise<void> {
  const status = suspend ? 'suspended' : 'active';
  await updateDoc(doc(db, 'users', userId), {
    accountStatus: status,
    updatedAt: new Date().toISOString(),
  });

  await logAdminAction({
    administratorId: adminId,
    action: suspend ? 'SUSPEND_USER' : 'REINSTATE_USER',
    entityType: 'User',
    entityId: userId,
    reason,
  });
}

export async function getAllCampaigns(): Promise<Campaign[]> {
  try {
    const snap = await getDocs(collection(db, 'campaigns'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Campaign));
  } catch (err) {
    console.error('Error getting campaigns:', err);
    return [];
  }
}

export async function toggleCampaignSuspension(adminId: string, campaignId: string, suspend: boolean, reason?: string): Promise<void> {
  const status = suspend ? 'suspended' : 'active';
  await updateDoc(doc(db, 'campaigns', campaignId), {
    status,
    updatedAt: new Date().toISOString(),
  });

  await logAdminAction({
    administratorId: adminId,
    action: suspend ? 'SUSPEND_CAMPAIGN' : 'RESTORE_CAMPAIGN',
    entityType: 'Campaign',
    entityId: campaignId,
    reason,
  });
}

export async function getAllPayouts(): Promise<Payout[]> {
  try {
    const snap = await getDocs(collection(db, 'payouts'));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Payout));
    return list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
  } catch (err) {
    console.error('Error getting payouts:', err);
    return [];
  }
}

export async function approvePayout(adminId: string, payoutId: string): Promise<void> {
  const payoutRef = doc(db, 'payouts', payoutId);
  const snap = await getDoc(payoutRef);
  if (!snap.exists()) throw new Error('Payout not found');
  const payout = snap.data() as Payout;

  const completedAt = new Date().toISOString();
  const ledgerTxnId = `ltxn_payout_${payout.id}`;

  const entryCreatorDebit: LedgerEntry = {
    id: `led_${Date.now()}_out1`,
    ledgerTransactionId: ledgerTxnId,
    accountOwner: payout.creatorId,
    accountType: 'CREATOR_AVAILABLE',
    entryType: 'DEBIT',
    amount: payout.amount,
    currency: payout.currency,
    description: `Payout withdrawal disbursement to ${payout.bankDetails.bankName}`,
    referenceId: payout.id,
    createdAt: completedAt,
  };

  const entryOutflowCredit: LedgerEntry = {
    id: `led_${Date.now()}_out2`,
    ledgerTransactionId: ledgerTxnId,
    accountOwner: payout.creatorId,
    accountType: 'PAYOUT_OUTFLOW',
    entryType: 'CREDIT',
    amount: payout.netAmount,
    currency: payout.currency,
    description: `Net funds transferred to account ${payout.bankDetails.maskedAccountNumber}`,
    referenceId: payout.id,
    createdAt: completedAt,
  };

  const entryTransferFeeCredit: LedgerEntry = {
    id: `led_${Date.now()}_out3`,
    ledgerTransactionId: ledgerTxnId,
    accountOwner: 'PLATFORM',
    accountType: 'PLATFORM_FEES',
    entryType: 'CREDIT',
    amount: payout.fee,
    currency: payout.currency,
    description: `Payout gateway transfer fee`,
    referenceId: payout.id,
    createdAt: completedAt,
  };

  // Atomically commit payout update and ledger entries
  const batch = writeBatch(db);
  batch.update(payoutRef, {
    status: 'successful',
    completedAt,
  });
  batch.set(doc(db, 'ledgerEntries', entryCreatorDebit.id), entryCreatorDebit);
  batch.set(doc(db, 'ledgerEntries', entryOutflowCredit.id), entryOutflowCredit);
  batch.set(doc(db, 'ledgerEntries', entryTransferFeeCredit.id), entryTransferFeeCredit);
  await batch.commit();

  await logAdminAction({
    administratorId: adminId,
    action: 'APPROVE_PAYOUT',
    entityType: 'Payout',
    entityId: payoutId,
    metadata: { amount: payout.amount, bank: payout.bankDetails.bankName },
  });

  await createNotification({
    userId: payout.creatorId,
    title: '✅ Payout Successful!',
    message: `Your withdrawal of ₦${payout.netAmount.toLocaleString()} has been disbursed to ${payout.bankDetails.bankName} (${payout.bankDetails.maskedAccountNumber}).`,
    type: 'payout_processed',
    relatedResourceId: payoutId,
  });
}

export async function rejectPayout(adminId: string, payoutId: string, reason: string): Promise<void> {
  const payoutRef = doc(db, 'payouts', payoutId);
  const snap = await getDoc(payoutRef);
  if (!snap.exists()) throw new Error('Payout not found');
  const payout = snap.data() as Payout;

  await updateDoc(payoutRef, {
    status: 'failed',
    failureReason: reason,
  });

  await logAdminAction({
    administratorId: adminId,
    action: 'REJECT_PAYOUT',
    entityType: 'Payout',
    entityId: payoutId,
    reason,
  });

  await createNotification({
    userId: payout.creatorId,
    title: '❌ Payout Request Declined',
    message: `Your withdrawal request of ₦${payout.amount.toLocaleString()} was declined. Reason: ${reason}. Funds remain available in your account.`,
    type: 'payout_failed',
    relatedResourceId: payoutId,
  });
}

export async function submitReport(reportData: {
  reporterId: string;
  reportedUserId: string;
  campaignId?: string;
  reason: string;
  description: string;
}): Promise<Report> {
  const id = `rep_${Date.now()}`;
  const report: Report = {
    id,
    reporterId: reportData.reporterId || 'anonymous',
    reportedUserId: reportData.reportedUserId,
    campaignId: reportData.campaignId,
    reason: reportData.reason,
    description: reportData.description,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'reports', id), report);
    return report;
  } catch (err) {
    console.error('Error submitting report:', err);
    return report;
  }
}

export async function getAllReports(): Promise<Report[]> {
  try {
    const snap = await getDocs(collection(db, 'reports'));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report));
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error getting reports:', err);
    return [];
  }
}

export async function resolveReport(adminId: string, reportId: string, actionTaken: string): Promise<void> {
  await updateDoc(doc(db, 'reports', reportId), {
    status: 'resolved',
    reviewedBy: adminId,
    reviewedAt: new Date().toISOString(),
  });

  await logAdminAction({
    administratorId: adminId,
    action: 'RESOLVE_REPORT',
    entityType: 'Report',
    entityId: reportId,
    reason: actionTaken,
  });
}

export async function updatePlatformSettings(adminId: string, settings: Partial<PlatformSettings>): Promise<void> {
  await updateDoc(doc(db, 'platformSettings', 'global'), {
    ...settings,
    updatedAt: new Date().toISOString(),
  });

  await logAdminAction({
    administratorId: adminId,
    action: 'UPDATE_PLATFORM_SETTINGS',
    entityType: 'PlatformSettings',
    entityId: 'global',
    metadata: settings,
  });
}
