import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation, useNavigate } from '../../router';
import {
  LayoutDashboard,
  Globe,
  Flame,
  CreditCard,
  PieChart,
  Landmark,
  Bell,
  Settings,
  ExternalLink,
  Copy,
  Check,
  PlusCircle,
  Menu,
  X,
  ShieldAlert,
  LogOut,
  AlertTriangle,
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { userProfile, creatorProfile, isAdmin, isSuspended, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const publicUrl = creatorProfile?.username ? `/${creatorProfile.username}` : '#';

  const copyPageLink = () => {
    if (creatorProfile?.username) {
      const fullUrl = `${window.location.origin}/${creatorProfile.username}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { label: 'My Public Page', href: '/dashboard/page', icon: Globe },
    { label: 'Campaigns', href: '/dashboard/campaigns', icon: Flame },
    { label: 'Contributions', href: '/dashboard/contributions', icon: CreditCard },
    { label: 'Earnings & Ledger', href: '/dashboard/earnings', icon: PieChart },
    { label: 'Payouts & Bank', href: '/dashboard/payouts', icon: Landmark },
    { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFC] flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#6741D9] text-white flex items-center justify-center font-bold text-sm">
            B
          </div>
          <span className="font-bold text-gray-900 text-sm">BuyMeData</span>
        </Link>
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="p-1.5 text-gray-600 rounded-lg hover:bg-gray-100"
        >
          {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`w-full md:w-64 bg-white border-r border-gray-200/80 flex flex-col justify-between p-4 flex-shrink-0 ${
          mobileNavOpen ? 'block' : 'hidden md:flex'
        }`}
      >
        <div className="space-y-6">
          {/* Logo & Creator quick info */}
          <div className="hidden md:flex items-center justify-between pb-4 border-b border-gray-100">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#6741D9] text-white flex items-center justify-center font-bold">
                B
              </div>
              <span className="font-bold text-base text-gray-900">
                BuyMe<span className="text-[#6741D9]">Data</span>
              </span>
            </Link>
          </div>

          {/* Quick link button to public page */}
          {creatorProfile?.username && (
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Your Live Link</span>
                <button
                  onClick={copyPageLink}
                  className="flex items-center gap-1 text-[#6741D9] hover:underline font-semibold"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-gray-800 hover:text-[#6741D9] flex items-center justify-between truncate"
              >
                <span className="truncate">buymedata.com/{creatorProfile.username}</span>
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-1" />
              </a>
            </div>
          )}

          {/* Nav List */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-[#6741D9] text-white shadow-sm shadow-[#6741D9]/20'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-gray-100 space-y-2">
          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Admin Portal
            </Link>
          )}

          <div className="flex items-center justify-between pt-2 px-2 text-xs text-gray-500">
            <div className="truncate">
              <p className="font-semibold text-gray-800 truncate">
                {creatorProfile?.displayName || userProfile?.fullName || 'Creator'}
              </p>
              <p className="text-[11px] text-gray-400 truncate">
                {userProfile?.email}
              </p>
            </div>
            <button
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              title="Sign Out"
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {isSuspended && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-2xl flex items-center justify-between text-xs text-red-900 shadow-xs">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-bold">Account Under Administrative Restriction</p>
                  <p className="text-red-700 mt-0.5">
                    This account is currently suspended. New campaigns and payout withdrawals are paused. Contact <a href="mailto:support@buymedata.com" className="underline font-semibold">support@buymedata.com</a>.
                  </p>
                </div>
              </div>
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
