import React from 'react';
import { Link } from '../../router';
import { ShieldCheck, Heart, Globe, Target, ArrowRight } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <p className="text-xs font-bold text-[#F22550] uppercase tracking-[0.14em]">
          About BuyMeData
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17191F] tracking-tight text-balance">
          Support creators. Fund dreams. Make an impact.
        </h1>
        <p className="text-gray-600 text-base leading-relaxed">
          BuyMeData is a creator-support and personal fundraising platform built to help individuals, creators, entrepreneurs, students, and communities receive financial support without barriers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="space-y-4 text-gray-600 text-sm sm:text-base leading-relaxed">
          <h2 className="text-2xl font-extrabold text-[#17191F]">
            Built for everyday people with something worth supporting
          </h2>
          <p>
            Too many good ideas, creative journeys, and personal milestones stall simply because getting support from people who care feels complicated or gated behind large followings.
          </p>
          <p>
            Whether someone is funding a semester of school, building an open-source tool, growing a creative studio, launching an experiment, or rallying a local community initiative, a little support goes a long way.
          </p>
          <p>
            BuyMeData gives anyone a clean personalised page, shareable link, goal tracking, and direct local contributions in Naira through Bachs.io.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 border border-gray-200/80 space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-[#FFE6EA] text-[#F22550] flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-[#17191F]">What we stand for</h3>
          <ul className="space-y-3.5 text-sm text-gray-700">
            <li className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#16865B] flex-shrink-0 mt-1" />
              <span>
                <strong>Transparent Ledger:</strong> Every contribution and platform fee is recorded clearly so you can track your support.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Heart className="w-4 h-4 text-[#F22550] flex-shrink-0 mt-1" />
              <span>
                <strong>Simple &amp; Accessible:</strong> Free page creation with a transparent 5% platform fee on successful contributions.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Globe className="w-4 h-4 text-[#F22550] flex-shrink-0 mt-1" />
              <span>
                <strong>Local Naira Contributions:</strong> Designed for straightforward NGN payments and Nigerian commercial bank withdrawals.
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-10 border border-gray-200/80 text-center space-y-4">
        <h3 className="text-2xl font-extrabold text-[#17191F]">Ready to share what you&apos;re working on?</h3>
        <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
          Create your personalised page and let supporters back your work, your goals, and your journey.
        </p>
        <div className="pt-1">
          <Link
            to="/auth/register"
            className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#F22550] text-white font-bold text-sm rounded-2xl hover:bg-[#D81A43] transition-colors"
          >
            <span>Create your free page</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
