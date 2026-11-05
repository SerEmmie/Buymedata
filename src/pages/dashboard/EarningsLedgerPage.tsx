import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { getCreatorFinancialSummary } from '../../services/paymentService';
import { LedgerEntry } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  PieChart,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  Info,
  Loader2,
} from 'lucide-react';

export function EarningsLedgerPage() {
  const { fbUser } = useAuth();
  const [financials, setFinancials] = useState({
    grossContributions: 0,
    platformFees: 0,
    netEarnings: 0,
    availableBalance: 0,
    pendingBalance: 0,
    totalWithdrawn: 0,
  });
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!fbUser) return;
    const loadLedger = async () => {
      setLoading(true);
      try {
        const [fin, ledgerSnap] = await Promise.all([
          getCreatorFinancialSummary(fbUser.uid),
          getDocs(
            query(
              collection(db, 'ledgerEntries'),
              where('accountOwner', '==', fbUser.uid)
            )
          ),
        ]);
        setFinancials(fin);
        const entries = ledgerSnap.docs.map((d) => ({ id: d.id, ...d.data() } as LedgerEntry));
        setLedgerEntries(entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (err) {
        console.error('Error loading ledger:', err);
      } finally {
        setLoading(false);
      }
    };
    loadLedger();
  }, [fbUser]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <PieChart className="w-6 h-6 text-[#6741D9]" />
            <span>Earnings & Financial Ledger</span>
          </h1>
          <p className="text-xs text-gray-500">
            Immutable, double-entry financial accounting records for every kobo settled.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Double-Entry Reconciled</span>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Available For Withdrawal
          </span>
          <p className="text-3xl font-black text-emerald-700">
            {formatCurrency(financials.availableBalance)}
          </p>
          <p className="text-[11px] text-gray-400">
            Eligible for immediate payout to bank
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Net Lifetime Earnings
          </span>
          <p className="text-3xl font-black text-gray-900">
            {formatCurrency(financials.netEarnings)}
          </p>
          <p className="text-[11px] text-gray-400">
            Gross contributions minus platform fees
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Disbursed to Bank
          </span>
          <p className="text-3xl font-black text-gray-900">
            {formatCurrency(financials.totalWithdrawn)}
          </p>
          <p className="text-[11px] text-gray-400">
            Completed transfer payouts
          </p>
        </div>
      </div>

      {/* Double-Entry Ledger Explanation Box */}
      <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-100 flex items-start gap-3 text-xs text-blue-900">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold">How our ledger works: </span>
          BuyMeData uses an immutable double-entry ledger design. When a supporter contributes, money enters <span className="font-mono font-semibold">ESCROW_CASH</span> (Debit), the platform fee credits <span className="font-mono font-semibold">PLATFORM_FEES</span>, and your earnings credit <span className="font-mono font-semibold">CREATOR_AVAILABLE</span>. Balances are derived directly from transactional entries.
        </div>
      </div>

      {/* Ledger Entries Table */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs space-y-3 p-6">
        <h3 className="font-extrabold text-base text-gray-900">
          Immutable Ledger Audit Trail
        </h3>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#6741D9]" />
          </div>
        ) : ledgerEntries.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No financial events recorded in ledger yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  <th className="p-3">Entry ID</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Account Type</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ledgerEntries.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50/50">
                    <td className="p-3 font-mono text-[11px] text-gray-500">
                      {e.id}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          e.entryType === 'CREDIT'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {e.entryType === 'CREDIT' ? (
                          <ArrowDownLeft className="w-3 h-3" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3" />
                        )}
                        {e.entryType}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-gray-700 font-semibold">
                      {e.accountType}
                    </td>
                    <td className="p-3 text-gray-600 max-w-xs truncate">
                      {e.description}
                    </td>
                    <td className="p-3 font-bold text-gray-900">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="p-3 text-gray-400 whitespace-nowrap text-[11px]">
                      {formatDateTime(e.createdAt)}
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
