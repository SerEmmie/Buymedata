-- ============================================================================
-- BuyMeData — Complete Supabase PostgreSQL Schema & Row-Level Security (RLS)
-- Run this script in your Supabase Dashboard -> SQL Editor -> New query
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. USERS (linked to Supabase auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL DEFAULT '',
  full_name TEXT NOT NULL DEFAULT 'Creator',
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'creator' CHECK (role IN ('creator', 'supporter', 'admin')),
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'pending_review')),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON public.users (username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);

-- Security-definer admin helper (avoids infinite recursion in RLS policies)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ----------------------------------------------------------------------------
-- 2. CREATOR PROFILES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creator_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Creator',
  username TEXT NOT NULL UNIQUE,
  biography TEXT NOT NULL DEFAULT '',
  profile_image TEXT,
  cover_image TEXT,
  category TEXT NOT NULL DEFAULT 'Creative & Tech',
  website TEXT DEFAULT '',
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  support_button_text TEXT NOT NULL DEFAULT 'Buy me data 📶',
  suggested_amounts NUMERIC[] NOT NULL DEFAULT ARRAY[500, 1000, 2000, 5000]::NUMERIC[],
  currency_preference TEXT NOT NULL DEFAULT 'NGN',
  theme TEXT NOT NULL DEFAULT 'crimson',
  public_settings JSONB NOT NULL DEFAULT '{"showTotalRaised": true, "showSupporterCount": true, "showSupporterMessages": true, "allowAnonymous": true}'::jsonb,
  published BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_profiles_username ON public.creator_profiles (username);
CREATE INDEX IF NOT EXISTS idx_creator_profiles_user_id ON public.creator_profiles (user_id);

-- ----------------------------------------------------------------------------
-- 3. CAMPAIGNS & CAMPAIGN UPDATES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaigns (
  id TEXT PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  creator_username TEXT NOT NULL,
  creator_display_name TEXT,
  creator_avatar TEXT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  cover_image TEXT,
  category TEXT NOT NULL DEFAULT 'Creative & Tech',
  target_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'NGN',
  amount_raised NUMERIC(14, 2) NOT NULL DEFAULT 0,
  contributor_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'suspended')),
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'unlisted', 'private')),
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (creator_username, slug)
);

