import React, { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Link } from '../../router';

export function FaqPage() {
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      category: 'General',
      q: 'What is BuyMeData?',
      a: 'BuyMeData is a platform that allows individuals, creators and communities to receive financial support through a personalised page and shareable link.',
    },
    {
      category: 'General',
      q: 'Who can use BuyMeData?',
      a: 'Anyone with a legitimate reason to receive support can create a page. This includes content creators, freelancers, students, entrepreneurs, individuals and community organisers.',
    },
    {
      category: 'Getting Started',
      q: 'How do I receive support?',
      a: 'Create your page, share your unique link and allow supporters to contribute through the available payment options.',
    },
    {
      category: 'Contributions',
      q: 'Do supporters need an account?',
      a: 'No. Supporters can contribute directly through your page without creating an account using guest checkout, needing only an email address for their payment receipt.',
    },
    {
      category: 'Fundraising Goals',
      q: 'Can I set a fundraising target?',
      a: 'Yes. You can create a goal, set a target amount and track contributions towards it.',
    },
    {
      category: 'Pricing & Fees',
      q: 'How much does BuyMeData cost?',
      a: 'Creating your BuyMeData page is free with no monthly subscription or setup fee. A transparent 5% platform fee applies to successful contributions.',
    },
    {
      category: 'Privacy',
      q: 'Can supporters stay anonymous?',
      a: 'Yes. During checkout, supporters can choose to hide their name publicly while still completing their contribution.',
    },
    {
      category: 'Withdrawals',
      q: 'How do I withdraw my funds?',
      a: 'Add and verify a Nigerian commercial bank account in your dashboard under Payouts & Bank. Once your available balance reaches the ₦2,000 minimum threshold, you can submit a withdrawal request (a ₦50 transfer fee applies) subject to platform verification.',
    },
    {
      category: 'Eligibility',
      q: 'Is BuyMeData only for influencers?',
      a: 'No. BuyMeData is built for anyone working on something meaningful — whether you are a student, builder, creative, volunteer organiser or everyday individual with a goal worth supporting.',
    },
  ];

  const filtered = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <p className="text-xs font-bold text-[#F22550] uppercase tracking-[0.14em]">
          Help &amp; Support
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17191F] tracking-tight">
          Frequently asked questions.
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Everything you need to know about creating your page, fundraising goals, guest checkout, fees, and bank withdrawals.
        </p>

        {/* Search bar */}
        <div className="relative max-w-md mx-auto pt-2">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-5" />
          <input
            type="text"
            placeholder="Search questions (e.g. withdraw, fees, goals)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search frequently asked questions"
            className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border border-gray-200 text-sm focus:outline-none focus:border-[#F22550] focus:ring-2 focus:ring-[#FFE6EA]"
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((faq, idx) => {
          const isOpen = openIndex === idx;
          const btnId = `faq-btn-${idx}`;
          const panelId = `faq-panel-${idx}`;
          return (
            <div
              key={faq.q}
              className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden transition-colors"
            >
              <h2>
                <button
                  id={btnId}
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-[#17191F] text-sm sm:text-base hover:text-[#F22550] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-[#F22550]' : ''
                    }`}
                  />
                </button>
              </h2>
              {isOpen && (
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3.5"
                >
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-sm text-gray-500">
            No matching questions found for &ldquo;{search}&rdquo;.
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-200/80 text-center space-y-2">
        <h3 className="font-bold text-sm text-[#17191F]">Still have questions?</h3>
        <p className="text-xs text-gray-600">
          Reach out directly to our support team or send us a message.
        </p>
        <div className="pt-2 flex items-center justify-center gap-4">
          <Link
            to="/contact"
            className="text-xs font-bold text-[#F22550] hover:underline"
          >
            Contact us
          </Link>
          <span className="text-gray-300">•</span>
          <a
            href="mailto:support@buymedata.com"
            className="text-xs font-bold text-gray-700 hover:text-[#F22550]"
          >
            support@buymedata.com
          </a>
        </div>
      </div>
    </div>
  );
}
