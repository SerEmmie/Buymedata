import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from '../../router';
import {
  getCreatorFinancialSummary,
  getCreatorContributions,
} from '../../services/paymentService';
import { getCreatorCampaigns } from '../../services/campaignService';
import { formatCurrency, formatDate, timeAgo } from '../../utils/formatters';
import { Contribution, Campaign } from '../../types';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  Flame,
  Users,
  Clock,
  ArrowUpRight,
  ExternalLink,
  PlusCircle,
  Landmark,
  Share2,
  CheckCircle2,
  Copy,
  Check,
  Search,
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
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!fbUser) return;
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [fin, contribs, camps] = await Promise.all([
          getCreatorFinancialSummary(fbUser.uid),
          getCreatorContributions(fbUser.uid),
          getCreatorCampaigns(fbUser.uid),
        ]);
        setFinancials(fin);
        setContributions(contribs);
        setCampaigns(camps);
      } catch (err) {
        console.error('Error loading dashboard overview:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, [fbUser]);

  const copyLink = () => {
    if (creatorProfile?.username) {
      navigator.clipboard.writeText(`${window.location.origin}/${creatorProfile.username}`);
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

  const shareText = `Support my creative journey and projects on BuyMeData! 📶 Check out my page: ${window.location.origin}/${creatorProfile?.username}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="space-y-8">
      {/* Welcome & Quick actions bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Hello, {creatorProfile?.displayName || userProfile?.fullName || 'Creator'} 👋
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Here is your live financial performance and contribution summary.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {creatorProfile?.username && (
            <Link
              to={`/${creatorProfile.username}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl transition-colors"
            >
              <span>View Public Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}

          <Link
            to="/dashboard/campaigns/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-[#6741D9] hover:bg-[#5633C4] text-white rounded-xl shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Campaign</span>
          </Link>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Available Balance</span>
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
              className="text-xs font-bold text-[#6741D9] hover:underline flex items-center gap-1"
            >
              <span>Request Payout</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Gross Contributions */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Gross Contributions</span>
            <span className="p-1.5 rounded-lg bg-[#F0EBFF] text-[#6741D9]">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-gray-900">
              {formatCurrency(financials.grossContributions)}
            </p>
            <p className="text-[11px] text-gray-400">Total gross funds received</p>
          </div>
          <div className="pt-2 border-t border-gray-50 text-[11px] text-gray-400">
            Platform fees (5%): {formatCurrency(financials.platformFees)}
          </div>
        </div>

        {/* Total Withdrawn */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Total Withdrawn</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-gray-900">
              {formatCurrency(financials.totalWithdrawn)}
            </p>
            <p className="text-[11px] text-gray-400">Successfully disbursed to bank</p>
          </div>
          <div className="pt-2 border-t border-gray-50">
            <Link to="/dashboard/payouts" className="text-xs font-semibold text-gray-500 hover:text-gray-900">
              View payout log
            </Link>
          </div>
        </div>

        {/* Community & Campaigns */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Community Backers</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-2xl font-black text-gray-900">
              {contributions.filter((c) => c.paymentStatus === 'successful').length}
            </p>
            <p className="text-[11px] text-gray-400">
              Across {campaigns.length} campaigns & direct support
            </p>
          </div>
          <div className="pt-2 border-t border-gray-50">
            <Link to="/dashboard/campaigns" className="text-xs font-semibold text-[#6741D9] hover:underline">
              Manage campaigns
            </Link>
          </div>
        </div>
      </div>

      {/* Share Page Callout Card */}
      {creatorProfile?.username && (
        <div className="bg-gradient-to-r from-[#6741D9] to-indigo-700 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md shadow-[#6741D9]/15">
          <div className="space-y-1 max-w-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-white/20 rounded-md">
              Your Public Link
            </span>
            <h3 className="text-xl font-extrabold tracking-tight">
              Share buymedata.com/{creatorProfile.username}
            </h3>
            <p className="text-xs text-[#F0EBFF] leading-relaxed">
              Share on WhatsApp, Twitter/X, Instagram, or project READMEs to receive financial support anytime.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={copyLink}
              className="px-3.5 py-2.5 bg-white text-[#6741D9] font-bold text-xs rounded-xl shadow-xs hover:bg-gray-50 transition-colors flex items-center gap-1.5"
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
              to={`/${creatorProfile.username}`}
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
            <h3 className="font-extrabold text-lg text-gray-900">Recent Contributions</h3>
            <p className="text-xs text-gray-500">Live feed of supporter payments and messages</p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search supporter or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
            />
          </div>
        </div>

        {filteredContribs.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-gray-800">No contributions yet</h4>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Share your link with friends, audience, and community to start receiving financial support.
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
                      <div className="font-bold text-gray-900">
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
                        <span className="font-medium text-[#6741D9] truncate max-w-[180px] block">
                          {c.campaignTitle}
                        </span>
                      ) : (
                        <span className="text-gray-400">Direct Support</span>
                      )}
                    </td>
                    <td className="py-3.5 pr-4 font-bold text-gray-900">
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
