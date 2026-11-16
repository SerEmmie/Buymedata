import React from 'react';
import { Link } from '../../router';
import { BrandLogo } from '../ui/BrandLogo';

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200/80 pt-16 pb-12 text-sm text-gray-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-gray-100">
          {/* Brand Column */}
          <div className="md:col-span-5 space-y-4">
            <BrandLogo size="md" showSlogan={false} />
            <p className="text-sm font-bold text-[#17191F]">
              A little support goes a long way.
            </p>
            <p className="text-gray-600 text-sm max-w-sm leading-relaxed">
              Empowering creators, builders, students and communities to receive support and bring meaningful goals to life.
            </p>
          </div>

          {/* Explore */}
          <div className="md:col-span-2">
            <h4 className="font-bold text-[#17191F] mb-3.5 text-xs uppercase tracking-wider">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/" className="hover:text-[#F22550] transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-[#F22550] transition-colors">
                  How it works
                </Link>
              </li>
              <li>
                <Link to="/explore" className="hover:text-[#F22550] transition-colors">
                  Explore pages
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#F22550] transition-colors">
                  FAQs
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="md:col-span-3">
            <h4 className="font-bold text-[#17191F] mb-3.5 text-xs uppercase tracking-wider">
              Company
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="hover:text-[#F22550] transition-colors">
                  About us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-[#F22550] transition-colors">
                  Contact us
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#F22550] transition-colors">
                  Terms of service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-[#F22550] transition-colors">
                  Privacy policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div className="md:col-span-2">
            <h4 className="font-bold text-[#17191F] mb-3.5 text-xs uppercase tracking-wider">
              Account
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/auth/register" className="hover:text-[#F22550] transition-colors">
                  Create an account
                </Link>
              </li>
              <li>
                <Link to="/auth/login" className="hover:text-[#F22550] transition-colors">
                  Log in
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-[#F22550] transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2026 BuyMeData. All rights reserved.</p>
          <p className="font-medium text-gray-400">
            Support creators. Fund dreams. Make an impact.
          </p>
        </div>
      </div>
    </footer>
  );
}
