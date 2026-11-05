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
  Layers,
} from 'lucide-react';

export function HowItWorksPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="text-xs font-bold text-[#6741D9] uppercase tracking-wider">
          Simple & Transparent
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          How BuyMeData Works
        </h1>
        <p className="text-gray-600 text-base leading-relaxed">
          From creating your first page to withdrawing funds to your local bank account, here is everything you need to know.
        </p>
      </div>

      {/* 5-Step Deep Dive */}
      <div className="space-y-8">
        {[
          {
            step: 'Step 1',
            title: 'Create your account',
            description:
              'Register in under 60 seconds with your email or Google account. Choose your personal username (e.g. buymedata.com/samuel) which acts as your permanent, shareable support destination.',
            badge: 'Quick Registration',
          },
          {
            step: 'Step 2',
            title: 'Set up your BuyMeData page',
            description:
              'Customize your bio, upload a profile image and cover banner, select a brand color theme, and configure suggested support amounts (e.g. ₦500, ₦1,000, ₦2,000, ₦5,000). You can also set custom CTA text such as "Buy me data 📶", "Buy me coffee ☕", or "Fuel my research 🚀".',
            badge: 'Personalization',
          },
          {
            step: 'Step 3',
            title: 'Share your link',
            description:
              'Paste your unique link across your social media profiles (Twitter/X, Instagram, YouTube, TikTok, LinkedIn, or WhatsApp). Embed it in newsletters, articles, or project READMEs.',
            badge: 'Audience Connection',
          },
          {
            step: 'Step 4',
            title: 'Receive contributions friction-free',
            description:
              'Supporters visit your page, choose an amount, and complete payments via debit cards, bank transfers, or USSD without having to register an account. Supporters can leave public messages of encouragement or contribute anonymously.',
            badge: 'Frictionless Checkout',
          },
          {
            step: 'Step 5',
            title: 'Track your progress and withdraw eligible funds',
            description:
              'Track every contribution through our auditable double-entry financial ledger. Connect your Nigerian bank account (GTBank, Access Bank, Zenith, Kuda, OPay, etc.) and withdraw funds anytime your available balance meets the ₦2,000 threshold.',
            badge: 'Direct Payouts',
          },
        ].map((item, idx) => (
          <div
            key={item.step}
            className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-center gap-6"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#F0EBFF] text-[#6741D9] flex items-center justify-center font-extrabold text-xl flex-shrink-0">
              {idx + 1}
            </div>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#6741D9] uppercase">{item.step}</span>
                <span className="text-gray-300">•</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md">
                  {item.badge}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="bg-[#6741D9] text-white p-10 rounded-3xl text-center space-y-4">
        <h2 className="text-2xl font-bold">Ready to get started?</h2>
        <p className="text-[#F0EBFF] text-sm max-w-md mx-auto">
          Start receiving financial contributions from your community today.
        </p>
        <Link
          to="/auth/register"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#6741D9] font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors"
        >
          Create Your Page Now <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
