import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAllPayouts, approvePayout, rejectPayout } from '../../services/adminService';
import { Payout } from '../../types';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Landmark,
  CheckCircle2,
  XCircle,
  Clock,
  Check,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export function AdminPayoutsPage() {
  const { fbUser } = useAuth();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModalPayout, setRejectModalPayout] = useState<Payout | null>(null);
  const [rejectReason, setRejectReason] = useState('Account details mismatch with CBN NUBAN records');

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getAllPayouts();
      setPayouts(list);
    } catch (err) {
      console.error('Error fetching payouts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (payout: Payout) => {
    if (!fbUser) return;
    setActionLoading(payout.id);
    try {
      await approvePayout(fbUser.uid, payout.id);
      await loadData();
    } catch (err) {
      console.error('Failed to approve payout:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbUser || !rejectModalPayout) return;
    setActionLoading(rejectModalPayout.id);
    try {
      await rejectPayout(fbUser.uid, rejectModalPayout.id, rejectReason);
      setRejectModalPayout(null);
      await loadData();
    } catch (err) {
      console.error('Failed to reject payout:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Landmark className="w-6 h-6 text-amber-600" />
            <span>Payout Approval Queue</span>
          </h1>
          <p className="text-xs text-gray-500">
            Review creator withdrawal requests, verify compliance, and execute double-entry ledger disbursements.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No payout withdrawal requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  <th className="p-4">Reference</th>
                  <th className="p-4">Requested Amount</th>
                  <th className="p-4">Fee (₦50)</th>
                  <th className="p-4">Net Payout</th>
                  <th className="p-4">Destination Bank Account</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-mono text-[11px] text-gray-500">
                      {p.providerReference || p.id}
                    </td>
                    <td className="p-4 font-bold text-gray-900">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="p-4 text-gray-400">
                      {formatCurrency(p.fee)}
                    </td>
                    <td className="p-4 font-bold text-emerald-700">
                      {formatCurrency(p.netAmount)}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-gray-800">{p.bankDetails?.bankName}</div>
                      <div className="text-[11px] text-gray-500 font-mono">{p.bankDetails?.maskedAccountNumber}</div>
                      <div className="text-[10px] text-gray-400 uppercase truncate max-w-[160px]">{p.bankDetails?.accountName}</div>
                    </td>
                    <td className="p-4 text-gray-400 whitespace-nowrap">
                      {formatDate(p.requestedAt)}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.status === 'successful'
                            ? 'bg-emerald-50 text-emerald-700'
                            : p.status === 'pending'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {p.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleApprove(p)}
                            disabled={actionLoading === p.id}
                            className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectModalPayout(p)}
                            disabled={actionLoading === p.id}
                            className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[11px]">Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModalPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-gray-900">Decline Payout Request</h3>
              <button
                onClick={() => setRejectModalPayout(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              State the reason for declining this withdrawal of {formatCurrency(rejectModalPayout.amount)}. The funds will remain in the creator's balance.
            </p>

            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason for decline
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-gray-200"
                >
                  <option value="Account details mismatch with CBN NUBAN records">Account details mismatch with CBN records</option>
                  <option value="Suspected fraud or account investigation">Suspected fraud or account investigation</option>
                  <option value="Bank network transfer failure">Bank network transfer failure</option>
                  <option value="Other compliance policy requirement">Other compliance policy requirement</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={actionLoading === rejectModalPayout.id}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Confirm Decline
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
