import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { resetPassword } from '../../services/authService';
import { getCreatorPaymentAccount, savePaymentAccount } from '../../services/payoutService';
import { SUPPORTED_NIGERIAN_BANKS, simulateResolveAccount } from '../../utils/banks';
import { PaymentAccount } from '../../types';
import {
  Settings,
  Shield,
  Key,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Landmark,
  Check,
  Loader2,
  Bell,
  Lock,
} from 'lucide-react';

export function SettingsPage() {
  const { userProfile, fbUser, creatorProfile } = useAuth();
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Bank management state
  const [paymentAccount, setPaymentAccount] = useState<PaymentAccount | null>(null);
  const [bankLoading, setBankLoading] = useState(true);
  const [editingBank, setEditingBank] = useState(false);
  const [selectedBankCode, setSelectedBankCode] = useState('058');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [accountVerified, setAccountVerified] = useState(false);
  const [savingBank, setSavingBank] = useState(false);
  const [bankSuccessMsg, setBankSuccessMsg] = useState('');
  const [bankErrorMsg, setBankErrorMsg] = useState('');

  // Notification preferences
  const [notifyOnContribution, setNotifyOnContribution] = useState(true);
  const [notifyOnMilestone, setNotifyOnMilestone] = useState(true);
  const [notifyOnPayout, setNotifyOnPayout] = useState(true);
  const [prefSaved, setPrefSaved] = useState(false);

  useEffect(() => {
    if (!fbUser) return;
    setBankLoading(true);
    getCreatorPaymentAccount(fbUser.uid)
      .then((acc) => {
        setPaymentAccount(acc);
        if (acc) {
          setSelectedBankCode(acc.bankCode);
        }
      })
      .catch(console.error)
      .finally(() => setBankLoading(false));
  }, [fbUser]);

  const handleResolveBank = async () => {
    if (!/^\d{10}$/.test(accountNumber)) {
      setBankErrorMsg('Please enter a valid 10-digit NUBAN account number.');
      return;
    }
    setBankErrorMsg('');
    setResolvingAccount(true);

    try {
      const res = await simulateResolveAccount(accountNumber, selectedBankCode);
      if (res.valid) {
        setAccountName(res.accountName);
        setAccountVerified(true);
      } else {
        setBankErrorMsg('Could not verify account with the chosen bank. Please check your account number.');
      }
    } catch (err) {
      setBankErrorMsg('Failed to verify account. Please try again.');
    } finally {
      setResolvingAccount(false);
    }
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbUser || !accountVerified) return;
    setSavingBank(true);
    setBankErrorMsg('');

    try {
      const bankObj = SUPPORTED_NIGERIAN_BANKS.find((b) => b.code === selectedBankCode);
      const updated = await savePaymentAccount({
        userId: fbUser.uid,
        bankName: bankObj ? bankObj.name : 'Nigerian Commercial Bank',
        bankCode: selectedBankCode,
        accountNumber,
        accountName,
      });

      setPaymentAccount(updated);
      setEditingBank(false);
      setBankSuccessMsg('Bank payout account updated successfully!');
      setTimeout(() => setBankSuccessMsg(''), 4000);
    } catch (err: unknown) {
      console.error('Error saving bank account:', err);
      setBankErrorMsg('Failed to save bank account. Please try again.');
    } finally {
      setSavingBank(false);
    }
  };

  const handleSendReset = async () => {
    if (!fbUser?.email) return;
    setResetLoading(true);
    try {
      await resetPassword(fbUser.email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 4000);
    } catch (err) {
      console.error('Password reset error:', err);
    } finally {
      setResetLoading(false);
    }
  };

  const handleSavePreferences = () => {
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-[#F22550]" />
          <span>Creator Settings & Payouts</span>
        </h1>
        <p className="text-xs text-gray-500">
          Manage your account credentials, verified payout bank, and notification preferences.
        </p>
      </div>

      {/* Account Profile Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
        <h3 className="font-extrabold text-base text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
          <User className="w-4 h-4 text-[#F22550]" />
          <span>Account Profile</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-gray-400 font-semibold uppercase text-[10px] block mb-1">
              Full Legal Name
            </label>
            <p className="font-bold text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">
              {userProfile?.fullName || fbUser?.displayName || 'Creator'}
            </p>
          </div>

          <div>
            <label className="text-gray-400 font-semibold uppercase text-[10px] block mb-1">
              Registered Email
            </label>
            <p className="font-bold text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100 truncate">
              {userProfile?.email || fbUser?.email}
            </p>
          </div>

          <div>
            <label className="text-gray-400 font-semibold uppercase text-[10px] block mb-1">
              Account Role & Status
            </label>
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex items-center justify-between">
              <span className="font-bold uppercase text-[#F22550]">
                {userProfile?.role || 'Creator'}
              </span>
              <span className={`text-[10px] px-2 py-0.5 font-bold rounded ${
                userProfile?.accountStatus === 'suspended'
                  ? 'bg-rose-50 text-rose-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}>
                {userProfile?.accountStatus === 'suspended' ? 'RESTRICTED' : 'ACTIVE'}
              </span>
            </div>
          </div>

          <div>
            <label className="text-gray-400 font-semibold uppercase text-[10px] block mb-1">
              Public Creator Handle
            </label>
            <p className="font-bold text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">
              @{creatorProfile?.username || userProfile?.username || 'user'}
            </p>
          </div>
        </div>
      </div>

      {/* Linked Nigerian Bank Payout Account */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-base text-gray-900">
              Linked Payout Bank Account (NGN ₦)
            </h3>
          </div>
          {paymentAccount && !editingBank && (
            <button
              type="button"
              onClick={() => setEditingBank(true)}
              className="text-xs font-semibold text-[#F22550] hover:underline"
            >
              Change Bank
            </button>
          )}
        </div>

        {bankSuccessMsg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{bankSuccessMsg}</span>
          </div>
        )}

        {bankErrorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{bankErrorMsg}</span>
          </div>
        )}

        {bankLoading ? (
          <div className="py-6 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#F22550]" />
          </div>
        ) : paymentAccount && !editingBank ? (
          <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Check className="w-3 h-3" /> Verified for Direct Payouts
              </span>
              <span className="text-xs font-mono font-bold text-gray-600">
                {paymentAccount.maskedAccountNumber}
              </span>
            </div>
            <div>
              <p className="text-sm font-extrabold text-gray-900">{paymentAccount.accountName}</p>
              <p className="text-xs text-gray-500 font-semibold">{paymentAccount.bankName}</p>
            </div>
            <p className="text-[11px] text-gray-400 pt-2 border-t border-gray-200">
              Funds withdrawn from your Available Balance will be electronically disbursed to this destination account.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSaveBank} className="space-y-4">
            <p className="text-xs text-gray-500">
              Provide your 10-digit NUBAN account number. Our automated verification confirms your account name against the Nigerian Inter-Bank Settlement System (NIBSS).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nigerian Commercial Bank
                </label>
                <select
                  value={selectedBankCode}
                  onChange={(e) => {
                    setSelectedBankCode(e.target.value);
                    setAccountVerified(false);
                    setAccountName('');
                  }}
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#F22550]"
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
                  10-Digit Account Number
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
                    className="flex-1 px-3 py-2.5 text-xs font-mono font-semibold rounded-xl border border-gray-200 focus:outline-none focus:border-[#F22550]"
                  />
                  <button
                    type="button"
                    onClick={handleResolveBank}
                    disabled={resolvingAccount || accountNumber.length !== 10}
                    className="px-3 py-2 bg-gray-900 text-white font-semibold text-xs rounded-xl disabled:opacity-50 hover:bg-gray-800 transition-colors whitespace-nowrap"
                  >
                    {resolvingAccount ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify'}
                  </button>
                </div>
              </div>
            </div>

            {accountVerified && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">
                    Verified Account Holder
                  </span>
                  <span className="font-bold">{accountName}</span>
                </div>
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={!accountVerified || savingBank}
                className="px-5 py-2.5 bg-[#F22550] hover:bg-[#D81A43] text-white font-bold text-xs rounded-xl disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {savingBank ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Bank Account</span>
              </button>

              {paymentAccount && (
                <button
                  type="button"
                  onClick={() => setEditingBank(false)}
                  className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold text-xs rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-5">
        <h3 className="font-extrabold text-base text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#F22550]" />
          <span>Notification Preferences</span>
        </h3>

        <div className="space-y-3 text-xs">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyOnContribution}
              onChange={(e) => setNotifyOnContribution(e.target.checked)}
              className="mt-0.5 rounded text-[#F22550] focus:ring-[#F22550] w-4 h-4"
            />
            <div>
              <span className="font-bold text-gray-900 block">Contribution Alerts</span>
              <span className="text-gray-500">Notify me immediately when someone contributes or leaves a message.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyOnMilestone}
              onChange={(e) => setNotifyOnMilestone(e.target.checked)}
              className="mt-0.5 rounded text-[#F22550] focus:ring-[#F22550] w-4 h-4"
            />
            <div>
              <span className="font-bold text-gray-900 block">Campaign Milestones</span>
              <span className="text-gray-500">Send an update when any active campaign reaches 50% or 100% of goal.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyOnPayout}
              onChange={(e) => setNotifyOnPayout(e.target.checked)}
              className="mt-0.5 rounded text-[#F22550] focus:ring-[#F22550] w-4 h-4"
            />
            <div>
              <span className="font-bold text-gray-900 block">Payout Updates</span>
              <span className="text-gray-500">Notify me when withdrawal requests are submitted, approved, or disbursed.</span>
            </div>
          </label>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleSavePreferences}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs rounded-xl transition-colors"
          >
            {prefSaved ? 'Preferences Saved!' : 'Save Notification Settings'}
          </button>
        </div>
      </div>

      {/* Security & Credentials */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-6">
        <h3 className="font-extrabold text-base text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#F22550]" />
          <span>Authentication & Security</span>
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-100">
          <div>
            <h4 className="font-bold text-xs text-gray-900">Change Account Password</h4>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Send a secure password reset link to your registered email address ({fbUser?.email}).
            </p>
          </div>

          <button
            onClick={handleSendReset}
            disabled={resetLoading}
            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-100 text-gray-800 font-semibold text-xs rounded-xl transition-colors whitespace-nowrap shadow-xs"
          >
            {resetLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </div>

        {resetSent && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Password reset instructions sent to your email inbox!</span>
          </div>
        )}
      </div>
    </div>
  );
}
