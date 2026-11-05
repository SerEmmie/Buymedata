export type UserRole = 'creator' | 'supporter' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'pending_review';

export interface User {
  uid: string;
  fullName: string;
  email: string;
  username: string;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ThemePreset = 'violet' | 'emerald' | 'amber' | 'rose' | 'ocean' | 'midnight';

export interface SocialLinks {
  twitter?: string;
  instagram?: string;
  youtube?: string;
  github?: string;
  linkedin?: string;
  tiktok?: string;
}

export interface CreatorPublicSettings {
  showTotalRaised: boolean;
  showSupporterCount: boolean;
  showSupporterMessages: boolean;
  allowAnonymous: boolean;
}

export interface CreatorProfile {
  id: string; // usually same as userId or username doc ID
  userId: string;
  displayName: string;
  username: string;
  biography: string;
  profileImage?: string;
  coverImage?: string;
  category: string;
  website?: string;
  socialLinks?: SocialLinks;
  supportButtonText: string;
  suggestedAmounts: number[]; // stored in NGN e.g. [500, 1000, 2000, 5000]
  currencyPreference: string;
  theme: ThemePreset;
  publicSettings: CreatorPublicSettings;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'suspended';
export type CampaignVisibility = 'public' | 'unlisted' | 'private';

export interface Campaign {
  id: string;
  creatorId: string;
  creatorUsername: string;
  creatorDisplayName?: string;
  creatorAvatar?: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  coverImage?: string;
  category: string;
  targetAmount: number;
  currency: string;
  amountRaised: number;
  contributorCount: number;
  status: CampaignStatus;
  visibility: CampaignVisibility;
  deadline?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignUpdate {
  id: string;
  campaignId: string;
  creatorId: string;
  title: string;
  content: string;
  images?: string[];
  createdAt: string;
}

export type PaymentStatus = 'pending' | 'successful' | 'failed' | 'refunded';

export interface Contribution {
  id: string;
  creatorId: string;
  creatorUsername?: string;
  campaignId?: string;
  campaignTitle?: string;
  supporterName: string;
  supporterEmail: string;
  amount: number; // in NGN
  currency: string;
  message?: string;
  anonymous: boolean;
  publicMessage: boolean;
  paymentStatus: PaymentStatus;
  paymentTransactionId?: string;
  platformFee: number;
  netAmount: number;
  createdAt: string;
}

export type PaymentProvider = 'paystack' | 'flutterwave' | 'sandbox';

export interface PaymentTransaction {
  id: string;
  contributionId: string;
  provider: PaymentProvider;
  providerReference: string;
  amount: number;
  currency: string;
  status: 'pending' | 'successful' | 'failed' | 'reversed';
  idempotencyKey: string;
  channel?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentAccount {
  id: string;
  userId: string;
  provider: string;
  bankName: string;
  bankCode: string;
  maskedAccountNumber: string;
  accountNumber?: string;
  accountName: string;
  verificationStatus: 'unverified' | 'verified' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export type PayoutStatus = 'pending' | 'processing' | 'successful' | 'failed' | 'reversed' | 'cancelled';

export interface Payout {
  id: string;
  creatorId: string;
  amount: number;
  fee: number;
  netAmount: number;
  currency: string;
  payoutAccountId: string;
  bankDetails: {
    bankName: string;
    maskedAccountNumber: string;
    accountName: string;
  };
  providerReference?: string;
  status: PayoutStatus;
  failureReason?: string;
  requestedAt: string;
  processedAt?: string;
  completedAt?: string;
}

export type LedgerAccountType = 
  | 'CREATOR_AVAILABLE' 
  | 'CREATOR_PENDING' 
  | 'PLATFORM_FEES' 
  | 'ESCROW_CASH' 
  | 'PAYOUT_OUTFLOW';

export type LedgerEntryType = 'DEBIT' | 'CREDIT';

export interface LedgerEntry {
  id: string;
  ledgerTransactionId: string;
  accountOwner: string; // userId or 'PLATFORM'
  accountType: LedgerAccountType;
  entryType: LedgerEntryType;
  amount: number;
  currency: string;
  description: string;
  referenceId: string;
  createdAt: string;
}

export type NotificationType = 
  | 'contribution_received' 
  | 'campaign_update' 
  | 'goal_reached' 
  | 'payout_processed' 
  | 'payout_failed' 
  | 'system_alert' 
  | 'moderation';

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedResourceId?: string;
  isRead: boolean;
  createdAt: string;
}

export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  campaignId?: string;
  reason: string;
  description: string;
  status: ReportStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface PlatformSettings {
  platformFeePercentage: number;
  minimumContribution: number;
  maximumContribution: number;
  minimumPayout: number;
  payoutFee: number;
  supportedCurrencies: string[];
  maintenanceMode: boolean;
  updatedAt: string;
}

export interface AdminAuditLog {
  id: string;
  administratorId: string;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface NigerianBank {
  name: string;
  code: string;
  slug: string;
}
