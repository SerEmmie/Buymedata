import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCreatorContributions } from '../../services/paymentService';
import { Contribution } from '../../types';
import { formatCurrency, formatDate, timeAgo } from '../../utils/formatters';
import {
  CreditCard,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  MessageSquare,
  Loader2,
  X,
  ExternalLink,
  ShieldCheck,
  Flame,
  User,
} from 'lucide-react';

export function ContributionsListPage() {
  const { fbUser } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'successful' | 'pending'>('all');
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);

  useEffect(() => {
    if (!fbUser) return;
    setLoading(true);
    getCreatorContributions(fbUser.uid)
      .then(setContributions)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [fbUser]);

  const filtered = contributions.filter((c) => {
    const matchesSearch =
      c.supporterName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.supporterEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.campaignTitle?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || c.paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalGross = filtered.reduce((acc, curr) => acc + (curr.paymentStatus === 'successful' ? curr.amount : 0), 0);
  const totalNet = filtered.reduce((acc, curr) => acc + (curr.paymentStatus === 'successful' ? curr.netAmount : 0), 0);

  const exportCSV = () => {
    const headers = [
      'Contribution ID',
      'Supporter Name',
      'Email',
      'Gross Amount (NGN)',
      'Platform Fee (NGN)',
      'Net Earnings (NGN)',
      'Campaign',
      'Status',
      'Date',
      'Message',
    ];
    const rows = filtered.map((c) => [
      c.id,
      c.anonymous ? 'Anonymous' : c.supporterName,
      c.supporterEmail,
      c.amount,
      c.platformFee,
      c.netAmount,
      c.campaignTitle || 'Direct Support',
      c.paymentStatus,
      c.createdAt,
      `"${(c.message || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `buymedata_contributions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Contributions Log
          </h1>
          <p className="text-xs text-gray-500">
            Audit log of all financial support received from your community and campaign backers.
          </p>
        </div>

        <button
          onClick={exportCSV}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Filtered Gross Total
          </span>
          <span className="text-xl font-extrabold text-gray-900 mt-1 block">
            {formatCurrency(totalGross)}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Filtered Net Earnings
          </span>
          <span className="text-xl font-extrabold text-emerald-700 mt-1 block">
            {formatCurrency(totalNet)}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Matching Contributions
          </span>
          <span className="text-xl font-extrabold text-gray-900 mt-1 block">
            {filtered.length} contributions
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by supporter name, email, campaign, or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#F22550]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="successful">Successful Only</option>
            <option value="pending">Pending Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-[#F22550]" />
            <p className="text-xs text-gray-400">Loading contributions log...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center mx-auto">
              <CreditCard className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-sm text-gray-800">No contributions found</h4>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              {searchTerm || statusFilter !== 'all'
                ? 'Try clearing your search query or status filter.'
                : 'Share your BuyMeData link to start receiving contributions.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  <th className="p-4">Supporter</th>
                  <th className="p-4">Context</th>
                  <th className="p-4">Gross Amount</th>
                  <th className="p-4">Fee (5%)</th>
                  <th className="p-4">Net Earned</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedContribution(c)}
                    className="hover:bg-gray-50/70 transition-colors cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="font-bold text-gray-900">
                        {c.anonymous ? 'Generous Believer (Anon)' : c.supporterName}
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono">
                        {c.supporterEmail}
                      </div>
                      {c.message && (
                        <div className="text-[11px] text-gray-600 italic mt-1 max-w-xs truncate">
                          "{c.message}"
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {c.campaignTitle ? (
                        <span className="font-medium text-[#F22550] max-w-[180px] truncate block flex items-center gap-1">
                          <Flame className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{c.campaignTitle}</span>
                        </span>
                      ) : (
                        <span className="text-gray-400">Direct Page Support</span>
                      )}
                    </td>
                    <td className="p-4 font-bold text-gray-900">
                      {formatCurrency(c.amount)}
                    </td>
                    <td className="p-4 text-gray-500">
                      {formatCurrency(c.platformFee)}
                    </td>
                    <td className="p-4 font-bold text-emerald-700">
                      {formatCurrency(c.netAmount)}
                    </td>
                    <td className="p-4 text-gray-400 whitespace-nowrap">
                      {formatDate(c.createdAt)}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.paymentStatus === 'successful'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {c.paymentStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedContribution(c);
                        }}
                        className="text-xs font-semibold text-[#F22550] hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contribution Detail Modal */}
      {selectedContribution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#FFE6EA] text-[#F22550] flex items-center justify-center font-bold">
                  ₦
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">Contribution Receipt</h3>
                  <p className="text-[11px] font-mono text-gray-400">ID: {selectedContribution.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedContribution(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Breakdown Card */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-100 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Gross Contribution:</span>
                <span className="font-bold text-gray-900">{formatCurrency(selectedContribution.amount)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Platform Fee (5%):</span>
                <span>- {formatCurrency(selectedContribution.platformFee)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 text-sm font-extrabold text-emerald-700">
                <span>Net Withdrawable:</span>
                <span>{formatCurrency(selectedContribution.netAmount)}</span>
              </div>
            </div>

            {/* Supporter details */}
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                  Supporter
                </span>
                <p className="font-bold text-gray-900">
                  {selectedContribution.anonymous ? 'Anonymous Supporter' : selectedContribution.supporterName}
                </p>
                <p className="text-[11px] text-gray-500 font-mono">{selectedContribution.supporterEmail}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                  Fundraising Context
                </span>
                <p className="font-semibold text-gray-800">
                  {selectedContribution.campaignTitle ? `Campaign: ${selectedContribution.campaignTitle}` : 'Direct Creator Profile Support'}
                </p>
              </div>

              {selectedContribution.message && (
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-0.5">
                    Supporter Message
                  </span>
                  <div className="bg-[#FFE6EA]/30 p-3 rounded-xl border border-[#F22550]/15 text-xs text-gray-800 italic leading-relaxed">
                    "{selectedContribution.message}"
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 text-[11px] text-gray-500 border-t border-gray-100">
                <div>
                  <span className="block font-medium">Payment Status:</span>
                  <span className="font-bold uppercase text-emerald-700">{selectedContribution.paymentStatus}</span>
                </div>
                <div>
                  <span className="block font-medium">Recorded Date:</span>
                  <span className="font-bold text-gray-800">{formatDate(selectedContribution.createdAt)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedContribution(null)}
              className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
