import React, { useState } from 'react';
import { Heart, Sparkles, ShieldCheck } from 'lucide-react';
import { CreatorProfile, Campaign } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { ContributionCheckoutModal } from '../checkout/ContributionCheckoutModal';

interface SupportBoxProps {
  creator: CreatorProfile;
  campaign?: Campaign;
  onContributionSuccess?: () => void;
}

export function SupportBox({ creator, campaign, onContributionSuccess }: SupportBoxProps) {
  const suggested = creator.suggestedAmounts?.length ? creator.suggestedAmounts : [500, 1000, 2000, 5000];
  const [selectedAmount, setSelectedAmount] = useState<number>(suggested[1] || 1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentAmount = isCustom ? Number(customAmount) || 0 : selectedAmount;

  const handleSelectPreset = (amt: number) => {
    setSelectedAmount(amt);
    setIsCustom(false);
    setCustomAmount('');
  };

  const handleCustomInput = (val: string) => {
    setCustomAmount(val);
    setIsCustom(true);
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
              <span>{creator.supportButtonText || 'Buy me data'}</span>
              <Sparkles className="w-4 h-4 text-[#F22550]" />
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Support {creator.displayName} with quick, direct funding
            </p>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 bg-[#FFE6EA] text-[#F22550] rounded-md">
            NGN ₦
          </span>
        </div>

        {/* Preset chips */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Choose an amount
          </label>
          <div className="grid grid-cols-4 gap-2">
            {suggested.map((amt) => {
              const isSelected = !isCustom && selectedAmount === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSelectPreset(amt)}
                  className={`py-2 px-1 text-center font-bold text-sm rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-[#F22550] text-white border-[#F22550] shadow-sm shadow-[#F22550]/25 scale-102'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-[#F22550]/40 hover:bg-gray-50'
                  }`}
                >
                  {formatCurrency(amt)}
                </button>
              );
            })}
          </div>

          {/* Custom amount */}
          <div className="mt-2.5 relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-gray-400 text-sm">
              ₦
            </span>
            <input
              type="number"
              placeholder="Custom amount (e.g. 10000)"
              value={customAmount}
              onChange={(e) => handleCustomInput(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 text-sm font-semibold text-gray-800 placeholder-gray-400 bg-gray-50/60 rounded-xl border border-gray-200 focus:outline-none focus:bg-white focus:border-[#F22550] focus:ring-1 focus:ring-[#F22550]"
              min={200}
            />
          </div>
        </div>

        {/* Primary CTA */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full py-3.5 px-4 bg-[#F22550] hover:bg-[#D81A43] text-white font-bold text-sm rounded-xl shadow-md shadow-[#F22550]/25 transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:scale-[1.01]"
        >
          <Heart className="w-4 h-4 fill-white" />
          <span>
            {creator.supportButtonText || 'Support'} {currentAmount > 0 ? `(${formatCurrency(currentAmount)})` : ''}
          </span>
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Direct payout • Bank cards & transfers supported</span>
        </div>
      </div>

      {/* Checkout Modal */}
      <ContributionCheckoutModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        creator={creator}
        campaign={campaign}
        initialAmount={currentAmount}
        onSuccess={() => {
          if (onContributionSuccess) onContributionSuccess();
        }}
      />
    </>
  );
}
