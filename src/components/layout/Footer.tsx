import React from 'react';
import { Link } from '../../router';
import { ShieldCheck, Heart, Globe } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200/80 pt-16 pb-12 text-sm text-gray-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-gray-100">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <BrandLogo size="md" showSlogan={true} />
            <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
              Empowering creators, builders, students, and community causes across Nigeria and Africa to receive direct financial support through a single shareable link.
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Bank-grade Security
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Globe className="w-4 h-4 text-[#F22550]" /> NGN ₦ Bachs.io Settlement
              </span>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 text-xs uppercase tracking-wider">Product</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/how-it-works" className="hover:text-[#F22550] transition-colors">How It Works</Link>
              </li>
              <li>
                <Link to="/folatech" className="hover:text-[#F22550] transition-colors">Explore Creators</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#F22550] transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#F22550] transition-colors">FAQ & Support</Link>
              </li>
            </ul>
          </div>

          {/* For Creators */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 text-xs uppercase tracking-wider">Creators</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/auth/register" className="hover:text-[#F22550] transition-colors">Claim Your Page</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-[#F22550] transition-colors">Creator Dashboard</Link>
              </li>
              <li>
                <Link to="/guidelines" className="hover:text-[#F22550] transition-colors">Fundraising Guidelines</Link>
              </li>
            </ul>
          </div>

          {/* Legal Policies */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 text-xs uppercase tracking-wider">Legal & Trust</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/terms" className="hover:text-[#F22550] transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#F22550] transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-[#F22550] transition-colors">Refund Policy</Link>
              </li>
              <li>
                <Link to="/guidelines" className="hover:text-[#F22550] transition-colors">Community Guidelines</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} BuyMeData (buymedata.com). All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-[#F22550] fill-[#F22550]" /> for the African creative economy.
          </p>
        </div>
      </div>
    </footer>
  );
}
