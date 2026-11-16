import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import {
  User,
  UserRole,
  Campaign,
  Payout,
  Report,
  ReportStatus,
  AdminAuditLog,
  PlatformSettings,
} from '../types';
import { createNotification } from './notificationService';
import { mapDbCampaign } from './campaignService';
import { mapDbPayout } from './payoutService';

function mapDbUser(row: Record<string, any>): User {
  return {
    uid: row.id,
    fullName: row.full_name || 'Creator',
    email: row.email || '',
    username: row.username || '',
    role: (row.role || 'creator') as UserRole,
    accountStatus: row.account_status || 'active',
    emailVerified: Boolean(row.email_verified),
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function mapDbReport(row: Record<string, any>): Report {
  return {
    id: row.id,
    reporterId: row.reporter_id || 'anonymous',
    reportedUserId: row.reported_user_id,
    campaignId: row.campaign_id || undefined,
    reason: row.reason,
    description: row.description || '',
    status: (row.status || 'pending') as ReportStatus,
    reviewedBy: row.reviewed_by || undefined,
    reviewedAt: row.reviewed_at || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapDbAuditLog(row: Record<string, any>): AdminAuditLog {
  return {
    id: row.id,
    administratorId: row.administrator_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    reason: row.reason || '',
    metadata: row.metadata || {},
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export async function logAdminAction(data: {
  administratorId: string;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const id = `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  try {
    const { error } = await supabase.from('admin_audit_logs').insert({
      id,
      administrator_id: data.administratorId,
      action: data.action,
      entity_type: data.entityType,
      entity_id: data.entityId,
      reason: data.reason || '',
      metadata: data.metadata || {},
      created_at: now,
    });
    if (error) {
      console.warn('Failed to record admin audit log:', error.message);
    }
  } catch (err) {
    console.warn('Failed to record admin audit log:', err);
  }
}

export async function getAdminAuditLogs(): Promise<AdminAuditLog[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('admin_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      console.error('Error getting audit logs:', error.message);
      return [];
    }

    return (data || []).map(mapDbAuditLog);
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
  if (!isSupabaseConfigured()) {
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

  try {
    const [usersRes, profilesRes, campsRes, contribsRes, payoutsRes, reportsRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('creator_profiles').select('id', { count: 'exact', head: true }),
      supabase.from('campaigns').select('id', { count: 'exact', head: true }),
      supabase
        .from('contributions')
        .select('amount, platform_fee')
        .eq('payment_status', 'successful'),
      supabase.from('payouts').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    let totalTransactionsVolume = 0;
    let platformFeesCollected = 0;

    (contribsRes.data || []).forEach((c: any) => {
      totalTransactionsVolume += Number(c.amount || 0);
      platformFeesCollected += Number(c.platform_fee || 0);
    });

    return {
      totalUsers: usersRes.count || 0,
      totalCreators: profilesRes.count || 0,
      totalCampaigns: campsRes.count || 0,
      totalTransactionsVolume,
      platformFeesCollected,
      pendingPayoutsCount: payoutsRes.count || 0,
      pendingReportsCount: reportsRes.count || 0,
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
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting users:', error.message);
      return [];
    }

    return (data || []).map(mapDbUser);
  } catch (err) {
    console.error('Error getting users:', err);
    return [];
  }
}

export async function toggleUserSuspension(
  adminId: string,
  userId: string,
  suspend: boolean,
  reason?: string
): Promise<void> {
  const status = suspend ? 'suspended' : 'active';
  const { error } = await supabase
    .from('users')
    .update({
      account_status: status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message || 'Failed to update user status.');
  }

  await logAdminAction({
    administratorId: adminId,
    action: suspend ? 'SUSPEND_USER' : 'REINSTATE_USER',
    entityType: 'User',
    entityId: userId,
    reason,
  });
}

export async function getAllCampaigns(): Promise<Campaign[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting campaigns:', error.message);
      return [];
    }

    return (data || []).map(mapDbCampaign);
  } catch (err) {
    console.error('Error getting campaigns:', err);
    return [];
  }
}

export async function toggleCampaignSuspension(
  adminId: string,
  campaignId: string,
  suspend: boolean,
  reason?: string
): Promise<void> {
  const status = suspend ? 'suspended' : 'active';
  const { error } = await supabase
    .from('campaigns')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId);

  if (error) {
    throw new Error(error.message || 'Failed to update campaign status.');
  }

  await logAdminAction({
    administratorId: adminId,
    action: suspend ? 'SUSPEND_CAMPAIGN' : 'RESTORE_CAMPAIGN',
    entityType: 'Campaign',
    entityId: campaignId,
    reason,
  });
}

export async function getAllPayouts(): Promise<Payout[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('payouts')
      .select('*')
      .order('requested_at', { ascending: false });

    if (error) {
      console.error('Error getting payouts:', error.message);
      return [];
    }

    return (data || []).map(mapDbPayout);
  } catch (err) {
    console.error('Error getting payouts:', err);
    return [];
  }
}

export async function approvePayout(adminId: string, payoutId: string): Promise<void> {
  const { data: payoutRow, error: fetchErr } = await supabase
    .from('payouts')
    .select('*')
    .eq('id', payoutId)
    .maybeSingle();

  if (fetchErr || !payoutRow) {
    throw new Error('Payout not found');
  }

  const payout = mapDbPayout(payoutRow);
  if (payout.status === 'successful') return;

  const completedAt = new Date().toISOString();
  const ledgerTxnId = `ltxn_payout_${payout.id}`;

  const { error: updErr } = await supabase
    .from('payouts')
    .update({
      status: 'successful',
      completed_at: completedAt,
    })
    .eq('id', payoutId);

  if (updErr) {
    throw new Error(updErr.message || 'Failed to approve payout.');
  }

  const ts = Date.now();
  const { error: ledgerErr } = await supabase.from('ledger_entries').insert([
    {
      id: `led_${ts}_out1`,
      ledger_transaction_id: ledgerTxnId,
      account_owner: payout.creatorId,
      account_type: 'CREATOR_AVAILABLE',
      entry_type: 'DEBIT',
      amount: payout.amount,
      currency: payout.currency,
      description: `Payout withdrawal disbursement to ${payout.bankDetails.bankName}`,
      reference_id: payout.id,
      created_at: completedAt,
    },
    {
      id: `led_${ts}_out2`,
      ledger_transaction_id: ledgerTxnId,
      account_owner: payout.creatorId,
      account_type: 'PAYOUT_OUTFLOW',
      entry_type: 'CREDIT',
      amount: payout.netAmount,
      currency: payout.currency,
      description: `Net funds transferred to account ${payout.bankDetails.maskedAccountNumber}`,
      reference_id: payout.id,
      created_at: completedAt,
    },
    {
      id: `led_${ts}_out3`,
      ledger_transaction_id: ledgerTxnId,
      account_owner: 'PLATFORM',
      account_type: 'PLATFORM_FEES',
      entry_type: 'CREDIT',
      amount: payout.fee,
      currency: payout.currency,
      description: 'Payout gateway transfer fee',
      reference_id: payout.id,
      created_at: completedAt,
    },
  ]);

  if (ledgerErr) {
    throw new Error(ledgerErr.message || 'Payout approved but ledger insertion failed.');
  }

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

export async function rejectPayout(
  adminId: string,
  payoutId: string,
  reason: string
): Promise<void> {
  const { data: payoutRow, error: fetchErr } = await supabase
    .from('payouts')
    .select('*')
    .eq('id', payoutId)
    .maybeSingle();

  if (fetchErr || !payoutRow) {
    throw new Error('Payout not found');
  }

  const payout = mapDbPayout(payoutRow);

  const { error: updErr } = await supabase
    .from('payouts')
    .update({
      status: 'failed',
      failure_reason: reason,
    })
    .eq('id', payoutId);

  if (updErr) {
    throw new Error(updErr.message || 'Failed to reject payout.');
  }

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
  const now = new Date().toISOString();
  const report: Report = {
    id,
    reporterId: reportData.reporterId || 'anonymous',
    reportedUserId: reportData.reportedUserId,
    campaignId: reportData.campaignId,
    reason: reportData.reason,
    description: reportData.description,
    status: 'pending',
    createdAt: now,
  };

  if (!isSupabaseConfigured()) return report;

  try {
    const { error } = await supabase.from('reports').insert({
      id,
      reporter_id: report.reporterId,
      reported_user_id: report.reportedUserId,
      campaign_id: report.campaignId || null,
      reason: report.reason,
      description: report.description,
      status: 'pending',
      created_at: now,
    });
    if (error) {
      console.error('Error submitting report:', error.message);
    }
    return report;
  } catch (err) {
    console.error('Error submitting report:', err);
    return report;
  }
}

export async function getAllReports(): Promise<Report[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting reports:', error.message);
      return [];
    }

    return (data || []).map(mapDbReport);
  } catch (err) {
    console.error('Error getting reports:', err);
    return [];
  }
}

export async function resolveReport(
  adminId: string,
  reportId: string,
  actionTaken: string
): Promise<void> {
  const { error } = await supabase
    .from('reports')
    .update({
      status: 'resolved',
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) {
    throw new Error(error.message || 'Failed to resolve report.');
  }

  await logAdminAction({
    administratorId: adminId,
    action: 'RESOLVE_REPORT',
    entityType: 'Report',
    entityId: reportId,
    reason: actionTaken,
  });
}

export async function updatePlatformSettings(
  adminId: string,
  settings: Partial<PlatformSettings>
): Promise<void> {
  const payload: Record<string, any> = {
    id: 'global',
    updated_at: new Date().toISOString(),
  };

  if (settings.platformFeePercentage !== undefined) {
    payload.platform_fee_percentage = Number(settings.platformFeePercentage);
  }
  if (settings.minimumContribution !== undefined) {
    payload.minimum_contribution = Number(settings.minimumContribution);
  }
  if (settings.maximumContribution !== undefined) {
    payload.maximum_contribution = Number(settings.maximumContribution);
  }
  if (settings.minimumPayout !== undefined) {
    payload.minimum_payout = Number(settings.minimumPayout);
  }
  if (settings.payoutFee !== undefined) {
    payload.payout_fee = Number(settings.payoutFee);
  }
  if (settings.supportedCurrencies !== undefined) {
    payload.supported_currencies = settings.supportedCurrencies;
  }
  if (settings.maintenanceMode !== undefined) {
    payload.maintenance_mode = settings.maintenanceMode;
  }

  const { error } = await supabase
    .from('platform_settings')
    .upsert(payload, { onConflict: 'id' });

  if (error) {
    throw new Error(error.message || 'Failed to update platform settings.');
  }

  await logAdminAction({
    administratorId: adminId,
    action: 'UPDATE_PLATFORM_SETTINGS',
    entityType: 'PlatformSettings',
    entityId: 'global',
    metadata: settings,
  });
}
