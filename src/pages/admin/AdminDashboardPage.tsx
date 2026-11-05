import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from '../../router';
import { getAdminOverviewMetrics } from '../../services/adminService';
import { formatCurrency } from '../../utils/formatters';
import {
  ShieldAlert,
  Users,
  Flame,
  CreditCard,
  Landmark,
  Flag,
  DollarSign,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

export function AdminDashboardPage() {
  const { userProfile, fbUser } = useAuth();
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalCreators: 0,
    totalCampaigns: 0,
    totalTransactionsVolume: 0,
    platformFeesCollected: 0,
    pendingPayoutsCount: 0,
    pendingReportsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminOverviewMetrics()
      .then(setMetrics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 text-xs font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>Master Console • Server Authorized</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            BuyMeData Administrative Portal
          </h1>
          <p className="text-xs text-gray-500">
            System health, compliance moderation, financial ledger reconciliation, and user controls.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
        </div>
      ) : (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Total Transaction Volume
              </span>
              <p className="text-2xl font-black text-gray-900">
                {formatCurrency(metrics.totalTransactionsVolume)}
              </p>
              <p className="text-[11px] text-gray-400">Total gross funds processed</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Platform Fees Earned (5%)
              </span>
              <p className="text-2xl font-black text-emerald-700">
                {formatCurrency(metrics.platformFeesCollected)}
              </p>
              <p className="text-[11px] text-gray-400">Net platform revenue</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Registered Users & Creators
              </span>
              <p className="text-2xl font-black text-gray-900">
                {metrics.totalUsers} <span className="text-xs font-normal text-gray-400">({metrics.totalCreators} pages)</span>
              </p>
              <Link to="/admin/users" className="text-xs font-bold text-amber-600 hover:underline block pt-1">
                Manage accounts →
              </Link>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Pending Payout Requests
              </span>
              <p className="text-2xl font-black text-amber-700">
                {metrics.pendingPayoutsCount}
              </p>
              <Link to="/admin/payouts" className="text-xs font-bold text-amber-600 hover:underline block pt-1">
                Review payouts →
              </Link>
            </div>
          </div>

          {/* Quick Management Links */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/admin/users"
              className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-amber-400/40 shadow-xs transition-all space-y-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-gray-900 group-hover:text-amber-600">
                User Management
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Inspect registered users, manage role assignments, and suspend or restore accounts.
              </p>
            </Link>

            <Link
              to="/admin/campaigns"
              className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-amber-400/40 shadow-xs transition-all space-y-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-gray-900 group-hover:text-amber-600">
                Campaign Moderation
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Review active crowdfunding campaigns, audit milestone claims, and suspend fraudulent goals.
              </p>
            </Link>

            <Link
              to="/admin/payouts"
              className="bg-white p-6 rounded-3xl border border-gray-100 hover:border-amber-400/40 shadow-xs transition-all space-y-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Landmark className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-gray-900 group-hover:text-amber-600">
                Payout Approvals
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Verify eligible creator withdrawal requests and settle disbursements to destination banks.
              </p>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
