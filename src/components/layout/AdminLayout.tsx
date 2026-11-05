import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from '../../router';
import {
  ShieldAlert,
  Users,
  Flame,
  CreditCard,
  Landmark,
  Flag,
  Settings,
  FileText,
  ArrowLeft,
  LayoutDashboard,
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isAdmin, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 rounded-full border-2 border-amber-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Access Restricted</h2>
        <p className="text-sm text-gray-600 mt-2 max-w-md">
          You do not have administrative privileges to access this area. Administrator roles are enforced server-side.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Home
        </Link>
      </div>
    );
  }

  const adminNav = [
    { label: 'Admin Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'User Management', href: '/admin/users', icon: Users },
    { label: 'Campaign Moderation', href: '/admin/campaigns', icon: Flame },
    { label: 'Transactions & Ledger', href: '/admin/transactions', icon: CreditCard },
    { label: 'Payout Approvals', href: '/admin/payouts', icon: Landmark },
    { label: 'Abuse Reports', href: '/admin/reports', icon: Flag },
    { label: 'Platform Settings', href: '/admin/settings', icon: Settings },
    { label: 'Admin Audit Logs', href: '/admin/audit-logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-gray-900 text-gray-300 flex flex-col justify-between p-4 flex-shrink-0">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-gray-950 flex items-center justify-center font-black">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">BuyMeData</h3>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Administration
                </span>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-amber-500 text-gray-950 font-bold'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-gray-800 space-y-2">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Creator App
          </Link>
        </div>
      </aside>

      {/* Admin Content */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}
