/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RouterProvider, useLocation, matchPath, Link } from './router';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { AdminLayout } from './components/layout/AdminLayout';

// Public pages
import { HomePage } from './pages/public/HomePage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { AboutPage } from './pages/public/AboutPage';
import { FaqPage } from './pages/public/FaqPage';
import { LegalPage } from './pages/public/LegalPage';
import { CreatorPublicPage } from './pages/public/CreatorPublicPage';
import { CampaignPublicPage } from './pages/public/CampaignPublicPage';

// Auth pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { CreatorOnboardingPage } from './pages/onboarding/CreatorOnboardingPage';

// Dashboard pages
import { OverviewPage } from './pages/dashboard/OverviewPage';
import { MyPageEditor } from './pages/dashboard/MyPageEditor';
import { CampaignsListPage } from './pages/dashboard/CampaignsListPage';
import { CampaignEditorPage } from './pages/dashboard/CampaignEditorPage';
import { ContributionsListPage } from './pages/dashboard/ContributionsListPage';
import { EarningsLedgerPage } from './pages/dashboard/EarningsLedgerPage';
import { PayoutsPage } from './pages/dashboard/PayoutsPage';
import { NotificationsPage } from './pages/dashboard/NotificationsPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';

// Admin pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminCampaignsPage } from './pages/admin/AdminCampaignsPage';
import { AdminTransactionsPage } from './pages/admin/AdminTransactionsPage';
import { AdminPayoutsPage } from './pages/admin/AdminPayoutsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';

import { NotFoundPage } from './pages/NotFoundPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { fbUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFC]">
        <div className="w-10 h-10 rounded-full border-4 border-[#6741D9]/20 border-t-[#6741D9] animate-spin" />
      </div>
    );
  }

  if (!fbUser) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Sign in required</h2>
        <p className="text-xs text-gray-500 mb-4 max-w-xs">
          Please sign in to access your creator dashboard and financial ledger.
        </p>
        <Link
          to="/auth/login"
          className="px-5 py-2.5 bg-[#6741D9] text-white font-bold text-xs rounded-xl shadow-xs"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

function MainContent() {
  const { pathname } = useLocation();

  // 1. Dashboard Routes
  if (pathname.startsWith('/dashboard')) {
    let dashboardContent = <OverviewPage />;
    if (pathname === '/dashboard/page') dashboardContent = <MyPageEditor />;
    else if (pathname === '/dashboard/campaigns') dashboardContent = <CampaignsListPage />;
    else if (pathname === '/dashboard/campaigns/new' || pathname.startsWith('/dashboard/campaigns/'))
      dashboardContent = <CampaignEditorPage />;
    else if (pathname === '/dashboard/contributions') dashboardContent = <ContributionsListPage />;
    else if (pathname === '/dashboard/earnings') dashboardContent = <EarningsLedgerPage />;
    else if (pathname === '/dashboard/payouts') dashboardContent = <PayoutsPage />;
    else if (pathname === '/dashboard/notifications') dashboardContent = <NotificationsPage />;
    else if (pathname === '/dashboard/settings') dashboardContent = <SettingsPage />;

    return (
      <ProtectedRoute>
        <DashboardLayout>{dashboardContent}</DashboardLayout>
      </ProtectedRoute>
    );
  }

  // 2. Admin Routes
  if (pathname.startsWith('/admin')) {
    let adminContent = <AdminDashboardPage />;
    if (pathname === '/admin/users') adminContent = <AdminUsersPage />;
    else if (pathname === '/admin/campaigns') adminContent = <AdminCampaignsPage />;
    else if (pathname === '/admin/transactions') adminContent = <AdminTransactionsPage />;
    else if (pathname === '/admin/payouts') adminContent = <AdminPayoutsPage />;
    else if (pathname === '/admin/reports') adminContent = <AdminReportsPage />;
    else if (pathname === '/admin/settings') adminContent = <AdminSettingsPage />;
    else if (pathname === '/admin/audit-logs') adminContent = <AdminAuditLogsPage />;

    return (
      <ProtectedRoute>
        <AdminLayout>{adminContent}</AdminLayout>
      </ProtectedRoute>
    );
  }

  // 3. Onboarding
  if (pathname === '/onboarding') {
    return (
      <ProtectedRoute>
        <CreatorOnboardingPage />
      </ProtectedRoute>
    );
  }

  // 4. Authentication Routes
  if (pathname === '/auth/login') return <LoginPage />;
  if (pathname === '/auth/register') return <RegisterPage />;
  if (pathname === '/auth/forgot-password') return <ForgotPasswordPage />;

  // 5. Standard Public Marketing & Legal Pages
  let publicPageContent: React.ReactNode | null = null;
  if (pathname === '/' || pathname === '') publicPageContent = <HomePage />;
  else if (pathname === '/how-it-works') publicPageContent = <HowItWorksPage />;
  else if (pathname === '/about') publicPageContent = <AboutPage />;
  else if (pathname === '/faq') publicPageContent = <FaqPage />;
  else if (pathname === '/terms') publicPageContent = <LegalPage docType="terms" />;
  else if (pathname === '/privacy') publicPageContent = <LegalPage docType="privacy" />;
  else if (pathname === '/refund-policy') publicPageContent = <LegalPage docType="refund-policy" />;
  else if (pathname === '/guidelines') publicPageContent = <LegalPage docType="guidelines" />;

  if (publicPageContent) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAFC]">
        <Navbar />
        <main className="flex-1">{publicPageContent}</main>
        <Footer />
      </div>
    );
  }

  // 6. Public Campaign: /:username/campaigns/:campaignSlug
  const campaignMatch = matchPath('/:username/campaigns/:campaignSlug', pathname);
  if (campaignMatch.matches) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAFC]">
        <Navbar />
        <main className="flex-1">
          <CampaignPublicPage />
        </main>
        <Footer />
      </div>
    );
  }

  // 7. Creator Public Page: /:username (Single-segment path)
  const creatorMatch = matchPath('/:username', pathname);
  if (creatorMatch.matches && !['checkout', 'auth', 'api'].includes(creatorMatch.params.username)) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAFC]">
        <Navbar />
        <main className="flex-1">
          <CreatorPublicPage />
        </main>
        <Footer />
      </div>
    );
  }

  // 8. 404 Not Found fallback
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFC]">
      <Navbar />
      <main className="flex-1">
        <NotFoundPage />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <MainContent />
      </RouterProvider>
    </AuthProvider>
  );
}
