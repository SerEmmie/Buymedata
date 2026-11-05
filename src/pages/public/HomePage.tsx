import React, { useState, useEffect } from 'react';
import { Link } from '../../router';
import {
  Heart,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Users,
  CheckCircle2,
  HelpCircle,
  Share2,
  ChevronRight,
  Landmark,
  TrendingUp,
} from 'lucide-react';
import { getPublicCampaigns } from '../../services/campaignService';
import { Campaign } from '../../types';
import { CampaignCard } from '../../components/creator/CampaignCard';
import { formatCurrency } from '../../utils/formatters';

export function HomePage() {
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
  const [demoAmount, setDemoAmount] = useState(1000);
  const [demoCustom, setDemoCustom] = useState('');

  useEffect(() => {
    getPublicCampaigns().then(setActiveCampaigns).catch(console.warn);
  }, []);

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F0EBFF] text-[#6741D9] text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-[#6741D9]" />
                <span>The creator support & fundraising platform for Africa</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-950 tracking-tight leading-[1.1]">
                Your passion <span className="text-[#6741D9]">deserves support.</span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Create your page, share what you're working towards, and let the people who believe in you be part of your journey.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  to="/auth/register"
                  className="w-full sm:w-auto px-8 py-4 bg-[#6741D9] hover:bg-[#5633C4] text-white font-bold text-base rounded-2xl shadow-lg shadow-[#6741D9]/25 hover:shadow-xl hover:scale-102 transition-all flex items-center justify-center gap-2"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/how-it-works"
                  className="w-full sm:w-auto px-7 py-4 bg-white text-gray-700 font-semibold text-base rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  Explore how it works
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>No compulsory supporter signup</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Settles to Nigerian banks in ₦</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>One-time support & campaigns</span>
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
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-[#6741D9]/20"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-gray-900 text-sm">Fola Adebayo</h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">Verified</span>
                    </div>
                    <p className="text-xs text-gray-400">buymedata.com/folatech</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
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
                            ? 'bg-[#6741D9] text-white border-[#6741D9] shadow-sm'
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9]"
                  />
                </div>

                <Link
                  to="/folatech"
                  className="w-full py-3 bg-[#6741D9] hover:bg-[#5633C4] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
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

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-16">
          <span className="text-xs font-bold text-[#6741D9] uppercase tracking-wider">
            Simple 5-Step Process
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            How BuyMeData Works
          </h2>
          <p className="text-gray-500 text-sm">
            Everything you need to receive support, organize fundraising campaigns, and withdraw funds with total transparency.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[
            {
              step: '01',
              title: 'Create Account',
              desc: 'Sign up in seconds using your email or Google account.',
            },
            {
              step: '02',
              title: 'Set Up Your Page',
              desc: 'Choose your unique username, profile picture, bio, and suggested amounts.',
            },
            {
              step: '03',
              title: 'Share Your Link',
              desc: 'Add buymedata.com/yourname to your social bio, posts, or messages.',
            },
            {
              step: '04',
              title: 'Receive Support',
              desc: 'Supporters contribute via debit cards, bank transfers, or USSD without friction.',
            },
            {
              step: '05',
              title: 'Track & Withdraw',
              desc: 'Monitor real-time ledger earnings and withdraw directly to your verified bank account.',
            },
          ].map((item, idx) => (
            <div
              key={item.step}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-xs hover:border-[#6741D9]/30 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="inline-block text-xs font-extrabold px-2.5 py-1 bg-[#F0EBFF] text-[#6741D9] rounded-lg">
                  {item.step}
                </span>
                <h3 className="font-bold text-gray-900 text-base">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dual Value Proposition: For Creators & For Supporters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* For Creators */}
          <div className="bg-gradient-to-br from-[#6741D9]/5 via-white to-white p-8 sm:p-10 rounded-3xl border border-[#6741D9]/15 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-[#6741D9] text-white flex items-center justify-center shadow-md shadow-[#6741D9]/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-gray-900">For Creators & Builders</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                Whether you create content, teach coding, produce podcasts, or build software, receiving financial support should be effortless.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Single shareable link with customizable theme & button text</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Goal-oriented fundraising campaigns with live progress tracking</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Auditable, immutable double-entry ledger with transparent 5% fee</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Fast payout withdrawals straight into your Nigerian bank account</span>
              </li>
            </ul>
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#6741D9] hover:underline"
            >
              Start receiving support <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* For Supporters */}
          <div className="bg-gradient-to-br from-emerald-500/5 via-white to-white p-8 sm:p-10 rounded-3xl border border-emerald-500/15 space-y-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/20">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-gray-900">For Supporters & Communities</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                Back the creators and causes you admire without passwords, complex signups, or hurdles.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>No account required to send quick financial contributions</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Choose preset amounts (₦500, ₦1,000, ₦5,000) or any custom amount</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Leave public messages of encouragement or contribute anonymously</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Instant payment receipt and verifiable transaction reference</span>
              </li>
            </ul>
            <Link
              to="/folatech"
              className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:underline"
            >
              See how a supporter experiences it <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Fundraising Campaigns */}
      {activeCampaigns.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold text-[#6741D9] uppercase tracking-wider">
                Community Causes
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
                Active Fundraising Campaigns
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeCampaigns.map((camp) => (
              <CampaignCard
                key={camp.id}
                campaign={camp}
                creatorUsername={camp.creatorUsername}
              />
            ))}
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-bold text-[#6741D9] uppercase tracking-wider">
            Clear Answers
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'How does BuyMeData work?',
              a: 'BuyMeData provides a personalized public page (buymedata.com/username) where supporters can contribute funds with one click. You can also launch dedicated fundraising campaigns for specific projects, goals, or community needs.',
            },
            {
              q: 'Do supporters need an account to contribute?',
              a: 'No! Supporters can contribute in under 30 seconds using cards, bank transfers, or USSD without having to create an account or remember a password.',
            },
            {
              q: 'What are the platform fees?',
              a: 'BuyMeData charges a standard 5% platform fee on successful contributions. There are no monthly subscription fees, setup fees, or hidden maintenance charges.',
            },
            {
              q: 'How do creator payouts work in Nigeria?',
              a: 'Creators connect their verified Nigerian bank account (GTBank, Access, Zenith, Kuda, OPay, First Bank, etc.). Once funds clear in your available balance, you can request a withdrawal anytime with a minimum threshold of ₦2,000.',
            },
            {
              q: 'Can supporters contribute anonymously?',
              a: 'Yes. Supporters can tick the "Make contribution anonymous" checkbox during checkout. Their name will be hidden from the public supporter list while you still receive the funds.',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-gray-100 p-6 space-y-2"
            >
              <h4 className="font-bold text-gray-900 text-base">{item.q}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-[#6741D9] to-[#8C68FF] rounded-3xl p-8 sm:p-14 text-white text-center space-y-6 shadow-xl shadow-[#6741D9]/20">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-xl mx-auto">
            Ready to receive support from people who believe in your work?
          </h2>
          <p className="text-[#F0EBFF] text-base max-w-lg mx-auto">
            Join creators, educators, students, and community champions across Nigeria building with BuyMeData.
          </p>
          <div className="pt-2">
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#6741D9] hover:bg-gray-50 font-extrabold text-base rounded-2xl shadow-lg transition-all hover:scale-105"
            >
              <span>Create Your Free Page</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
