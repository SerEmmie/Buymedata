import React from 'react';
import { Link } from '../../router';
import {
  ArrowRight,
  Landmark,
  AtSign,
  Mail,
  Check,
} from 'lucide-react';

export function HowItWorksPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <p className="text-xs font-bold text-[#F22550] uppercase tracking-[0.14em]">
          How It Works
        </p>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#17191F] tracking-tight text-balance">
          Getting support shouldn&apos;t be complicated.
        </h1>
        <p className="text-gray-600 text-base leading-relaxed">
          Three simple steps are all it takes to create your personalised page, share your link, and receive contributions in Naira. A little support goes a long way.
        </p>
      </div>

      {/* 3-Step Deep Dive */}
      <div className="space-y-6">
        {[
          {
            step: 'Step 1',
            title: 'Create your page',
            badge: 'Your Personal Link',
            icon: AtSign,
            description:
              "Choose your username (e.g. buymedata.com/@yourname), set up your profile, and tell people what you're working towards — whether it is creative work, studies, a side project, or a community cause.",
            highlights: [
              'Custom link: buymedata.com/@yourname',
              'Real-time username availability check',
              'Optional fundraising goals with clear targets',
            ],
          },
          {
            step: 'Step 2',
            title: 'Share your link',
            badge: 'Quick Sign-Up',
            icon: Mail,
            description:
              'Sign up with Google, a one-time email link, or a password via Supabase Authentication. Once your page is ready, share your unique link across social profiles, newsletters, WhatsApp, and with your community.',
            highlights: [
              'Sign up with Google, one-time link, or email & password',
              'Supporters do not need an account to contribute',
              'Verified via Supabase Authentication',
            ],
          },
          {
            step: 'Step 3',
            title: 'Receive support',
            badge: 'Track & Withdraw',
            icon: Landmark,
            description:
              'Receive contributions securely in Naira via Bachs.io, track your support and fundraising goals from your dashboard, and withdraw eligible funds to a verified Nigerian commercial bank account.',
            highlights: [
              'Track contributions and goal progress in one dashboard',
              'Transparent 5% platform fee on successful contributions',
              'Bank withdrawals from ₦2,000 minimum balance (₦50 transfer fee)',
            ],
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.step}
              className="bg-white rounded-3xl p-8 sm:p-10 border border-gray-200/80 flex flex-col md:flex-row md:items-start gap-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#FFE6EA] text-[#F22550] flex items-center justify-center flex-shrink-0">
                <Icon className="w-7 h-7" />
              </div>
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#F22550] uppercase">{item.step}</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-xs font-semibold text-gray-500">
                    {item.badge}
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-[#17191F]">{item.title}</h2>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{item.description}</p>
                <div className="pt-2 space-y-2">
                  {item.highlights.map((h) => (
                    <div key={h} className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-700">
                      <Check className="w-4 h-4 text-[#16865B] flex-shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="bg-[#17191F] text-white p-10 sm:p-12 rounded-3xl text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to get started?</h2>
        <p className="text-gray-300 text-sm sm:text-base max-w-md mx-auto">
          Create your personalised page and start receiving meaningful support in Naira.
        </p>
        <div className="pt-2">
          <Link
            to="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#F22550] text-white hover:bg-[#D81A43] font-bold text-sm rounded-2xl transition-colors"
          >
            <span>Create your free page</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
