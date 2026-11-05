import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { PaymentTransaction, Contribution } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { CreditCard, Search, ArrowDownLeft, Loader2 } from 'lucide-react';

export function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadTxns = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(query(collection(db, 'paymentTransactions'), limit(100)));
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PaymentTransaction));
        setTransactions(list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };
    loadTxns();
  }, []);

  const filtered = transactions.filter(
    (t) =>
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.providerReference?.toLowerCase().includes(search.toLowerCase()) ||
      t.contributionId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-amber-600" />
          <span>Payment Gateway Transactions</span>
        </h1>
        <p className="text-xs text-gray-500">
          Raw transaction logs, gateway references, and idempotency tracking.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-4 border border-gray-100 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by transaction ID, reference, or contribution ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            No transactions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  <th className="p-4">Transaction ID</th>
                  <th className="p-4">Provider Reference</th>
                  <th className="p-4">Provider</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-mono text-[11px] text-gray-900 font-semibold">
                      {t.id}
                    </td>
                    <td className="p-4 font-mono text-[11px] text-gray-600">
                      {t.providerReference}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-[10px] uppercase px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {t.provider}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-900">
                      {formatCurrency(t.amount)}
                    </td>
                    <td className="p-4 text-gray-400 whitespace-nowrap text-[11px]">
                      {formatDateTime(t.createdAt)}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.status === 'successful'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {t.status.toUpperCase()}
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
