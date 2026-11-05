import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getPlatformSettings } from '../../services/paymentService';
import { updatePlatformSettings } from '../../services/adminService';
import { PlatformSettings } from '../../types';
import { Settings, Save, Check, ShieldCheck, Loader2 } from 'lucide-react';

export function AdminSettingsPage() {
  const { fbUser } = useAuth();
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [feePercent, setFeePercent] = useState(5.0);
  const [minContrib, setMinContrib] = useState(200);
  const [maxContrib, setMaxContrib] = useState(5000000);
  const [minPayout, setMinPayout] = useState(2000);
  const [payoutFee, setPayoutFee] = useState(50);
  const [maintenance, setMaintenance] = useState(false);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    getPlatformSettings().then((s) => {
      setSettings(s);
      setFeePercent(s.platformFeePercentage);
      setMinContrib(s.minimumContribution);
      setMaxContrib(s.maximumContribution);
      setMinPayout(s.minimumPayout);
      setPayoutFee(s.payoutFee || 50);
      setMaintenance(s.maintenanceMode || false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbUser) return;
    setSaving(true);
    try {
      await updatePlatformSettings(fbUser.uid, {
        platformFeePercentage: feePercent,
        minimumContribution: minContrib,
        maximumContribution: maxContrib,
        minimumPayout: minPayout,
        payoutFee: payoutFee,
        maintenanceMode: maintenance,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update platform settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-amber-600" />
          <span>Platform Global Settings</span>
        </h1>
        <p className="text-xs text-gray-500">
          Configure financial rules, platform fees, minimum withdrawal thresholds, and system policies.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-2xl border border-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">Platform settings saved & audit log entry recorded.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-5">
        <h3 className="font-extrabold text-sm text-gray-900 border-b border-gray-100 pb-3">
          Fee & Ledger Rules
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Platform Fee (%)
            </label>
            <input
              type="number"
              step={0.1}
              min={0}
              max={25}
              value={feePercent}
              onChange={(e) => setFeePercent(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-gray-200"
            />
            <span className="text-[10px] text-gray-400 mt-0.5 block">Standard rate is 5.0%</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Fixed Payout Transfer Fee (₦)
            </label>
            <input
              type="number"
              step={10}
              min={0}
              value={payoutFee}
              onChange={(e) => setPayoutFee(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-gray-200"
            />
            <span className="text-[10px] text-gray-400 mt-0.5 block">Default ₦50 per transfer</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Minimum Contribution (₦)
            </label>
            <input
              type="number"
              value={minContrib}
              onChange={(e) => setMinContrib(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-gray-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Minimum Payout Threshold (₦)
            </label>
            <input
              type="number"
              value={minPayout}
              onChange={(e) => setMinPayout(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-gray-200"
            />
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 font-semibold">
            <input
              type="checkbox"
              checked={maintenance}
              onChange={(e) => setMaintenance(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
            />
            <span>Enable Maintenance Mode (Restricts new checkouts)</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Platform Rules'}
        </button>
      </form>
    </div>
  );
}
