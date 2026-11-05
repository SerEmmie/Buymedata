import React from 'react';
import { useLocation, Link } from '../../router';
import { AlertTriangle, ShieldCheck, FileText } from 'lucide-react';

export function LegalPage({ docType }: { docType?: 'terms' | 'privacy' | 'refund-policy' | 'guidelines' }) {
  const { pathname } = useLocation();

  const currentDoc =
    docType ||
    (pathname.includes('privacy')
      ? 'privacy'
      : pathname.includes('refund')
      ? 'refund-policy'
      : pathname.includes('guidelines')
      ? 'guidelines'
      : 'terms');

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
      {/* Draft Disclaimer Notice */}
      <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-2xl flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 leading-relaxed">
          <p className="font-bold">Initial Draft Template — Pending Production Legal Review</p>
          <p className="mt-0.5 text-amber-800">
            This document is a functional MVP template designed to govern platform interactions. It must undergo formal Nigerian and international regulatory and compliance counsel review before production deployment.
          </p>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-gray-200 gap-2 overflow-x-auto text-xs font-semibold pb-1">
        <Link
          to="/terms"
          className={`px-4 py-2 rounded-t-xl transition-colors whitespace-nowrap ${
            currentDoc === 'terms'
              ? 'bg-white text-[#6741D9] border-b-2 border-[#6741D9]'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Terms of Service
        </Link>
        <Link
          to="/privacy"
          className={`px-4 py-2 rounded-t-xl transition-colors whitespace-nowrap ${
            currentDoc === 'privacy'
              ? 'bg-white text-[#6741D9] border-b-2 border-[#6741D9]'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Privacy Policy
        </Link>
        <Link
          to="/refund-policy"
          className={`px-4 py-2 rounded-t-xl transition-colors whitespace-nowrap ${
            currentDoc === 'refund-policy'
              ? 'bg-white text-[#6741D9] border-b-2 border-[#6741D9]'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Refund Policy
        </Link>
        <Link
          to="/guidelines"
          className={`px-4 py-2 rounded-t-xl transition-colors whitespace-nowrap ${
            currentDoc === 'guidelines'
              ? 'bg-white text-[#6741D9] border-b-2 border-[#6741D9]'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          Fundraising Guidelines
        </Link>
      </div>

      {/* Document Content */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-gray-100 shadow-xs prose prose-gray max-w-none text-xs leading-relaxed space-y-6">
        {currentDoc === 'terms' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-extrabold text-gray-900">Terms of Service</h1>
            <p className="text-gray-400">Effective Date: November 2026 (Draft v1.0)</p>

            <h3 className="font-bold text-gray-900 text-sm pt-2">1. Overview of Platform</h3>
            <p>
              BuyMeData ("we", "our", or "the Platform") operates an online support and crowdfunding infrastructure that allows creators, individuals, and organizations ("Creators") to receive voluntary financial contributions from supporters ("Supporters").
            </p>

            <h3 className="font-bold text-gray-900 text-sm pt-2">2. Creator Eligibility & Account Terms</h3>
            <p>
              Creators must be at least 18 years of age or possess legal capacity under the laws of the Federal Republic of Nigeria. Creators must provide accurate, verified identity and banking information before requesting payouts. Impersonation of other creators or public figures is strictly prohibited.
            </p>

            <h3 className="font-bold text-gray-900 text-sm pt-2">3. Financial Contributions</h3>
            <p>
              Contributions sent to Creators are voluntary gifts and crowdfunding contributions. They do not constitute an equity investment, debt instrument, or guaranteed commercial contract for services unless explicitly agreed in writing between Creator and Supporter.
            </p>

            <h3 className="font-bold text-gray-900 text-sm pt-2">4. Platform Fees and Settlements</h3>
            <p>
              BuyMeData deducts a standard platform fee of 5% on all successful contributions. Settlement times into verified creator bank accounts are governed by banking settlement networks and internal risk verification.
            </p>
          </div>
        )}

        {currentDoc === 'privacy' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-extrabold text-gray-900">Privacy Policy (NDPR & GDPR Compliant Draft)</h1>
            <p className="text-gray-400">Effective Date: November 2026 (Draft v1.0)</p>

            <h3 className="font-bold text-gray-900 text-sm pt-2">1. Information We Collect</h3>
            <p>
              We collect information you provide directly to us: full name, email address, username, profile imagery, bank account details for payouts, and transaction metadata. For Supporters, we collect email addresses solely for the purpose of dispatching payment confirmation receipts.
            </p>

            <h3 className="font-bold text-gray-900 text-sm pt-2">2. Anonymous Contributions</h3>
            <p>
              When a supporter selects "Anonymous Contribution", their personal name is withheld from public page listings and public supporter walls. Transaction records are maintained privately solely for fraud prevention and legal accounting obligations.
            </p>

            <h3 className="font-bold text-gray-900 text-sm pt-2">3. Payment Security</h3>
            <p>
              Payment card numbers, CVVs, and banking PINs are processed directly by certified payment gateways (such as Paystack). BuyMeData servers never store or transmit raw card credentials.
            </p>
          </div>
        )}

        {currentDoc === 'refund-policy' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-extrabold text-gray-900">Refund Policy</h1>
            <p className="text-gray-400">Effective Date: November 2026 (Draft v1.0)</p>

            <h3 className="font-bold text-gray-900 text-sm pt-2">1. Nature of Support</h3>
            <p>
              Contributions made to creators on BuyMeData are voluntary financial gifts or donations intended to support creator livelihoods and fundraising projects. As a general rule, contributions are non-refundable once settled.
            </p>

            <h3 className="font-bold text-gray-900 text-sm pt-2">2. Unauthorized or Fraudulent Charges</h3>
            <p>
              If a charge was made fraudulently or without your consent using your card or banking details, please contact our trust and safety department immediately at <span className="font-mono text-[#6741D9]">safety@buymedata.com</span>. We cooperate with financial institutions to investigate disputed transactions.
            </p>

            <h3 className="font-bold text-gray-900 text-sm pt-2">3. Campaign Cancellation & Abuse</h3>
            <p>
              If a fundraising campaign is confirmed by our Trust & Safety moderation team to have violated platform policies or conducted fraudulent misrepresentation prior to payout disbursement, held funds may be returned to originating payment sources at platform discretion.
            </p>
          </div>
        )}

        {currentDoc === 'guidelines' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-extrabold text-gray-900">Community & Fundraising Guidelines</h1>
            <p className="text-gray-400">Effective Date: November 2026 (Draft v1.0)</p>

            <h3 className="font-bold text-gray-900 text-sm pt-2">1. Prohibited Campaigns</h3>
            <p>
              BuyMeData strictly prohibits campaigns or profiles that involve: unlawful activities under Nigerian law, hate speech, terrorism financing, unlicensed financial pyramid schemes or fraudulent high-yield investment programs (HYIPs), weapon sales, or unauthorized impersonation.
            </p>

            <h3 className="font-bold text-gray-900 text-sm pt-2">2. Honest Campaign Representation</h3>
            <p>
              Creators must represent their fundraising goals and milestones truthfully. Misleading the public regarding medical emergencies, charitable causes, or hardware acquisitions constitutes grounds for immediate campaign suspension and account termination.
            </p>

            <h3 className="font-bold text-gray-900 text-sm pt-2">3. Community Reporting</h3>
            <p>
              Every public campaign page features a "Report Campaign" flag. Our administrative moderation team investigates reported campaigns within 24 hours.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
