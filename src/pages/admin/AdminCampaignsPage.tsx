import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllCampaigns, toggleCampaignSuspension } from '../../services/adminService';
import { Campaign } from '../../types';
import { formatCurrency, calculateProgress } from '../../utils/formatters';
import {
  Flame,
  Search,
  ExternalLink,
  Ban,
  CheckCircle2,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

export function AdminCampaignsPage() {
  const { fbUser } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getAllCampaigns();
      setCampaigns(list);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleSuspend = async (camp: Campaign) => {
    if (!fbUser) return;
    const willSuspend = camp.status !== 'suspended';
    setActionLoading(camp.id);
    try {
      await toggleCampaignSuspension(
        fbUser.uid,
        camp.id,
        willSuspend,
        willSuspend ? 'Campaign flagged for policy violation' : 'Restored by admin'
      );
      await loadData();
    } catch (err) {
      console.error('Error toggling campaign suspension:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = campaigns.filter(
    (c) =>
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.creatorUsername?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-600" />
            <span>Campaign Moderation</span>
          </h1>
          <p className="text-xs text-gray-500">
            Review live and pending crowdfunding campaigns, flag suspicious goals, and protect contributors.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search campaigns by title, category, or creator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No campaigns found matching search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  <th className="p-4">Campaign</th>
                  <th className="p-4">Creator</th>
                  <th className="p-4">Target (NGN)</th>
                  <th className="p-4">Raised (NGN)</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Moderation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c) => {
                  const progress = calculateProgress(c.amountRaised, c.targetAmount);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50/50">
                      <td className="p-4">
                        <div className="font-bold text-gray-900 max-w-sm truncate">{c.title}</div>
                        <div className="text-[11px] text-gray-400">{c.category}</div>
                      </td>
                      <td className="p-4 font-mono text-gray-700">@{c.creatorUsername}</td>
                      <td className="p-4 font-bold text-gray-900">
                        {formatCurrency(c.targetAmount)}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-[#F22550]">
                          {formatCurrency(c.amountRaised)}
                        </span>{' '}
                        <span className="text-[10px] text-gray-400">({progress}%)</span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.status === 'suspended'
                              ? 'bg-rose-50 text-rose-700'
                              : c.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {c.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <a
                          href={`/${c.creatorUsername}/campaigns/${c.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg inline-flex items-center gap-1"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          onClick={() => handleToggleSuspend(c)}
                          disabled={actionLoading === c.id}
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                            c.status === 'suspended'
                              ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                              : 'border-rose-300 text-rose-700 hover:bg-rose-50'
                          }`}
                        >
                          {actionLoading === c.id
                            ? '...'
                            : c.status === 'suspended'
                            ? 'Restore'
                            : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
