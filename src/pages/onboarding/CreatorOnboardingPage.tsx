import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from '../../router';
import { saveCreatorProfile, checkUsernameAvailability } from '../../services/creatorService';
import { savePaymentAccount } from '../../services/payoutService';
import { simulateResolveAccount, SUPPORTED_NIGERIAN_BANKS } from '../../utils/banks';
import {
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeft,
  User,
  Image as ImageIcon,
  AtSign,
  Heart,
  Landmark,
  Globe,
  Share2,
  Copy,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatCurrency } from '../../utils/formatters';

export function CreatorOnboardingPage() {
  const { fbUser, userProfile, creatorProfile, refreshProfiles } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Preset avatar & cover choices for fast setup
  const AVATAR_PRESETS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
  ];

  const COVER_PRESETS = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
  ];

  // Step 1: Basic info
  const [displayName, setDisplayName] = useState(creatorProfile?.displayName || userProfile?.fullName || fbUser?.displayName || '');
  const [username, setUsername] = useState(creatorProfile?.username || userProfile?.username || '');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'available' | 'taken' | 'invalid'>('idle');
  const [profileImage, setProfileImage] = useState(
    creatorProfile?.profileImage ||
    fbUser?.photoURL ||
    AVATAR_PRESETS[0]
  );
  const [coverImage, setCoverImage] = useState(
    creatorProfile?.coverImage ||
    COVER_PRESETS[0]
  );

  // Step 2: About creator
  const [biography, setBiography] = useState(creatorProfile?.biography || '');
  const [category, setCategory] = useState(creatorProfile?.category || 'Software & Technology');
  const [website, setWebsite] = useState(creatorProfile?.website || '');
  const [twitter, setTwitter] = useState(creatorProfile?.socialLinks?.twitter || '');
  const [github, setGithub] = useState(creatorProfile?.socialLinks?.github || '');

  // Step 3: Support page config
  const [supportButtonText, setSupportButtonText] = useState(creatorProfile?.supportButtonText || 'Buy me data 📶');
  const [amounts, setAmounts] = useState<number[]>(creatorProfile?.suggestedAmounts || [500, 1000, 2000, 5000]);
  const [theme, setTheme] = useState(creatorProfile?.theme || 'violet');

  // Step 4: Bank payout details
  const [selectedBankCode, setSelectedBankCode] = useState('058'); // GTBank default
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [resolvingAccount, setResolvingAccount] = useState(false);
  const [accountVerified, setAccountVerified] = useState(false);

  // Step 5: Published state
  const [copiedLink, setCopiedLink] = useState(false);

  // Check username availability as user types
  const handleUsernameChange = async (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(clean);
    if (!clean || clean.length < 3) {
      setUsernameStatus('invalid');
      return;
    }
    setCheckingUsername(true);
    try {
      const avail = await checkUsernameAvailability(clean, fbUser?.uid);
      setUsernameStatus(avail ? 'available' : 'taken');
    } catch {
      setUsernameStatus('idle');
    } finally {
      setCheckingUsername(false);
    }
  };

  // Resolve Nigerian bank account
  const handleResolveBank = async () => {
    if (!/^\d{10}$/.test(accountNumber)) {
      setErrorMsg('Please enter a valid 10-digit NUBAN account number.');
      return;
    }
    setErrorMsg('');
    setResolvingAccount(true);

    try {
      const res = await simulateResolveAccount(accountNumber, selectedBankCode);
      if (res.valid) {
        setAccountName(res.accountName);
        setAccountVerified(true);
      } else {
        setErrorMsg('Could not verify account details with the selected bank. Please check account number.');
      }
    } catch (err) {
      setErrorMsg('Failed to resolve bank account.');
    } finally {
      setResolvingAccount(false);
    }
  };

  const handleNext = async () => {
    setErrorMsg('');

    if (step === 1) {
      if (!displayName.trim() || !username.trim()) {
        setErrorMsg('Please enter your display name and choose a username.');
        return;
      }
      if (username.length < 3) {
        setErrorMsg('Username must be at least 3 characters.');
        return;
      }
      setCheckingUsername(true);
      try {
        const isAvail = await checkUsernameAvailability(username, fbUser?.uid);
        if (!isAvail) {
          setErrorMsg(`Username @${username} is already taken or reserved. Please choose another.`);
          setUsernameStatus('taken');
          setCheckingUsername(false);
          return;
        }
      } catch {
        // proceed
      } finally {
        setCheckingUsername(false);
      }
      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }

    if (step === 3) {
      setStep(4);
      return;
    }

    if (step === 4) {
      // Save profile and bank to Firestore
      if (!fbUser) return;
      setLoading(true);

      try {
        await saveCreatorProfile({
          userId: fbUser.uid,
          displayName,
          username,
          biography,
          category,
          website,
          profileImage,
          coverImage,
          socialLinks: { twitter, github },
          supportButtonText,
          suggestedAmounts: amounts.filter((a) => a > 0),
          theme: theme as any,
          published: true,
        });

        // Save bank if verified
        if (accountVerified && accountNumber) {
          const bankObj = SUPPORTED_NIGERIAN_BANKS.find((b) => b.code === selectedBankCode);
          await savePaymentAccount({
            userId: fbUser.uid,
            bankName: bankObj ? bankObj.name : 'Nigerian Bank',
            bankCode: selectedBankCode,
            accountNumber,
            accountName,
          });
        }

        await refreshProfiles();

        // Celebration
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6741D9', '#8C68FF', '#16865B', '#FFD700'],
        });

        setStep(5);
      } catch (err: unknown) {
        console.error('Failed to complete onboarding:', err);
        setErrorMsg('Failed to save profile. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const publicLink = `buymedata.com/${username}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {/* Step Tracker Header */}
      <div className="space-y-4 text-center">
        <span className="text-xs font-bold text-[#6741D9] uppercase tracking-wider">
          Creator Onboarding
        </span>
        <h1 className="text-3xl font-extrabold text-gray-900">
          {step === 1 && 'Let’s start with your basics'}
          {step === 2 && 'Tell the world about yourself'}
          {step === 3 && 'Customize your support page'}
          {step === 4 && 'Payout & Bank account setup'}
          {step === 5 && '🎉 Your BuyMeData page is live!'}
        </h1>
        <p className="text-xs text-gray-500 max-w-md mx-auto">
          {step < 5 ? `Step ${step} of 4 — You can customize these settings anytime later.` : 'Share your link and start receiving support today.'}
        </p>

        {/* Step dots */}
        {step < 5 && (
          <div className="flex justify-center items-center gap-2 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === step
                    ? 'w-8 bg-[#6741D9]'
                    : i < step
                    ? 'w-2 bg-emerald-500'
                    : 'w-2 bg-gray-200'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2 max-w-lg mx-auto">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Step Container Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-100 shadow-xl shadow-gray-100/50 space-y-6">
        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Display Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Samuel Adekunle"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-gray-700">
                  Your Public Username <span className="text-rose-500">*</span>
                </label>
                {checkingUsername ? (
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin text-[#6741D9]" /> Checking...
                  </span>
                ) : usernameStatus === 'available' ? (
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Available
                  </span>
                ) : usernameStatus === 'taken' ? (
                  <span className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Taken
                  </span>
                ) : null}
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-semibold text-gray-400">
                  buymedata.com/
                </span>
                <input
                  type="text"
                  required
                  placeholder="samuel"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className={`w-full pl-28 pr-4 py-2.5 text-xs font-semibold rounded-xl border focus:outline-none transition-colors ${
                    usernameStatus === 'available'
                      ? 'border-emerald-300 focus:border-emerald-500 bg-emerald-50/20'
                      : usernameStatus === 'taken'
                      ? 'border-rose-300 focus:border-rose-500 bg-rose-50/20'
                      : 'border-gray-200 focus:border-[#6741D9]'
                  }`}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Shareable link: <span className="font-mono text-gray-600">buymedata.com/{username || 'yourname'}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Profile Avatar
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={profileImage}
                    alt="Avatar"
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-gray-100 shadow-xs"
                  />
                  <input
                    type="url"
                    placeholder="Paste image URL (or select preset below)"
                    value={profileImage}
                    onChange={(e) => setProfileImage(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-medium text-gray-400">Quick presets:</span>
                  <div className="flex gap-2">
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setProfileImage(preset)}
                        className={`w-8 h-8 rounded-xl overflow-hidden border-2 transition-all ${
                          profileImage === preset ? 'border-[#6741D9] scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: About the creator */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Primary Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
              >
                <option value="Software & Technology">Software & Technology</option>
                <option value="Creative & Content">Creative & Content</option>
                <option value="Education & Tutoring">Education & Tutoring</option>
                <option value="Writing & Journalism">Writing & Journalism</option>
                <option value="Music & Audio">Music & Audio</option>
                <option value="Community & Non-profit">Community & Non-profit</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Cover Banner
              </label>
              <div className="space-y-2">
                <div className="h-20 rounded-2xl overflow-hidden border border-gray-100 relative">
                  <img src={coverImage} alt="Cover Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium text-gray-400">Preset themes:</span>
                  <div className="flex gap-2">
                    {COVER_PRESETS.map((cPreset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCoverImage(cPreset)}
                        className={`h-7 w-12 rounded-lg overflow-hidden border-2 transition-all ${
                          coverImage === cPreset ? 'border-[#6741D9] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={cPreset} alt="Cover preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Short Biography
              </label>
              <textarea
                rows={3}
                placeholder="What are you building or creating? Why does community support matter to you?"
                value={biography}
                onChange={(e) => setBiography(e.target.value)}
                className="w-full p-3.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Website / Portfolio Link
                </label>
                <input
                  type="url"
                  placeholder="https://yoursite.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Twitter / X Handle
                </label>
                <input
                  type="text"
                  placeholder="@yourhandle"
                  value={twitter}
                  onChange={(e) => setTwitter(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Support page config */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Support Button Call to Action
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  'Buy me data 📶',
                  'Support my work 💜',
                  'Fuel my research 🚀',
                  'Buy me coffee ☕',
                  'Support creator ✨',
                ].map((txt) => (
                  <button
                    key={txt}
                    type="button"
                    onClick={() => setSupportButtonText(txt)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border text-left transition-all ${
                      supportButtonText === txt
                        ? 'border-[#6741D9] bg-[#F0EBFF] text-[#6741D9]'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {txt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2">
                Color Theme Preset
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { name: 'violet', label: 'Violet', color: 'bg-[#6741D9]' },
                  { name: 'emerald', label: 'Emerald', color: 'bg-emerald-600' },
                  { name: 'amber', label: 'Amber', color: 'bg-amber-600' },
                  { name: 'rose', label: 'Rose', color: 'bg-rose-600' },
                  { name: 'ocean', label: 'Ocean', color: 'bg-cyan-600' },
                  { name: 'midnight', label: 'Dark', color: 'bg-gray-900' },
                ].map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => setTheme(t.name as any)}
                    className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                      theme === t.name ? 'border-gray-900 ring-2 ring-gray-900/10' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full ${t.color}`} />
                    <span className="text-[11px] font-semibold text-gray-700">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Suggested Contribution Amounts (NGN ₦)
              </label>
              <p className="text-[11px] text-gray-400 mb-2">
                These preset buttons appear on your public checkout page.
              </p>
              <div className="grid grid-cols-4 gap-2">
                {amounts.map((amt, idx) => (
                  <div key={idx} className="relative">
                    <input
                      type="number"
                      value={amt}
                      onChange={(e) => {
                        const newAmounts = [...amounts];
                        newAmounts[idx] = Number(e.target.value) || 0;
                        setAmounts(newAmounts);
                      }}
                      className="w-full p-2 text-center text-xs font-bold rounded-xl border border-gray-200"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Payout onboarding */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="p-4 bg-[#F0EBFF]/50 rounded-2xl border border-[#6741D9]/20 space-y-1">
              <h4 className="font-bold text-gray-900 text-xs">Direct Payouts in Nigerian Naira (₦)</h4>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Connect your personal or corporate Nigerian bank account. Payouts are transferred directly once funds are verified. You can also skip this and set it up later.
              </p>
            </div>

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
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
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
                  10-Digit NUBAN Account Number
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
                    className="flex-1 px-3 py-2.5 text-xs font-mono font-semibold rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
                  />
                  <button
                    type="button"
                    onClick={handleResolveBank}
                    disabled={resolvingAccount || accountNumber.length !== 10}
                    className="px-3.5 py-2 bg-gray-900 text-white font-semibold text-xs rounded-xl disabled:opacity-50 hover:bg-gray-800"
                  >
                    {resolvingAccount ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Verify'}
                  </button>
                </div>
              </div>
            </div>

            {/* Verification result */}
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
          </div>
        )}

        {/* Step 5: Published & Live */}
        {step === 5 && (
          <div className="text-center py-6 space-y-6">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-black text-gray-900">Your Page is Ready!</h3>
              <p className="text-xs text-gray-500">
                Share your personal link to begin receiving financial support.
              </p>
            </div>

            {/* Shareable Link Box */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex items-center justify-between max-w-md mx-auto">
              <span className="font-mono text-xs font-semibold text-gray-800 truncate">
                {window.location.origin}/{username}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/${username}`);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="px-3 py-1.5 bg-[#6741D9] text-white font-semibold text-xs rounded-xl flex items-center gap-1.5"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to={`/${username}`}
                className="w-full sm:w-auto px-6 py-3 bg-[#6741D9] hover:bg-[#5633C4] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
              >
                <span>View Live Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-6 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-xl flex items-center justify-center"
              >
                Go to Creator Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        {step < 5 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3">
              {step === 4 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="text-xs font-semibold text-gray-400 hover:text-gray-700"
                >
                  Skip for now
                </button>
              )}
              <button
                type="button"
                disabled={loading}
                onClick={handleNext}
                className="px-6 py-3 bg-[#6741D9] hover:bg-[#5633C4] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <span>{step === 4 ? 'Complete & Publish' : 'Continue'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
