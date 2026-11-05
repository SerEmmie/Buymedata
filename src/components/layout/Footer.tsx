import React from 'react';
import { Link } from '../../router';
import { ShieldCheck, Heart, Globe } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200/80 pt-16 pb-12 text-sm text-gray-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-gray-100">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#6741D9] flex items-center justify-center text-white font-extrabold text-base">
                B
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900">
                BuyMe<span className="text-[#6741D9]">Data</span>
              </span>
            </Link>
            <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
              Empowering creators, builders, students, and community causes across Nigeria and Africa to receive support through a single shareable link.
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Bank-grade Security
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Globe className="w-4 h-4 text-[#6741D9]" /> NGN ₦ Multi-market ready
              </span>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 text-xs uppercase tracking-wider">Product</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/how-it-works" className="hover:text-[#6741D9] transition-colors">How It Works</Link>
              </li>
              <li>
                <Link to="/folatech" className="hover:text-[#6741D9] transition-colors">Explore Creators</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-[#6741D9] transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#6741D9] transition-colors">FAQ & Support</Link>
              </li>
            </ul>
          </div>

          {/* For Creators */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 text-xs uppercase tracking-wider">Creators</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/auth/register" className="hover:text-[#6741D9] transition-colors">Start Your Page</Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-[#6741D9] transition-colors">Creator Dashboard</Link>
              </li>
              <li>
                <Link to="/guidelines" className="hover:text-[#6741D9] transition-colors">Fundraising Guidelines</Link>
              </li>
            </ul>
          </div>

          {/* Legal Policies */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 text-xs uppercase tracking-wider">Legal & Trust</h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/terms" className="hover:text-[#6741D9] transition-colors">Terms of Service</Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#6741D9] transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-[#6741D9] transition-colors">Refund Policy</Link>
              </li>
              <li>
                <Link to="/guidelines" className="hover:text-[#6741D9] transition-colors">Community Guidelines</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>© {new Date().getFullYear()} BuyMeData (buymedata.com). All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for the African creative economy.
          </p>
        </div>
      </div>
    </footer>
  );
}
