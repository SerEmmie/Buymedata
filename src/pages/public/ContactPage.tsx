import React, { useState } from 'react';
import { Link } from '../../router';
import { Mail, ShieldCheck, Copy, Check, Send, ArrowRight } from 'lucide-react';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('General Support');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedEmail(addr);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const mailtoHref = `mailto:support@buymedata.com?subject=${encodeURIComponent(
    `[BuyMeData] ${topic} — ${name || 'Support Inquiry'}`
  )}&body=${encodeURIComponent(
    `Name: ${name}\nReply Email: ${email}\nTopic: ${topic}\n\nMessage:\n${message}`
  )}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSubmitted(true);
    window.location.href = mailtoHref;
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
      <div className="max-w-2xl space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#F22550]">
          Contact Us
        </p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#17191F] tracking-tight text-balance">
          Get in touch with BuyMeData.
        </h1>
        <p className="text-base text-gray-600 leading-relaxed">
          Have a question about creating a page, receiving contributions, or verifying a withdrawal? Reach out directly and our team will assist you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Direct Channels */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFE6EA] text-[#F22550] flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#17191F]">General & Creator Support</h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              Account assistance, page setup, fundraising goal questions, and supporter payment receipts.
            </p>
            <div className="pt-1 flex items-center justify-between gap-2 bg-[#F5F6F8] px-3.5 py-2.5 rounded-xl">
              <a
                href="mailto:support@buymedata.com"
                className="text-xs font-bold text-[#17191F] hover:text-[#F22550] truncate"
              >
                support@buymedata.com
              </a>
              <button
                type="button"
                onClick={() => handleCopy('support@buymedata.com')}
                className="text-xs font-semibold text-gray-500 hover:text-[#F22550] inline-flex items-center gap-1 flex-shrink-0"
                aria-label="Copy support email address"
              >
                {copiedEmail === 'support@buymedata.com' ? (
                  <Check className="w-3.5 h-3.5 text-[#16865B]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 text-[#17191F] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-[#17191F]">Trust & Safety</h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              Report suspicious activity, unauthorised charges, or campaign policy concerns.
            </p>
            <div className="pt-1 flex items-center justify-between gap-2 bg-[#F5F6F8] px-3.5 py-2.5 rounded-xl">
              <a
                href="mailto:safety@buymedata.com"
                className="text-xs font-bold text-[#17191F] hover:text-[#F22550] truncate"
              >
                safety@buymedata.com
              </a>
              <button
                type="button"
                onClick={() => handleCopy('safety@buymedata.com')}
                className="text-xs font-semibold text-gray-500 hover:text-[#F22550] inline-flex items-center gap-1 flex-shrink-0"
                aria-label="Copy safety email address"
              >
                {copiedEmail === 'safety@buymedata.com' ? (
                  <Check className="w-3.5 h-3.5 text-[#16865B]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 space-y-2">
            <h3 className="text-sm font-bold text-[#17191F]">Looking for quick answers?</h3>
            <p className="text-xs text-gray-600">
              Review our frequently asked questions about fees, guest checkout, and withdrawals.
            </p>
            <Link
              to="/faq"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F22550] hover:underline pt-1"
            >
              Visit FAQs <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Compose Inquiry Form */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-[#17191F]">Send us a message</h2>
            <p className="text-xs text-gray-500 mt-1">
              Fill out the details below to compose a structured support email to our team.
            </p>
          </div>

          {submitted ? (
            <div className="p-6 bg-[#F5F6F8] rounded-2xl border border-gray-200 space-y-3">
              <h3 className="text-base font-bold text-[#17191F]">Email draft prepared</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Your email client should open with your message addressed to{' '}
                <strong className="text-[#17191F]">support@buymedata.com</strong>. If it did not open automatically, click below or copy the address.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={mailtoHref}
                  className="px-4 py-2.5 bg-[#F22550] hover:bg-[#D81A43] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Open Email Client
                </a>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50"
                >
                  Edit Message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-bold text-gray-700 mb-1.5">
                    Your Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#F22550] focus:ring-2 focus:ring-[#FFE6EA]"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-xs font-bold text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#F22550] focus:ring-2 focus:ring-[#FFE6EA]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-topic" className="block text-xs font-bold text-gray-700 mb-1.5">
                  Topic
                </label>
                <select
                  id="contact-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 bg-white focus:outline-none focus:border-[#F22550] focus:ring-2 focus:ring-[#FFE6EA]"
                >
                  <option value="General Support">General Support</option>
                  <option value="Page & Account Setup">Page & Account Setup</option>
                  <option value="Contributions & Receipts">Contributions & Receipts</option>
                  <option value="Withdrawals & Bank Verification">Withdrawals & Bank Verification</option>
                  <option value="Trust & Safety">Trust & Safety</option>
                </select>
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs font-bold text-gray-700 mb-1.5">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="How can we help?"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 resize-none focus:outline-none focus:border-[#F22550] focus:ring-2 focus:ring-[#FFE6EA]"
                />
              </div>

              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-[#F22550] hover:bg-[#D81A43] text-white font-bold text-sm rounded-xl transition-colors inline-flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Send Message</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
