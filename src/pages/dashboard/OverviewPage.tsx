import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from '../../router';
import {
  getCreatorFinancialSummary,
  getCreatorContributions,
} from '../../services/paymentService';
import { getCreatorCampaigns } from '../../services/campaignService';
import { getCreatorPaymentAccount } from '../../services/payoutService';
import { formatCurrency, timeAgo } from '../../utils/formatters';
import { Contribution, Campaign, PaymentAccount } from '../../types';
import {
  TrendingUp,
  CreditCard,
  Users,
  ArrowUpRight,
  ExternalLink,
  PlusCircle,
  Landmark,
  Share2,
  CheckCircle2,
  Copy,
  Check,
  Search,
  Sparkles,
  ChevronRight,
  UserCheck,
  Building2,
  Sliders,
} from 'lucide-react';

export function OverviewPage() {
  const { creatorProfile, userProfile, fbUser } = useAuth();
  const [financials, setFinancials] = useState({
    grossContributions: 0,
    platformFees: 0,
    netEarnings: 0,
    availableBalance: 0,
    pendingBalance: 0,
    totalWithdrawn: 0,
  });
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [paymentAccount, setPaymentAccount] = useState<PaymentAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!fbUser) return;
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [fin, contribs, camps, pacc] = await Promise.all([
          getCreatorFinancialSummary(fbUser.uid),
          getCreatorContributions(fbUser.uid),
          getCreatorCampaigns(fbUser.uid),
          getCreatorPaymentAccount(fbUser.uid),
        ]);
        setFinancials(fin);
        setContributions(contribs);
        setCampaigns(camps);
        setPaymentAccount(pacc);
      } catch (err) {
        console.error('Error loading dashboard overview:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [fbUser]);

  const rawUsername = creatorProfile?.username || userProfile?.username || '';
  const cleanUsername = rawUsername.replace(/^@/, '');
  const publicUrl = `${window.location.origin}/@${cleanUsername}`;

  const copyLink = () => {
    if (cleanUsername) {
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredContribs = contributions.filter(
    (c) =>
      c.supporterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.supporterEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.message?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const shareText = `Support my creative journey and work on BuyMeData! 📶 Check out my page: ${publicUrl}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  // Calculate onboarding progress (done inside dashboard without blocking)
  const hasClaimedPage = Boolean(cleanUsername);
  const hasConnectedBank = Boolean(paymentAccount?.verificationStatus === 'verified');
  const hasCustomizedProfile = Boolean(creatorProfile?.biography || creatorProfile?.profileImage);
  const hasSharedPage = contributions.length > 0 || copied;

  const stepsCompleted = [hasClaimedPage, hasConnectedBank, hasCustomizedProfile, hasSharedPage].filter(Boolean).length;
  const isSetupComplete = stepsCompleted === 4;

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded-xl w-64" />
            <div className="h-4 bg-gray-200 rounded-lg w-48" />
          </div>
          <div className="h-10 bg-gray-200 rounded-xl w-36" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
              <div className="h-4 bg-gray-200 rounded w-24" />
              <div className="h-8 bg-gray-200 rounded w-36" />
              <div className="h-3 bg-gray-100 rounded w-28" />
            </div>
          ))}
        </div>

        <div className="h-32 bg-gray-200 rounded-3xl" />
        <div className="bg-white rounded-3xl p-6 border border-gray-100 h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome & Quick actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17191F] tracking-tight">
              Hello, {creatorProfile?.displayName || userProfile?.fullName || 'Creator'} 👋
            </h1>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFE6EA] text-[#F22550]">
              Active Creator
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Welcome to your creator dashboard. A little support goes a long way.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {cleanUsername && (
            <Link
              to={`/@${cleanUsername}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-white border border-gray-200 hover:border-[#F22550] hover:text-[#F22550] text-[#17191F] rounded-xl transition-colors shadow-xs"
            >
              <span>View Live Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}

          <Link
            to="/dashboard/campaigns/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#F22550] hover:bg-[#D81A43] text-white rounded-xl shadow-md shadow-[#F22550]/20 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Campaign</span>
          </Link>
        </div>
      </div>

      {/* In-Dashboard Setup Checklist (Non-blocking onboarding) */}
      {!isSetupComplete && (
        <div className="bg-gradient-to-br from-white to-[#FFF5F7] rounded-3xl p-6 border border-[#FFCCD5] shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#FFE6EA] text-[#F22550] flex items-center justify-center font-bold">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-[#17191F]">Creator Checklist</h3>
                <p className="text-xs text-gray-500">
                  {stepsCompleted} of 4 tasks finished — you can complete these at any time
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-28 bg-gray-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-[#F22550] h-full rounded-full transition-all duration-500"
                  style={{ width: `${(stepsCompleted / 4) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-[#F22550]">
                {Math.round((stepsCompleted / 4) * 100)}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Step 1: Claimed Page */}
            <div className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#17191F]">1. Page Claimed</p>
                <p className="text-[11px] text-gray-500 truncate">@{cleanUsername || 'creator'}</p>
              </div>
            </div>

            {/* Step 2: Connect Bank */}
            <Link
              to="/dashboard/payouts"
              className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 group ${
                hasConnectedBank
                  ? 'bg-white border-gray-100 shadow-xs'
                  : 'bg-white hover:border-[#F22550] border-gray-200 shadow-xs hover:shadow-md'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  hasConnectedBank ? 'bg-emerald-100 text-emerald-600' : 'bg-[#FFE6EA] text-[#F22550]'
                }`}
              >
                {hasConnectedBank ? <Check className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#17191F] group-hover:text-[#F22550] transition-colors flex items-center justify-between">
                  <span>2. Connect Bank</span>
                  {!hasConnectedBank && <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />}
                </p>
                <p className="text-[11px] text-gray-500 truncate">
                  {hasConnectedBank ? `${paymentAccount?.bankName} (Verified)` : 'Add NGN bank account'}
                </p>
              </div>
            </Link>

            {/* Step 3: Customize Profile */}
            <Link
              to="/dashboard/page"
              className="p-3.5 rounded-2xl bg-white hover:border-[#F22550] border border-gray-200 shadow-xs hover:shadow-md transition-all flex items-start gap-3 group"
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  hasCustomizedProfile ? 'bg-emerald-100 text-emerald-600' : 'bg-[#FFE6EA] text-[#F22550]'
                }`}
              >
                {hasCustomizedProfile ? <Check className="w-3.5 h-3.5" /> : <Sliders className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#17191F] group-hover:text-[#F22550] transition-colors flex items-center justify-between">
                  <span>3. Edit Page</span>
                  <ChevronRight className="w-3 h-3 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                </p>
                <p className="text-[11px] text-gray-500 truncate">Bio, photo & data amounts</p>
              </div>
            </Link>

            {/* Step 4: Share Link */}
            <button
              type="button"
              onClick={copyLink}
              className="p-3.5 rounded-2xl bg-white hover:border-[#F22550] border border-gray-200 shadow-xs hover:shadow-md transition-all flex items-start gap-3 text-left group"
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  copied ? 'bg-emerald-100 text-emerald-600' : 'bg-[#FFE6EA] text-[#F22550]'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#17191F] group-hover:text-[#F22550] transition-colors">
                  {copied ? 'Link Copied!' : '4. Share Page'}
                </p>
                <p className="text-[11px] text-gray-500 truncate">Click to copy public link</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-bold uppercase tracking-wider text-[10px] text-gray-400">Available Balance</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <Landmark className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-emerald-700">
              {formatCurrency(financials.availableBalance)}
            </p>
            <p className="text-[11px] text-gray-400">Withdrawable into verified bank</p>
          </div>
          <div className="pt-2 border-t border-gray-50">
            <Link
              to="/dashboard/payouts"
              className="text-xs font-bold text-[#F22550] hover:underline flex items-center gap-1"
            >
              <span>Request Payout</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Gross Contributions */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-bold uppercase tracking-wider text-[10px] text-gray-400">Gross Contributions</span>
            <span className="p-1.5 rounded-lg bg-[#FFE6EA] text-[#F22550]">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-[#17191F]">
              {formatCurrency(financials.grossContributions)}
            </p>
            <p className="text-[11px] text-gray-400">Total gross funds received</p>
          </div>
          <div className="pt-2 border-t border-gray-50 text-[11px] text-gray-400">
            Platform fees (5%): {formatCurrency(financials.platformFees)}
          </div>
        </div>

        {/* Total Withdrawn */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-bold uppercase tracking-wider text-[10px] text-gray-400">Total Withdrawn</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-[#17191F]">
              {formatCurrency(financials.totalWithdrawn)}
            </p>
            <p className="text-[11px] text-gray-400">Disbursed to Nigerian bank</p>
          </div>
          <div className="pt-2 border-t border-gray-50">
            <Link to="/dashboard/payouts" className="text-xs font-bold text-gray-500 hover:text-[#17191F]">
              View payout history
            </Link>
          </div>
        </div>

        {/* Community & Campaigns */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-bold uppercase tracking-wider text-[10px] text-gray-400">Community Backers</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-[#17191F]">
              {contributions.filter((c) => c.paymentStatus === 'successful').length}
            </p>
            <p className="text-[11px] text-gray-400">
              Across {campaigns.length} campaigns & direct support
            </p>
          </div>
          <div className="pt-2 border-t border-gray-50">
            <Link to="/dashboard/campaigns" className="text-xs font-bold text-[#F22550] hover:underline">
              Manage campaigns
            </Link>
          </div>
        </div>
      </div>

      {/* Share Page Callout Card */}
      {cleanUsername && (
        <div className="bg-gradient-to-r from-[#F22550] to-[#D81A43] text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl shadow-[#F22550]/20">
          <div className="space-y-1.5 max-w-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 bg-white/20 rounded-lg">
              Your Live Page
            </span>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              buymedata.com/@{cleanUsername}
            </h3>
            <p className="text-xs text-white/90 leading-relaxed">
              Share your link on WhatsApp, Twitter/X, Instagram bio, or YouTube to receive support directly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={copyLink}
              className="px-4 py-2.5 bg-white text-[#F22550] font-bold text-xs rounded-xl shadow-xs hover:bg-gray-50 transition-all flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>

            <a
              href={twitterShareUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2.5 bg-black/40 hover:bg-black/60 text-white font-bold text-xs rounded-xl border border-white/20 transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Twitter / X</span>
            </a>

            <Link
              to={`/@${cleanUsername}`}
              target="_blank"
              className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl border border-white/20 transition-colors flex items-center gap-1.5"
            >
              <span>Visit Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Recent Contributions Table */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-lg text-[#17191F]">Recent Contributions</h3>
            <p className="text-xs text-gray-500">Live feed of supporter payments and messages</p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search supporter or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#F22550]"
            />
          </div>
        </div>

        {filteredContribs.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-[#17191F]">No contributions yet</h4>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Share your link with your audience and community to receive your first contribution.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Supporter</th>
                  <th className="pb-3 font-semibold">Context</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Net Received</th>
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredContribs.slice(0, 8).map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 pr-4">
                      <div className="font-bold text-[#17191F]">
                        {c.anonymous ? 'Generous Supporter (Anon)' : c.supporterName}
                      </div>
                      {c.message && (
                        <div className="text-[11px] text-gray-500 italic max-w-xs truncate">
                          "{c.message}"
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 text-gray-600">
                      {c.campaignTitle ? (
                        <span className="font-medium text-[#F22550] truncate max-w-[180px] block">
                          {c.campaignTitle}
                        </span>
                      ) : (
                        <span className="text-gray-400">Direct Support</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 font-bold text-[#17191F]">
                      {formatCurrency(c.amount)}
                    </td>
                    <td className="py-3.5 pr-4 font-bold text-emerald-700">
                      {formatCurrency(c.netAmount)}
                    </td>
                    <td className="py-3.5 pr-4 text-gray-400 whitespace-nowrap">
                      {timeAgo(c.createdAt)}
                    </td>
                    <td className="py-3.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.paymentStatus === 'successful'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {c.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
