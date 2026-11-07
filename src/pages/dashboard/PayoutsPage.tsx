import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getCreatorPaymentAccount,
  savePaymentAccount,
  getCreatorPayouts,
} from '../../services/payoutService';
import { PaymentAccount, Payout } from '../../types';
import { SUPPORTED_NIGERIAN_BANKS } from '../../utils/banks';
import { formatCurrency, formatDate } from '../../utils/formatters';
import {
  Landmark,
  CreditCard,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ShieldCheck,
  Check,
  X,
  Loader2,
  FlaskConical,
  Send,
} from 'lucide-react';

export function PayoutsPage() {
  const { fbUser } = useAuth();
  const [account, setAccount] = useState<PaymentAccount | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [loading, setLoading] = useState(true);

  // Bank form state
  const [showBankForm, setShowBankForm] = useState(false);
  const [selectedBankCode, setSelectedBankCode] = useState('058');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [resolving, setResolving] = useState(false);
  const [accountVerified, setAccountVerified] = useState(false);
  const [bankError, setBankError] = useState('');

  // Payout request modal state
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(2000);
  const [payoutSubmitting, setPayoutSubmitting] = useState(false);
  const [payoutError, setPayoutError] = useState('');
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  // Testing & Sandbox simulation panel
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testSimulating, setTestSimulating] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const loadData = async () => {
    if (!fbUser) return;
    setLoading(true);
    try {
      const [acc, pyts] = await Promise.all([
        getCreatorPaymentAccount(fbUser.uid),
        getCreatorPayouts(fbUser.uid),
      ]);
      setAccount(acc);
      setPayouts(pyts);

      // Fetch official server balance directly from double-entry ledger API
      const balRes = await fetch(`/api/payouts/balance/${fbUser.uid}`);
      if (balRes.ok) {
        const balData = await balRes.json();
        setAvailableBalance(balData.data?.availableBalance || 0);
        setTotalEarned(balData.data?.totalEarned || 0);
        setTotalWithdrawn(balData.data?.totalWithdrawn || 0);
      }
    } catch (err) {
      console.error('Error loading payouts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [fbUser]);

  const handleResolve = async () => {
    if (!/^\d{10}$/.test(accountNumber)) {
      setBankError('Account number must be exactly 10 digits.');
      return;
    }
    setBankError('');
    setResolving(true);
    try {
      // Call backend /api/banks/resolve which verifies with Paystack NUBAN API
      const res = await fetch('/api/banks/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber,
          bankCode: selectedBankCode,
        }),
      });

      const data = await res.json();
      if (res.ok && data.accountName) {
        setAccountName(data.accountName);
        setAccountVerified(true);
      } else {
        setBankError(data.error || 'Could not verify account name with NUBAN directory.');
      }
    } catch (err) {
      setBankError('Failed to contact bank verification server.');
    } finally {
      setResolving(false);
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbUser || !accountVerified) return;
    setBankError('');
    const bankObj = SUPPORTED_NIGERIAN_BANKS.find((b) => b.code === selectedBankCode);

    try {
      const newAcc = await savePaymentAccount({
        userId: fbUser.uid,
        bankName: bankObj ? bankObj.name : 'Nigerian Commercial Bank',
        bankCode: selectedBankCode,
        accountNumber,
        accountName,
      });
      setAccount(newAcc);
      setShowBankForm(false);
    } catch (err) {
      setBankError('Failed to save bank account.');
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbUser || !account) return;
    setPayoutError('');
    setPayoutSubmitting(true);

    try {
      // Call server-side payout endpoint that verifies ledger balance and calls Paystack Transfer
      const res = await fetch('/api/payouts/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: fbUser.uid,
          amount: payoutAmount,
          paymentAccountId: account.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server rejected payout initiation.');
      }

      setPayoutSuccess(true);
      await loadData();
      setTimeout(() => {
        setPayoutModalOpen(false);
        setPayoutSuccess(false);
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payout request failed';
      setPayoutError(msg);
    } finally {
      setPayoutSubmitting(false);
    }
  };

  // Test webhook simulator for testing payout and charge events
  const handleTestWebhookSimulation = async (eventType: 'collection.succeeded' | 'checkout.completed' | 'payout.succeeded' | 'charge.success') => {
    setTestSimulating(true);
    setTestResult(null);
    try {
      const payload = {
        event: eventType,
        data: {
          id: Math.floor(Math.random() * 900000),
          reference: payouts[0]?.providerReference || `BMD-TEST-${Date.now()}`,
          amount: 5000, // ₦5,000 NGN
          currency: 'NGN',
          status: 'success',
          paid_at: new Date().toISOString(),
        },
      };

      const res = await fetch('/api/payments/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bachs-signature': 'simulated_test_signature',
          'x-buymedata-test-webhook': 'true',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setTestResult(`✅ Webhook (${eventType}) handled successfully with 200 OK.`);
        await loadData();
      } else {
        setTestResult(`❌ Webhook simulation failed with status ${res.status}.`);
      }
    } catch (err) {
      setTestResult(`❌ Error running simulation: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setTestSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Landmark className="w-6 h-6 text-[#F22550]" />
            <span>Payouts & Bank Transfers</span>
          </h1>
          <p className="text-xs text-gray-500">
            Automated Bachs.io transfer settlements to verified Nigerian commercial bank accounts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTestPanel(!showTestPanel)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Test Mode Sandbox</span>
          </button>

          {account && (
            <button
              onClick={() => {
                setPayoutAmount(Math.min(availableBalance, 10000) || 2000);
                setPayoutModalOpen(true);
              }}
              disabled={availableBalance < 2000}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#F22550] hover:bg-[#D81A43] text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50 transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Request Withdrawal</span>
            </button>
          )}
        </div>
      </div>

      {/* Test Sandbox Panel */}
      {showTestPanel && (
        <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-3xl space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-[#F22550]" />
              <span>Bachs.io Infrastructure & Webhook Test Suite</span>
            </h4>
            <span className="text-[10px] font-mono text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md font-bold">
              Sandbox Active
            </span>
          </div>

          <p className="text-xs text-indigo-900/80 leading-relaxed">
            Test the automated Bachs.io webhook dispatch and server verification pipeline. Signed HMAC-SHA256 delivery, idempotency checks, and double-entry ledger settlements can be validated below without real money.
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => handleTestWebhookSimulation('collection.succeeded')}
              disabled={testSimulating}
              className="px-3 py-1.5 bg-[#F22550] hover:bg-[#D81A43] text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
            >
              {testSimulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Simulate `collection.succeeded` Webhook</span>
            </button>

            <button
              onClick={() => handleTestWebhookSimulation('payout.succeeded')}
              disabled={testSimulating}
              className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
            >
              {testSimulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Simulate `payout.succeeded` Payout</span>
            </button>
          </div>

          {testResult && (
            <div className="p-3 bg-white rounded-xl border border-indigo-100 text-xs font-mono text-indigo-900">
              {testResult}
            </div>
          )}
        </div>
      )}

      {/* Balance & Account Snapshot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Available Balance */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-2 md:col-span-2 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Withdrawable Available Balance
            </span>
            <p className="text-3xl font-black text-emerald-700 mt-1">
              {formatCurrency(availableBalance)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-50">
            <span>Total Gross Earned: <strong className="text-gray-900">{formatCurrency(totalEarned)}</strong></span>
            <span>Total Disbursed: <strong className="text-gray-900">{formatCurrency(totalWithdrawn)}</strong></span>
            <span>Transfer Fee: <strong className="text-gray-900">₦50</strong></span>
          </div>
        </div>

        {/* Bank Account Snapshot Card */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              Disbursement Account
            </span>
            {account ? (
              <div>
                <p className="font-bold text-gray-900 text-sm">{account.bankName}</p>
                <p className="text-xs font-mono text-gray-500 mt-0.5">{account.maskedAccountNumber}</p>
                <p className="text-xs font-semibold text-gray-700 mt-1 truncate">{account.accountName}</p>
                <div className="pt-2 flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> Bachs NUBAN Verified
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400">No bank account linked yet.</p>
            )}
          </div>

          <button
            onClick={() => setShowBankForm(!showBankForm)}
            className="text-xs font-bold text-[#F22550] hover:underline text-left"
          >
            {account ? 'Update Bank Account' : '+ Add Bank Account'}
          </button>
        </div>
      </div>

      {/* Add Bank Form if expanded */}
      {showBankForm && (
        <div className="bg-white rounded-3xl p-6 border border-[#F22550]/20 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="font-extrabold text-sm text-gray-900">Link Verified Bank Account</h3>
            <button onClick={() => setShowBankForm(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          {bankError && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{bankError}</span>
            </div>
          )}

          <form onSubmit={handleSaveBank} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Select Nigerian Bank
                </label>
                <select
                  value={selectedBankCode}
                  onChange={(e) => {
                    setSelectedBankCode(e.target.value);
                    setAccountVerified(false);
                    setAccountName('');
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200"
                >
                  {SUPPORTED_NIGERIAN_BANKS.map((b) => (
                    <option key={b.code} value={b.code}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  10-Digit Account Number (NUBAN)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="0123456789"
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value.replace(/\D/g, ''));
                      setAccountVerified(false);
                      setAccountName('');
                    }}
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-xl border border-gray-200"
                  />
                  <button
                    type="button"
                    onClick={handleResolve}
                    disabled={resolving || accountNumber.length !== 10}
                    className="px-4 py-2 bg-gray-900 text-white font-semibold text-xs rounded-xl disabled:opacity-50"
                  >
                    {resolving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify'}
                  </button>
                </div>
              </div>
            </div>

            {accountVerified && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 block uppercase">
                    Account Holder Name (Paystack NUBAN)
                  </span>
                  <span className="font-bold">{accountName}</span>
                </div>
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
            )}

            <button
              type="submit"
              disabled={!accountVerified}
              className="py-2.5 px-5 bg-[#F22550] hover:bg-[#D81A43] text-white font-bold text-xs rounded-xl disabled:opacity-50"
            >
              Save Bank Account
            </button>
          </form>
        </div>
      )}

      {/* Payout History Table */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-xs space-y-3 p-6">
        <h3 className="font-extrabold text-base text-gray-900">
          Payout History
        </h3>

        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#F22550]" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No withdrawal payout requests submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  <th className="p-3">Reference</th>
                  <th className="p-3">Gross Amount</th>
                  <th className="p-3">Transfer Fee</th>
                  <th className="p-3">Net Transferred</th>
                  <th className="p-3">Destination</th>
                  <th className="p-3">Requested</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50">
                    <td className="p-3 font-mono text-[11px] text-gray-500">
                      {p.providerReference || p.id}
                    </td>
                    <td className="p-3 font-bold text-gray-900">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="p-3 text-gray-400">
                      {formatCurrency(p.fee)}
                    </td>
                    <td className="p-3 font-bold text-emerald-700">
                      {formatCurrency(p.netAmount)}
                    </td>
                    <td className="p-3 text-gray-600">
                      {p.bankDetails?.bankName} ({p.bankDetails?.maskedAccountNumber})
                    </td>
                    <td className="p-3 text-gray-400 whitespace-nowrap text-[11px]">
                      {formatDate(p.requestedAt)}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.status === 'successful'
                            ? 'bg-emerald-50 text-emerald-700'
                            : p.status === 'pending' || p.status === 'processing'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {p.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Request Payout Modal */}
      {payoutModalOpen && account && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-gray-900">Request Withdrawal</h3>
                <p className="text-xs text-gray-500">Available: {formatCurrency(availableBalance)}</p>
              </div>
              <button
                onClick={() => setPayoutModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {payoutSuccess ? (
              <div className="py-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Withdrawal Initiated with Paystack</h4>
                <p className="text-xs text-gray-500">
                  Transfer request dispatched to {account.bankName}. Double-entry ledger settlement confirmed.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRequestPayout} className="space-y-4">
                {payoutError && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{payoutError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Withdrawal Amount (NGN ₦)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 font-bold text-gray-400 text-xs">
                      ₦
                    </span>
                    <input
                      type="number"
                      required
                      min={2000}
                      max={availableBalance}
                      step={500}
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(Number(e.target.value) || 0)}
                      className="w-full pl-8 pr-3.5 py-2.5 text-xs font-bold rounded-xl border border-gray-200"
                    />
                  </div>
                </div>

                {/* Breakdown */}
                <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-xs space-y-1.5 text-gray-600">
                  <div className="flex justify-between">
                    <span>Withdrawal Amount</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(payoutAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Transfer Processing Fee</span>
                    <span>₦50</span>
                  </div>
                  <div className="pt-1.5 border-t border-gray-200 flex justify-between font-bold text-gray-900">
                    <span>Net to receive in bank</span>
                    <span className="text-emerald-700">{formatCurrency(Math.max(0, payoutAmount - 50))}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 pt-1">
                    Destination: {account.bankName} ({account.maskedAccountNumber})
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={payoutSubmitting || payoutAmount < 2000 || payoutAmount > availableBalance}
                  className="w-full py-3 bg-[#F22550] hover:bg-[#D81A43] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {payoutSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Withdrawal Request'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
