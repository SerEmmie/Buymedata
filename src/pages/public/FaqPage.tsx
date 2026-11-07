import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';
import { Link } from '../../router';

export function FaqPage() {
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      category: 'General',
      q: 'What is BuyMeData?',
      a: 'BuyMeData is a creator support, crowdfunding, and personal fundraising platform. It lets creators, developers, educators, and organizations receive financial contributions through a single personalized link (buymedata.com/username) and launch dedicated fundraising campaigns.',
    },
    {
      category: 'General',
      q: 'How do I start receiving support?',
      a: 'Simply click "Get Started", register with your email or Google account, customize your profile bio and support button, and share your unique URL on your social profiles, newsletters, or portfolio.',
    },
    {
      category: 'Contributions',
      q: 'Do supporters need an account to contribute?',
      a: 'No. Supporters can contribute in under 30 seconds using their debit card, bank transfer, or USSD without signing up or logging in.',
    },
    {
      category: 'Contributions',
      q: 'Can contributions be made anonymously?',
      a: 'Yes. During checkout, supporters can check the "Make contribution anonymous" box. Their name will be replaced with "Generous Supporter" on the public page while the creator still receives the full funds.',
    },
    {
      category: 'Payments & Security',
      q: 'How secure are payments on BuyMeData?',
      a: 'All transactions use bank-grade 256-bit encryption through licensed Central Bank of Nigeria (CBN) compliant payment infrastructure. We never store raw debit card numbers or security PINs.',
    },
    {
      category: 'Fees & Payouts',
      q: 'What are the platform fees?',
      a: 'BuyMeData charges a transparent 5% platform fee on successful contributions. There are no monthly subscriptions, setup fees, or hidden charges. What you see is what you get.',
    },
    {
      category: 'Fees & Payouts',
      q: 'How do I withdraw my earnings?',
      a: 'In your Creator Dashboard, go to "Payouts & Bank" and add your verified Nigerian bank account (GTBank, Access Bank, Zenith, Kuda, OPay, First Bank, etc.). Once your available balance reaches ₦2,000, you can request a withdrawal anytime.',
    },
    {
      category: 'Campaigns',
      q: 'How do fundraising campaigns differ from one-time support?',
      a: 'Your support button is always active for general contributions. Campaigns, on the other hand, are dedicated fundraising initiatives with a specific financial goal (e.g., ₦850,000 for Solar Inverter & Fiber Setup) and an optional deadline, complete with a live progress bar and creator updates.',
    },
  ];

  const filtered = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="text-xs font-bold text-[#F22550] uppercase tracking-wider">
          Help & Support
        </span>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-gray-600 text-sm">
          Everything you need to know about receiving support, payments, and campaigns on BuyMeData.
        </p>

        {/* Search bar */}
        <div className="relative max-w-md mx-auto pt-2">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-5" />
          <input
            type="text"
            placeholder="Search questions (e.g. payout, fees, campaigns)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-[#F22550] shadow-xs"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all shadow-xs"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between font-bold text-gray-900 text-sm hover:text-[#F22550] transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${
                    isOpen ? 'rotate-180 text-[#F22550]' : ''
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-xs text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-gray-500">
            No matching questions found for "{search}".
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200/60 text-center space-y-2">
        <h4 className="font-bold text-sm text-gray-900">Still have questions?</h4>
        <p className="text-xs text-gray-500">
          Our team is here to assist creators and supporters across Africa.
        </p>
        <div className="pt-2">
          <a
            href="mailto:support@buymedata.com"
            className="text-xs font-bold text-[#F22550] hover:underline"
          >
            support@buymedata.com
          </a>
        </div>
      </div>
    </div>
  );
}
