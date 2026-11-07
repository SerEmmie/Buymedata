import React from 'react';
import { Link } from '../../router';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Share2,
  Heart,
  Landmark,
  Shield,
  Zap,
  AtSign,
  Mail,
  Check,
} from 'lucide-react';

export function HowItWorksPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="text-xs font-bold text-[#F22550] uppercase tracking-wider bg-[#FFE6EA] px-3 py-1 rounded-full">
          Simple, Fast & Frictionless
        </span>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#17191F] tracking-tight">
          How BuyMeData Works in 3 Steps
        </h1>
        <p className="text-gray-600 text-base leading-relaxed">
          Start receiving support and funding goals in under 60 seconds. A little support goes a long way.
        </p>
      </div>

      {/* 3-Step Deep Dive */}
      <div className="space-y-8">
        {[
          {
            step: 'Step 1',
            number: '01',
            title: 'Claim your page with your unique username',
            badge: 'Instant Claiming',
            icon: AtSign,
            description:
              'Choose your personal username (e.g. buymedata.com/@yourname). We verify availability instantly so your permanent link is reserved before you even complete registration.',
            highlights: [
              'Custom link: buymedata.com/@yourname',
              'Reserved instantly with real-time verification',
              'Shareable anywhere across social media and messaging',
            ],
          },
          {
            step: 'Step 2',
            number: '02',
            title: 'Sign up with Gmail or a one-time magic link',
            badge: 'Frictionless Auth',
            icon: Mail,
            description:
              'Authenticate in a single click using your Google / Gmail account or enter your email to receive a secure one-time sign-in link. No tedious forms and no passwords to remember.',
            highlights: [
              'One-click sign up with Google / Gmail',
              'Or passwordless one-time link sent directly to your email',
              'Secure and verified via Firebase Authentication',
            ],
          },
          {
            step: 'Step 3',
            number: '03',
            title: 'See your dashboard & start receiving direct support',
            badge: 'Direct Dashboard Access',
            icon: Landmark,
            description:
              'You land straight in your creator dashboard! Your page is immediately active. Any other onboarding—such as connecting your bank account for payouts or adding a custom bio—can be completed whenever you want while you are already inside.',
            highlights: [
              'Immediate dashboard access with zero blocking wizards',
              'Receive contributions via card, bank transfer, or USSD',
              'Automated payout settlements directly to Nigerian banks in ₦',
            ],
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm hover:border-[#F22550]/30 transition-all flex flex-col md:flex-row md:items-start gap-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#FFE6EA] text-[#F22550] flex items-center justify-center font-extrabold text-xl flex-shrink-0">
                <Icon className="w-7 h-7" />
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#F22550] uppercase">{item.step}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                    {item.badge}
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold text-[#17191F]">{item.title}</h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{item.description}</p>
                <div className="pt-2 space-y-1.5">
                  {item.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-medium text-gray-700">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-sm space-y-6">
        <h2 className="text-2xl font-extrabold text-[#17191F]">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
          <div className="space-y-1.5">
            <h4 className="font-bold text-gray-900">Do my supporters have to create an account?</h4>
            <p className="text-xs leading-relaxed text-gray-500">
              No! Anyone visiting your page can contribute in under 30 seconds using Nigerian debit cards, direct bank transfer, or USSD without signing up.
            </p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-gray-900">How do payouts work?</h4>
            <p className="text-xs leading-relaxed text-gray-500">
              When you are in your dashboard, add your commercial bank account (GTBank, Access, Zenith, Kuda, OPay, etc.). Funds are disbursed seamlessly via our verified Bachs.io financial gateway.
            </p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-gray-900">What fees does BuyMeData charge?</h4>
            <p className="text-xs leading-relaxed text-gray-500">
              BuyMeData operates on a flat, transparent 5% platform fee on successful contributions. There are no monthly fees, hidden dues, or setup costs.
            </p>
          </div>
          <div className="space-y-1.5">
            <h4 className="font-bold text-gray-900">Can I organize fundraising campaigns?</h4>
            <p className="text-xs leading-relaxed text-gray-500">
              Yes! In addition to receiving open support, you can create targeted fundraising campaigns with deadlines, financial targets, and progress updates.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#F22550] text-white p-10 sm:p-12 rounded-3xl text-center space-y-4 shadow-xl shadow-[#F22550]/25">
        <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to claim your page?</h2>
        <p className="text-[#FFE6EA] text-sm max-w-md mx-auto">
          Start receiving contributions from your community in just 3 steps.
        </p>
        <div className="pt-2">
          <Link
            to="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-[#F22550] hover:bg-gray-50 font-extrabold text-sm rounded-xl shadow-md transition-all hover:scale-102"
          >
            Claim Your Page Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
