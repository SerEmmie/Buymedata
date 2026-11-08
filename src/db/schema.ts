import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (maps to Firebase Auth UID)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  fullName: text('full_name'),
  username: text('username'),
  role: text('role').default('creator').notNull(), // 'user' | 'creator' | 'admin'
  accountStatus: text('account_status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Creator public profiles
export const creatorProfiles = pgTable('creator_profiles', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().unique(), // Firebase Auth UID
  displayName: text('display_name').notNull(),
  username: text('username').notNull().unique(),
  biography: text('biography').default(''),
  category: text('category').default('Creative & Tech'),
  profileImage: text('profile_image').default(''),
  coverImage: text('cover_image').default(''),
  website: text('website').default(''),
  socialLinks: jsonb('social_links').default({}),
  supportButtonText: text('support_button_text').default('Buy me data 📶'),
  suggestedAmounts: jsonb('suggested_amounts').default([500, 1000, 2000, 5000]),
  theme: text('theme').default('crimson'),
  published: boolean('published').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Crowdfunding campaigns
export const campaigns = pgTable('campaigns', {
  id: text('id').primaryKey(), // camp_xxx
  creatorId: text('creator_id').notNull(), // Firebase Auth UID
  title: text('title').notNull(),
  slug: text('slug').notNull(),
  description: text('description').default(''),
  story: text('story').default(''),
  targetAmount: integer('target_amount').notNull(),
  amountRaised: integer('amount_raised').default(0).notNull(),
  category: text('category').default('Tech & Community'),
  coverImage: text('cover_image').default(''),
  deadline: timestamp('deadline'),
  status: text('status').default('active').notNull(), // 'active' | 'paused' | 'completed'
  visibility: text('visibility').default('public').notNull(), // 'public' | 'unlisted'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Financial contributions / donations
export const contributions = pgTable('contributions', {
  id: text('id').primaryKey(), // ctb_xxx
  creatorId: text('creator_id').notNull(),
  campaignId: text('campaign_id'),
  supporterName: text('supporter_name').default('Generous Supporter'),
  supporterEmail: text('supporter_email').notNull(),
  amount: integer('amount').notNull(),
  platformFee: integer('platform_fee').default(0).notNull(),
  netAmount: integer('net_amount').notNull(),
  currency: text('currency').default('NGN').notNull(),
  message: text('message').default(''),
  anonymous: boolean('anonymous').default(false).notNull(),
  publicMessage: boolean('public_message').default(true).notNull(),
  paymentStatus: text('payment_status').default('pending').notNull(), // 'pending' | 'successful' | 'failed'
  paymentReference: text('payment_reference'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Verified Nigerian bank accounts for payouts
export const paymentAccounts = pgTable('payment_accounts', {
  id: text('id').primaryKey(), // pacc_xxx
  userId: text('user_id').notNull(),
  provider: text('provider').default('bachs').notNull(),
  bankName: text('bank_name').notNull(),
  bankCode: text('bank_code').notNull(),
  accountNumber: text('account_number').notNull(),
  accountName: text('account_name').notNull(),
  verificationStatus: text('verification_status').default('verified').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Payout requests & disbursements
export const payouts = pgTable('payouts', {
  id: text('id').primaryKey(), // pay_xxx
  creatorId: text('creator_id').notNull(),
  amount: integer('amount').notNull(),
  fee: integer('fee').default(0).notNull(),
  netAmount: integer('net_amount').notNull(),
  currency: text('currency').default('NGN').notNull(),
  status: text('status').default('pending').notNull(), // 'pending' | 'processing' | 'successful' | 'failed'
  paymentAccountId: text('payment_account_id').notNull(),
  bankDetails: jsonb('bank_details').default({}),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// Double-entry ledger
export const ledgerEntries = pgTable('ledger_entries', {
  id: text('id').primaryKey(), // led_xxx
  ledgerTransactionId: text('ledger_transaction_id').notNull(),
  accountOwner: text('account_owner').notNull(),
  accountType: text('account_type').notNull(), // 'CREATOR_AVAILABLE' | 'PLATFORM_FEES' | 'PAYOUT_OUTFLOW'
  entryType: text('entry_type').notNull(), // 'CREDIT' | 'DEBIT'
  amount: integer('amount').notNull(),
  currency: text('currency').default('NGN').notNull(),
  description: text('description').default(''),
  referenceId: text('reference_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Notifications
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(), // notif_xxx
  userId: text('user_id').notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').default('contribution_received').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  relatedResourceId: text('related_resource_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(creatorProfiles, {
    fields: [users.uid],
    references: [creatorProfiles.userId],
  }),
  campaigns: many(campaigns),
  paymentAccounts: many(paymentAccounts),
  notifications: many(notifications),
}));

export const creatorProfilesRelations = relations(creatorProfiles, ({ one }) => ({
  user: one(users, {
    fields: [creatorProfiles.userId],
    references: [users.uid],
  }),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  creator: one(users, {
    fields: [campaigns.creatorId],
    references: [users.uid],
  }),
  contributions: many(contributions),
}));
