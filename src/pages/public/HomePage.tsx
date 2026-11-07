import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from '../../router';
import {
  Heart,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Users,
  CheckCircle2,
  Share2,
  ChevronRight,
  Landmark,
  TrendingUp,
  AtSign,
  Check,
  AlertCircle,
  Loader2,
  Send,
  Lock,
} from 'lucide-react';
import { getPublicCampaigns } from '../../services/campaignService';
import { checkUsernameAvailability } from '../../services/creatorService';
import { Campaign } from '../../types';
import { CampaignCard } from '../../components/creator/CampaignCard';
import { formatCurrency } from '../../utils/formatters';

export function HomePage() {
  const navigate = useNavigate();
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [demoAmount, setDemoAmount] = useState(1000);
  const [demoCustom, setDemoCustom] = useState('');

  // Hero Claim Page Widget state
  const [heroUsername, setHeroUsername] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    getPublicCampaigns().then(setActiveCampaigns).catch(console.warn);
  }, []);

  // Debounced live check for hero claim input
  useEffect(() => {
    const clean = heroUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    if (!clean || clean.length < 3) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    setCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const isAvail = await checkUsernameAvailability(clean);
        setUsernameAvailable(isAvail);
      } catch {
        setUsernameAvailable(true);
      } finally {
        setCheckingUsername(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [heroUsername]);

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = heroUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    if (clean && clean.length >= 3) {
      window.localStorage.setItem('buymedata_claimed_username', clean);
      navigate(`/auth/register?claim=${encodeURIComponent(clean)}`);
    } else {
      navigate('/auth/register');
    }
  };

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FFE6EA] text-[#F22550] text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5 text-[#F22550]" />
                <span>A little support goes a long way</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#17191F] tracking-tight leading-[1.12]">
                Support creators, fund dreams, make an{' '}
                <span className="text-[#F22550]">impact.</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                BuyMeData is the easiest way to support creators, fund goals and help people thrive. Start in 3 simple steps with zero friction.
              </p>

              {/* Step 1: Claim Your Page Hero Widget */}
              <div className="pt-2 max-w-xl mx-auto lg:mx-0">
                <form
                  onSubmit={handleClaimSubmit}
                  className="bg-white p-2 sm:p-2.5 rounded-2xl sm:rounded-3xl border-2 border-gray-200/80 shadow-lg shadow-gray-200/50 focus-within:border-[#F22550] focus-within:ring-4 focus-within:ring-[#F22550]/10 transition-all flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                >
                  <div className="flex items-center flex-1 px-3 py-1.5 sm:py-0">
                    <span className="text-gray-400 font-semibold text-sm sm:text-base select-none">
                      buymedata.com/@
                    </span>
                    <input
                      type="text"
                      placeholder="yourname"
                      value={heroUsername}
                      onChange={(e) => setHeroUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      className="w-full pl-0.5 pr-2 py-2 text-sm sm:text-base font-bold text-[#17191F] placeholder-gray-300 focus:outline-none"
                    />
                    {checkingUsername && (
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
                    )}
                    {!checkingUsername && usernameAvailable === true && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex-shrink-0">
                        <Check className="w-3 h-3" /> Available
                      </span>
                    )}
                    {!checkingUsername && usernameAvailable === false && (
                      <span className="text-[11px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full flex-shrink-0">
                        Taken
                      </span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3.5 bg-[#F22550] hover:bg-[#D81A43] text-white font-extrabold text-sm sm:text-base rounded-xl sm:rounded-2xl shadow-md shadow-[#F22550]/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] flex-shrink-0"
                  >
                    <span>Claim My Page</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <p className="text-xs text-gray-400 mt-2.5 text-center lg:text-left flex items-center justify-center lg:justify-start gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Free to join • Instant Gmail / One-Time Link sign-up • Direct bank payouts in ₦</span>
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>1. Claim your unique link</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>2. Sign up with Gmail or Link</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>3. See dashboard & get paid in ₦</span>
                </div>
              </div>
            </div>

            {/* Right Interactive Mockup Widget */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 p-6 space-y-5">
                {/* Creator mini badge */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                  <img
                    src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=120&q=80"
                    alt="Fola Adebayo"
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-[#F22550]/20"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-gray-900 text-sm">Fola Adebayo</h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#FFE6EA] text-[#F22550] rounded-full">
                        Verified Creator
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">buymedata.com/folatech</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Interactive Support Preview
                  </p>
                  <p className="text-xs text-gray-500">
                    "Building open-source software tools and mentoring young engineers in Lagos."
                  </p>
                </div>

                {/* Amount selection */}
                <div className="space-y-2">
                  <div className="grid grid-cols-4 gap-2">
                    {[500, 1000, 2500, 5000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setDemoAmount(amt);
                          setDemoCustom('');
                        }}
                        className={`py-2 px-1 text-center font-bold text-xs rounded-xl border transition-all ${
                          demoAmount === amt && !demoCustom
                            ? 'bg-[#F22550] text-white border-[#F22550] shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        ₦{amt.toLocaleString()}
                      </button>
                    ))}
                  </div>

                  <input
                    type="number"
                    placeholder="Or custom amount (₦)"
                    value={demoCustom}
                    onChange={(e) => {
                      setDemoCustom(e.target.value);
                      if (e.target.value) setDemoAmount(Number(e.target.value));
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#F22550]"
                  />
                </div>

                <Link
                  to="/folatech"
                  className="w-full py-3 bg-[#F22550] hover:bg-[#D81A43] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Heart className="w-3.5 h-3.5 fill-white" />
                  Support Fola ({formatCurrency(demoCustom ? Number(demoCustom) || 0 : demoAmount)})
                </Link>

                <p className="text-[11px] text-gray-400 text-center">
                  Live link • Supporter messages displayed on creator wall
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step "How BuyMeData Works" Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold text-[#F22550] uppercase tracking-wider bg-[#FFE6EA] px-3 py-1 rounded-full">
            Just 3 Simple Steps
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17191F] tracking-tight">
            How BuyMeData Works
          </h2>
          <p className="text-gray-500 text-sm sm:text-base leading-relaxed">
            Get your page running and start receiving contributions with zero friction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: '01',
              title: 'Claim Your Page',
              tag: 'Step 1: Your Link',
              desc: 'Choose your personal username (e.g. buymedata.com/@yourname) to claim and secure your link in seconds.',
              icon: AtSign,
            },
            {
              step: '02',
              title: 'Sign Up with Gmail or Magic Link',
              tag: 'Step 2: 1-Click Auth',
              desc: 'Authenticate effortlessly using your Google account or a one-time link sent directly to your inbox. No passwords needed.',
              icon: Zap,
            },
            {
              step: '03',
              title: 'See Dashboard & Receive Support',
              tag: 'Step 3: Direct Payouts',
              desc: 'Land straight in your dashboard. Share your link with supporters and receive direct bank disbursements. Any other onboarding can be completed when you are already in.',
              icon: Landmark,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:border-[#F22550]/30 hover:shadow-md transition-all flex flex-col justify-between space-y-6 relative overflow-hidden group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-[#F22550] font-mono">
                      {item.step}
                    </span>
                    <div className="w-10 h-10 rounded-2xl bg-[#FFE6EA] text-[#F22550] flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <span className="inline-block text-[11px] font-bold text-[#F22550] bg-[#FFE6EA] px-2.5 py-0.5 rounded-full">
                    {item.tag}
                  </span>
                  <h3 className="font-extrabold text-gray-900 text-xl">{item.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed font-normal">{item.desc}</p>
                </div>

                <div className="pt-4 border-t border-gray-50 flex items-center text-xs font-bold text-[#F22550]">
                  <span>Fast, transparent setup</span>
                  <Check className="w-3.5 h-3.5 ml-1 text-emerald-600" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Active Community Campaigns */}
      {activeCampaigns.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#F22550] uppercase tracking-wider">
                Community Goals & Impact
              </span>
              <h2 className="text-3xl font-extrabold text-[#17191F] tracking-tight mt-1">
                Featured Fundraising Campaigns
              </h2>
            </div>
            <Link
              to="/folatech"
              className="text-xs font-bold text-[#F22550] hover:underline flex items-center gap-1"
            >
              Explore sample creator <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCampaigns.slice(0, 3).map((camp) => (
              <CampaignCard key={camp.id} campaign={camp} />
            ))}
          </div>
        </section>
      )}

      {/* Dual Value Proposition: For Creators & For Supporters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* For Creators */}
          <div className="bg-gradient-to-br from-[#FFE6EA]/50 via-white to-white p-8 sm:p-10 rounded-3xl border border-[#FFCCD5] space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-[#F22550] text-white flex items-center justify-center shadow-md shadow-[#F22550]/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-[#17191F]">For Creators & Builders</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                Whether you create content, build apps, teach skills, produce podcasts, or run a cause, receiving financial support should be effortless.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Single shareable link with customizable theme & button text</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Fundraising goals with live verified progress tracking</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Immutable double-entry ledger with transparent 5% platform fee</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Automated payouts directly to your Nigerian commercial bank account</span>
              </li>
            </ul>
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 text-sm font-extrabold text-[#F22550] hover:underline"
            >
              Claim your page now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* For Supporters */}
          <div className="bg-gradient-to-br from-gray-50 via-white to-white p-8 sm:p-10 rounded-3xl border border-gray-200/80 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-[#17191F] text-white flex items-center justify-center shadow-md shadow-gray-900/10">
              <Heart className="w-6 h-6 fill-white" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-[#17191F]">For Supporters & Fans</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                Show love and appreciation to the individuals whose work inspires you. No registration roadblocks or subscription traps.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Zero account required — contribute in under 30 seconds</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Pay in Naira (₦) via debit card, bank transfer, or USSD</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Leave encouraging words on creator walls or support anonymously</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>100% verified settlement through Bachs.io infrastructure</span>
              </li>
            </ul>
            <Link
              to="/how-it-works"
              className="inline-flex items-center gap-2 text-sm font-extrabold text-[#17191F] hover:underline"
            >
              Read how it works <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Big Call to Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#17191F] via-[#242731] to-[#17191F] text-white rounded-3xl p-10 sm:p-14 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-bold text-[#F22550] uppercase tracking-wider bg-[#FFE6EA]/10 px-3 py-1 rounded-full">
              Get Started in 3 Steps
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to claim your page?
            </h2>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              Join thousands of creators and causes receiving direct support. A little support goes a long way.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/auth/register"
              className="px-8 py-4 bg-[#F22550] hover:bg-[#D81A43] text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg shadow-[#F22550]/30 transition-all hover:scale-102 flex items-center gap-2"
            >
              <span>Claim Your Page Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
