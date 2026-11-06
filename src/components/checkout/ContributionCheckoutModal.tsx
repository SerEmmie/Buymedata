import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  X,
  Heart,
  CheckCircle2,
  Shield,
  CreditCard,
  Building,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { CreatorProfile, Campaign, Contribution } from '../../types';
import {
  initializeContribution,
  initializeBachsPayment,
  verifyPaymentOnServer,
} from '../../services/paymentService';
import { formatCurrency } from '../../utils/formatters';

interface ContributionCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: CreatorProfile;
  campaign?: Campaign;
  initialAmount?: number;
  onSuccess?: (contribution: Contribution) => void;
}

export function ContributionCheckoutModal({
  isOpen,
  onClose,
  creator,
  campaign,
  initialAmount,
  onSuccess,
}: ContributionCheckoutModalProps) {
  const suggested = creator.suggestedAmounts?.length ? creator.suggestedAmounts : [500, 1000, 2000, 5000];
  const [selectedAmount, setSelectedAmount] = useState<number>(initialAmount || suggested[1] || 1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [supporterName, setSupporterName] = useState('');
  const [supporterEmail, setSupporterEmail] = useState('');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [publicMessage, setPublicMessage] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer' | 'ussd'>('card');

  // Stages: 'form' | 'gateway' | 'processing' | 'success' | 'error'
  const [stage, setStage] = useState<'form' | 'gateway' | 'processing' | 'success' | 'error'>('form');
  const [errorMsg, setErrorMsg] = useState('');
  const [completedContrib, setCompletedContrib] = useState<Contribution | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  // Active gateway transaction
  const [activeRef, setActiveRef] = useState('');
  const [gatewayAuthUrl, setGatewayAuthUrl] = useState('');
  const [paymentMode, setPaymentMode] = useState<'test' | 'live'>('test');
  const [activeContribution, setActiveContribution] = useState<Contribution | null>(null);

  if (!isOpen) return null;

  const currentAmount = isCustom ? Number(customAmount) || 0 : selectedAmount;
  const platformFee = Math.round(currentAmount * 0.05);

  const handleSelectPreset = (amt: number) => {
    setSelectedAmount(amt);
    setIsCustom(false);
    setCustomAmount('');
  };

  const handleCustomInput = (val: string) => {
    setCustomAmount(val);
    setIsCustom(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentAmount < 200) {
      setErrorMsg('Minimum contribution is ₦200');
      return;
    }
    if (!supporterEmail || !supporterEmail.includes('@')) {
      setErrorMsg('Please provide a valid email address to receive your payment receipt.');
      return;
    }

    setErrorMsg('');
    setStage('processing');

    try {
      // 1. Initialize pending contribution record in Firestore
      const { contribution, transactionRecord } = await initializeContribution({
        creatorId: creator.userId,
        creatorUsername: creator.username,
        campaignId: campaign?.id,
        campaignTitle: campaign?.title,
        supporterName: anonymous ? 'Generous Believer' : (supporterName || 'Anonymous Supporter'),
        supporterEmail,
        amount: currentAmount,
        currency: 'NGN',
        message,
        anonymous,
        publicMessage,
      });

      setActiveContribution(contribution);
      setActiveRef(transactionRecord.providerReference);

      // 2. Initialize Bachs checkout session on backend
      const initRes = await initializeBachsPayment({
        email: supporterEmail,
        amount: currentAmount,
        reference: transactionRecord.providerReference,
        callbackUrl: window.location.href,
        metadata: {
          contributionId: contribution.id,
          creatorId: creator.userId,
          campaignId: campaign?.id,
          supporterName: anonymous ? 'Anonymous' : supporterName,
        },
      });

      setGatewayAuthUrl(initRes.checkoutUrl || initRes.authorizationUrl || '');
      setPaymentMode(initRes.mode);

      // 3. Move to Bachs Gateway stage for user authorization
      setStage('gateway');
    } catch (err) {
      console.error('Initialization error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Payment initialization failed. Please try again.');
      setStage('error');
    }
  };

  const handleAuthorizePayment = async () => {
    if (!activeRef) return;
    setErrorMsg('');
    setStage('processing');

    try {
      // 4. Server-Side Verification:
      // The frontend DOES NOT self-certify success. It calls the server verification endpoint,
      // which verifies the transaction with Paystack and commits the double-entry ledger.
      const verifyRes = await verifyPaymentOnServer(activeRef);

      const confirmed: Contribution = activeContribution
        ? {
            ...activeContribution,
            paymentStatus: 'successful',
            platformFee: verifyRes.platformFee,
            netAmount: verifyRes.netAmount,
          }
        : {
            id: verifyRes.contributionId,
            creatorId: creator.userId,
            supporterName: anonymous ? 'Generous Believer' : (supporterName || 'Anonymous Supporter'),
            supporterEmail,
            amount: verifyRes.amount,
            currency: 'NGN',
            paymentStatus: 'successful',
            platformFee: verifyRes.platformFee,
            netAmount: verifyRes.netAmount,
            anonymous,
            publicMessage,
            createdAt: new Date().toISOString(),
          };

      setCompletedContrib(confirmed);
      setStage('success');

      // Trigger celebratory confetti
      confetti({
        particleCount: 90,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#6741D9', '#8C68FF', '#09A552', '#FFD700'],
      });

      if (onSuccess) {
        onSuccess(confirmed);
      }
    } catch (err) {
      console.error('Verification error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Server payment verification failed.');
      setStage('error');
    }
  };

  const copyReference = () => {
    if (completedContrib) {
      navigator.clipboard.writeText(activeRef || completedContrib.id);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-white">
          <div className="flex items-center gap-3">
            <img
              src={creator.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
              alt={creator.displayName}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-[#6741D9]/20"
            />
            <div>
              <h3 className="font-bold text-gray-900 leading-tight">
                Support {creator.displayName}
              </h3>
              <p className="text-xs text-gray-500">
                {campaign ? `Campaign: ${campaign.title.slice(0, 32)}...` : `@${creator.username}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {stage === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Preset selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Select Amount (NGN ₦)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {suggested.map((amt) => {
                    const isSelected = !isCustom && selectedAmount === amt;
                    return (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => handleSelectPreset(amt)}
                        className={`py-2.5 px-1 text-center font-bold text-sm rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-[#6741D9] text-white border-[#6741D9] shadow-md shadow-[#6741D9]/25 scale-102'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-[#6741D9]/40 hover:bg-gray-50'
                        }`}
                      >
                        {formatCurrency(amt)}
                      </button>
                    );
                  })}
                </div>

                {/* Custom amount toggle input */}
                <div className="mt-2.5">
                  <div className="relative rounded-xl border border-gray-200 focus-within:border-[#6741D9] focus-within:ring-2 focus-within:ring-[#6741D9]/20 overflow-hidden">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-gray-400">
                      ₦
                    </span>
                    <input
                      type="number"
                      placeholder="Or enter custom amount (e.g. 10000)"
                      value={customAmount}
                      onChange={(e) => handleCustomInput(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 text-sm font-semibold text-gray-800 placeholder-gray-400 focus:outline-none"
                      min={200}
                    />
                  </div>
                </div>
              </div>

              {/* Supporter details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Your Name {anonymous && <span className="text-gray-400 text-xs">(Hidden)</span>}
                  </label>
                  <input
                    type="text"
                    disabled={anonymous}
                    placeholder="e.g. Samuel Ade"
                    value={supporterName}
                    onChange={(e) => setSupporterName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9] focus:ring-1 focus:ring-[#6741D9] disabled:bg-gray-100 disabled:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email for Receipt <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@email.com"
                    value={supporterEmail}
                    onChange={(e) => setSupporterEmail(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9] focus:ring-1 focus:ring-[#6741D9]"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Say something encouraging (optional)
                </label>
                <textarea
                  rows={2}
                  maxLength={300}
                  placeholder="Keep up the inspiring work! Data on me."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9] focus:ring-1 focus:ring-[#6741D9] resize-none"
                />
              </div>

              {/* Privacy toggles */}
              <div className="space-y-2 pt-1 border-t border-gray-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                    className="rounded text-[#6741D9] focus:ring-[#6741D9] w-4 h-4"
                  />
                  <span>Make contribution anonymous (hide my name publicly)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700">
                  <input
                    type="checkbox"
                    checked={publicMessage}
                    onChange={(e) => setPublicMessage(e.target.checked)}
                    className="rounded text-[#6741D9] focus:ring-[#6741D9] w-4 h-4"
                  />
                  <span>Display my supportive message on creator page</span>
                </label>
              </div>

              {/* Payment Method selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2.5 flex flex-col items-center gap-1 rounded-xl border text-xs font-medium transition-colors ${
                      paymentMethod === 'card'
                        ? 'border-[#6741D9] bg-[#F0EBFF] text-[#6741D9]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Debit Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transfer')}
                    className={`p-2.5 flex flex-col items-center gap-1 rounded-xl border text-xs font-medium transition-colors ${
                      paymentMethod === 'transfer'
                        ? 'border-[#6741D9] bg-[#F0EBFF] text-[#6741D9]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    Bank Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('ussd')}
                    className={`p-2.5 flex flex-col items-center gap-1 rounded-xl border text-xs font-medium transition-colors ${
                      paymentMethod === 'ussd'
                        ? 'border-[#6741D9] bg-[#F0EBFF] text-[#6741D9]'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    USSD Code
                  </button>
                </div>
              </div>

              {/* Cost summary */}
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 text-xs space-y-1.5 text-gray-600">
                <div className="flex justify-between">
                  <span>Contribution Amount</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(currentAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Platform fee (5% incl.)</span>
                  <span>{formatCurrency(platformFee)}</span>
                </div>
                <div className="pt-1.5 border-t border-gray-200 flex justify-between font-bold text-sm text-gray-900">
                  <span>Total to pay</span>
                  <span className="text-[#6741D9]">{formatCurrency(currentAmount)}</span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={currentAmount < 200}
                className="w-full py-3.5 px-4 bg-[#6741D9] hover:bg-[#5633C4] text-white font-bold text-sm rounded-xl shadow-md shadow-[#6741D9]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
              >
                <Heart className="w-4 h-4 fill-white" />
                Proceed to Pay {formatCurrency(currentAmount)}
              </button>

              <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Secured by Bachs.io • 256-bit SSL encryption</span>
              </div>
            </form>
          )}

          {/* Bachs Gateway Stage */}
          {stage === 'gateway' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Bachs Brand Banner */}
              <div className="p-4 bg-gradient-to-r from-gray-900 to-slate-800 text-white rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-black tracking-wider uppercase text-emerald-400">
                      Bachs.io Secure Gateway
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20">
                    {paymentMode.toUpperCase()} MODE
                  </span>
                </div>

                <div className="pt-1 flex items-baseline justify-between">
                  <span className="text-xs text-gray-300">Amount Due:</span>
                  <span className="text-2xl font-black text-white">{formatCurrency(currentAmount)}</span>
                </div>
                <div className="text-[11px] text-gray-400 font-mono truncate">
                  Ref: {activeRef}
                </div>
              </div>

              {/* Instructions based on channel */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs space-y-2">
                {paymentMethod === 'card' && (
                  <div className="space-y-1.5">
                    <p className="font-bold text-gray-800 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-[#6741D9]" />
                      <span>Card Checkout Simulated in Sandbox</span>
                    </p>
                    <p className="text-gray-600 text-[11px] leading-relaxed">
                      Standard Bachs test card: <span className="font-mono font-bold text-gray-900">4084 0840 8408 4084</span> (CVV: 408, PIN: 3310).
                    </p>
                  </div>
                )}

                {paymentMethod === 'transfer' && (
                  <div className="space-y-1.5">
                    <p className="font-bold text-gray-800 flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-[#6741D9]" />
                      <span>Bank Transfer (Bachs Virtual NUBAN)</span>
                    </p>
                    <p className="text-gray-600 text-[11px] leading-relaxed">
                      Virtual Account: <span className="font-mono font-bold text-gray-900">9920184712</span> • Bank: Bachs Virtual Settlement.
                    </p>
                  </div>
                )}

                {paymentMethod === 'ussd' && (
                  <div className="space-y-1.5">
                    <p className="font-bold text-gray-800 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-[#6741D9]" />
                      <span>USSD Quick Dial</span>
                    </p>
                    <p className="text-gray-600 text-[11px] leading-relaxed">
                      Dial <span className="font-mono font-bold text-gray-900">*737*50*{currentAmount}*124#</span> on your mobile phone.
                    </p>
                  </div>
                )}
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  High-integrity architecture: Payment status will be cryptographically verified directly by the BuyMeData server before funds are settled into the creator's ledger.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleAuthorizePayment}
                  className="w-full py-3.5 px-4 bg-[#6741D9] hover:bg-[#5633C4] text-white font-extrabold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Authorize & Verify on Server</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setStage('form')}
                  className="w-full py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                >
                  Change payment details
                </button>
              </div>
            </div>
          )}

          {/* Processing / Cryptographic Verification State */}
          {stage === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-[#F0EBFF] border-t-[#6741D9] animate-spin" />
                <Lock className="w-6 h-6 text-[#6741D9] absolute inset-0 m-auto" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-gray-900 text-base">Verifying with Bachs.io Backend</h4>
                <p className="text-xs text-gray-500 max-w-xs">
                  Server is validating cryptographic response, enforcing idempotency, and committing double-entry ledger entries...
                </p>
              </div>
            </div>
          )}

          {/* Success State */}
          {stage === 'success' && completedContrib && (
            <div className="py-6 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="font-extrabold text-xl text-gray-900">Payment Confirmed & Settled!</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Thank you! You just supported <span className="font-semibold text-gray-900">{creator.displayName}</span> with{' '}
                  <span className="font-bold text-[#6741D9]">{formatCurrency(completedContrib.amount)}</span>.
                </p>
              </div>

              {/* Verified Receipt Details */}
              <div className="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Bachs Reference:</span>
                  <button
                    onClick={copyReference}
                    className="font-mono text-gray-800 flex items-center gap-1 hover:text-[#6741D9]"
                  >
                    {activeRef || completedContrib.id}
                    {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Recipient:</span>
                  <span className="font-medium text-gray-900">{creator.displayName}</span>
                </div>
                {completedContrib.campaignTitle && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Campaign:</span>
                    <span className="font-medium text-gray-900 truncate max-w-[200px]">
                      {completedContrib.campaignTitle}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Receipt Sent To:</span>
                  <span className="font-medium text-gray-900">{completedContrib.supporterEmail}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-gray-900">
                  <span>Amount Credited:</span>
                  <span className="text-emerald-700">{formatCurrency(completedContrib.amount)}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-[#6741D9] text-white font-bold text-sm rounded-xl hover:bg-[#5633C4] transition-colors"
              >
                Done
              </button>
            </div>
          )}

          {/* Error State */}
          {stage === 'error' && (
            <div className="py-8 flex flex-col items-center text-center space-y-4 animate-in fade-in">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Payment Verification Failed</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm">{errorMsg}</p>
              </div>
              <button
                onClick={() => setStage('form')}
                className="px-6 py-2.5 bg-gray-900 text-white font-semibold text-xs rounded-xl hover:bg-gray-800"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