CREATE INDEX IF NOT EXISTS idx_campaigns_creator_id ON public.campaigns (creator_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns (status);
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON public.campaigns (creator_username, slug);

CREATE TABLE IF NOT EXISTS public.campaign_updates (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  images TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_updates_campaign_id ON public.campaign_updates (campaign_id);

-- ----------------------------------------------------------------------------
-- 4. CONTRIBUTIONS & PAYMENT TRANSACTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contributions (
  id TEXT PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  creator_username TEXT,
  campaign_id TEXT REFERENCES public.campaigns(id) ON DELETE SET NULL,
  campaign_title TEXT,
  supporter_name TEXT NOT NULL DEFAULT 'Anonymous Supporter',
  supporter_email TEXT NOT NULL DEFAULT '',
  amount NUMERIC(14, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  message TEXT DEFAULT '',
  anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  public_message BOOLEAN NOT NULL DEFAULT TRUE,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'successful', 'failed', 'refunded')),
  payment_transaction_id TEXT,
  platform_fee NUMERIC(14, 2) NOT NULL DEFAULT 0,
  net_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contributions_creator_id ON public.contributions (creator_id);
CREATE INDEX IF NOT EXISTS idx_contributions_campaign_id ON public.contributions (campaign_id);
CREATE INDEX IF NOT EXISTS idx_contributions_status ON public.contributions (payment_status);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id TEXT PRIMARY KEY,
  contribution_id TEXT NOT NULL REFERENCES public.contributions(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'bachs',
  provider_reference TEXT NOT NULL UNIQUE,
  amount NUMERIC(14, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'failed', 'reversed')),
  idempotency_key TEXT NOT NULL UNIQUE,
  channel TEXT,
  gateway_response TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_txns_provider_ref ON public.payment_transactions (provider_reference);
CREATE INDEX IF NOT EXISTS idx_payment_txns_contribution_id ON public.payment_transactions (contribution_id);

-- ----------------------------------------------------------------------------
-- 5. PAYMENT ACCOUNTS, PAYOUTS & DOUBLE-ENTRY LEDGER
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payment_accounts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'bachs',
  bank_name TEXT NOT NULL,
  bank_code TEXT NOT NULL,
  masked_account_number TEXT NOT NULL,
  account_number TEXT,
  account_name TEXT NOT NULL,
  verification_status TEXT NOT NULL DEFAULT 'verified' CHECK (verification_status IN ('unverified', 'verified', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_accounts_user_id ON public.payment_accounts (user_id);

CREATE TABLE IF NOT EXISTS public.payouts (
  id TEXT PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(14, 2) NOT NULL,
  fee NUMERIC(14, 2) NOT NULL DEFAULT 50,
  net_amount NUMERIC(14, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  payout_account_id TEXT NOT NULL REFERENCES public.payment_accounts(id),
  bank_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'successful', 'failed', 'reversed', 'cancelled')),
  failure_reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payouts_creator_id ON public.payouts (creator_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts (status);

CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id TEXT PRIMARY KEY,
  ledger_transaction_id TEXT NOT NULL,
  account_owner TEXT NOT NULL, -- Creator UUID string or 'PLATFORM'
  account_type TEXT NOT NULL CHECK (account_type IN ('CREATOR_AVAILABLE', 'CREATOR_PENDING', 'PLATFORM_FEES', 'ESCROW_CASH', 'PAYOUT_OUTFLOW')),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')),
  amount NUMERIC(14, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  description TEXT NOT NULL DEFAULT '',
  reference_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_account_owner ON public.ledger_entries (account_owner);
CREATE INDEX IF NOT EXISTS idx_ledger_txn_id ON public.ledger_entries (ledger_transaction_id);

-- ----------------------------------------------------------------------------
-- 6. NOTIFICATIONS, REPORTS, AUDIT LOGS & PLATFORM SETTINGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  related_resource_id TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL DEFAULT 'anonymous',
  reported_user_id TEXT NOT NULL,
  campaign_id TEXT,
  reason TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id TEXT PRIMARY KEY,
  administrator_id UUID NOT NULL REFERENCES public.users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  reason TEXT DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id TEXT PRIMARY KEY DEFAULT 'global',
  platform_fee_percentage NUMERIC(5, 2) NOT NULL DEFAULT 5.0,
  minimum_contribution NUMERIC(14, 2) NOT NULL DEFAULT 200,
  maximum_contribution NUMERIC(14, 2) NOT NULL DEFAULT 5000000,
  minimum_payout NUMERIC(14, 2) NOT NULL DEFAULT 2000,
  payout_fee NUMERIC(14, 2) NOT NULL DEFAULT 50,
  supported_currencies TEXT[] NOT NULL DEFAULT ARRAY['NGN']::TEXT[],
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.platform_settings (id)
VALUES ('global')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Note: Server-side routes using SUPABASE_SERVICE_ROLE_KEY bypass RLS safely.
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- USERS
DROP POLICY IF EXISTS "Users select own or admin" ON public.users;
CREATE POLICY "Users select own or admin" ON public.users
  FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users insert own" ON public.users;
CREATE POLICY "Users insert own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users update own or admin" ON public.users;
CREATE POLICY "Users update own or admin" ON public.users
  FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- CREATOR PROFILES
DROP POLICY IF EXISTS "Public read published creator profiles" ON public.creator_profiles;
CREATE POLICY "Public read published creator profiles" ON public.creator_profiles
  FOR SELECT USING (published = TRUE OR auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Creators manage own profile" ON public.creator_profiles;
CREATE POLICY "Creators manage own profile" ON public.creator_profiles
  FOR ALL USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- CAMPAIGNS
DROP POLICY IF EXISTS "Public read active campaigns" ON public.campaigns;
CREATE POLICY "Public read active campaigns" ON public.campaigns
  FOR SELECT USING (status = 'active' OR auth.uid() = creator_id OR public.is_admin());

DROP POLICY IF EXISTS "Creators manage own campaigns" ON public.campaigns;
CREATE POLICY "Creators manage own campaigns" ON public.campaigns
  FOR ALL USING (auth.uid() = creator_id OR public.is_admin())
  WITH CHECK (auth.uid() = creator_id OR public.is_admin());

-- CAMPAIGN UPDATES
DROP POLICY IF EXISTS "Public read campaign updates" ON public.campaign_updates;
CREATE POLICY "Public read campaign updates" ON public.campaign_updates
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Creators manage own campaign updates" ON public.campaign_updates;
CREATE POLICY "Creators manage own campaign updates" ON public.campaign_updates
  FOR ALL USING (auth.uid() = creator_id OR public.is_admin())
  WITH CHECK (auth.uid() = creator_id OR public.is_admin());

-- CONTRIBUTIONS
DROP POLICY IF EXISTS "Public read successful contributions or own" ON public.contributions;
CREATE POLICY "Public read successful contributions or own" ON public.contributions
  FOR SELECT USING (payment_status = 'successful' OR auth.uid() = creator_id OR public.is_admin());

DROP POLICY IF EXISTS "Anyone can create pending contribution" ON public.contributions;
CREATE POLICY "Anyone can create pending contribution" ON public.contributions
  FOR INSERT WITH CHECK (payment_status = 'pending');

DROP POLICY IF EXISTS "Admin update contributions" ON public.contributions;
CREATE POLICY "Admin update contributions" ON public.contributions
  FOR UPDATE USING (public.is_admin());

-- PAYMENT TRANSACTIONS
DROP POLICY IF EXISTS "Anyone can create pending payment txn" ON public.payment_transactions;
CREATE POLICY "Anyone can create pending payment txn" ON public.payment_transactions
  FOR INSERT WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS "Creators and admins read payment txns" ON public.payment_transactions;
CREATE POLICY "Creators and admins read payment txns" ON public.payment_transactions
  FOR SELECT USING (
    public.is_admin() OR EXISTS (
      SELECT 1 FROM public.contributions c
      WHERE c.id = payment_transactions.contribution_id AND c.creator_id = auth.uid()
    )
  );

-- PAYMENT ACCOUNTS
DROP POLICY IF EXISTS "Creators manage own bank accounts" ON public.payment_accounts;
CREATE POLICY "Creators manage own bank accounts" ON public.payment_accounts
  FOR ALL USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- PAYOUTS
DROP POLICY IF EXISTS "Creators view and request own payouts" ON public.payouts;
CREATE POLICY "Creators view and request own payouts" ON public.payouts
  FOR SELECT USING (auth.uid() = creator_id OR public.is_admin());

DROP POLICY IF EXISTS "Creators insert own pending payouts" ON public.payouts;
CREATE POLICY "Creators insert own pending payouts" ON public.payouts
  FOR INSERT WITH CHECK (auth.uid() = creator_id AND status = 'pending');

DROP POLICY IF EXISTS "Admins manage payouts" ON public.payouts;
CREATE POLICY "Admins manage payouts" ON public.payouts
  FOR UPDATE USING (public.is_admin());

-- LEDGER ENTRIES
DROP POLICY IF EXISTS "Creators read own ledger entries" ON public.ledger_entries;
CREATE POLICY "Creators read own ledger entries" ON public.ledger_entries
  FOR SELECT USING (auth.uid()::text = account_owner OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage ledger entries" ON public.ledger_entries;
CREATE POLICY "Admins manage ledger entries" ON public.ledger_entries
  FOR INSERT WITH CHECK (public.is_admin());

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Users read and update own notifications" ON public.notifications;
CREATE POLICY "Users read and update own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Authenticated or admin insert notifications" ON public.notifications;
CREATE POLICY "Authenticated or admin insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.is_admin());

-- REPORTS
DROP POLICY IF EXISTS "Anyone can submit report" ON public.reports;
CREATE POLICY "Anyone can submit report" ON public.reports
  FOR INSERT WITH CHECK (TRUE);

DROP POLICY IF EXISTS "Admins manage reports" ON public.reports;
CREATE POLICY "Admins manage reports" ON public.reports
  FOR ALL USING (public.is_admin());

-- ADMIN AUDIT LOGS
DROP POLICY IF EXISTS "Admins manage audit logs" ON public.admin_audit_logs;
CREATE POLICY "Admins manage audit logs" ON public.admin_audit_logs
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- PLATFORM SETTINGS
DROP POLICY IF EXISTS "Public read platform settings" ON public.platform_settings;
CREATE POLICY "Public read platform settings" ON public.platform_settings
  FOR SELECT USING (TRUE);

DROP POLICY IF EXISTS "Admins update platform settings" ON public.platform_settings;
CREATE POLICY "Admins update platform settings" ON public.platform_settings
  FOR ALL USING (public.is_admin())
  WITH CHECK (public.is_admin());
