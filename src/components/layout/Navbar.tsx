import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate, useLocation } from '../../router';
import {
  Heart,
  LayoutDashboard,
  ShieldAlert,
  Bell,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { getUserNotifications } from '../../services/notificationService';
import { BrandLogo } from '../ui/BrandLogo';

export function Navbar() {
  const { fbUser, userProfile, creatorProfile, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (fbUser) {
      getUserNotifications(fbUser.uid)
        .then((notifs) => {
          setUnreadCount(notifs.filter((n) => !n.isRead).length);
        })
        .catch(console.warn);
    }
  }, [fbUser, pathname]);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    setMenuOpen(false);
    navigate('/');
  };

  const displayName = userProfile?.fullName || fbUser?.displayName || 'Account';
  const initials =
    displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'U';
  const avatarSrc = creatorProfile?.profileImage || fbUser?.photoURL || '';

  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'How it works', to: '/how-it-works' },
    { label: 'Explore', to: '/explore' },
    { label: 'FAQs', to: '/faq' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand Logo */}
        <div className="flex items-center flex-shrink-0">
          <BrandLogo size="md" showSlogan={false} />
        </div>

        {/* Center: Desktop Navigation Links */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
          {navItems.map((item) => {
            const isActive =
              item.to === '/' ? pathname === '/' || pathname === '' : pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`whitespace-nowrap transition-colors hover:text-[#F22550] ${
                  isActive ? 'text-[#17191F] font-bold' : ''
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions / Authenticated Account */}
        <div className="hidden md:flex items-center gap-3 flex-shrink-0">
          {fbUser ? (
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard/notifications"
                className="relative p-2 text-gray-500 hover:text-[#F22550] hover:bg-gray-50 rounded-xl transition-colors"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#F22550] text-white rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors whitespace-nowrap"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Admin
                </Link>
              )}

              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold bg-[#FFE6EA] text-[#F22550] hover:bg-[#ffd5dc] rounded-xl transition-colors whitespace-nowrap"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  aria-expanded={dropdownOpen}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-full border border-gray-200 transition-colors"
                >
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={displayName}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-[#17191F] text-white text-xs font-bold flex items-center justify-center">
                      {initials}
                    </span>
                  )}
                  <span className="max-w-[110px] truncate">{displayName}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-gray-200/80 py-1.5 z-50"
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <div className="px-3.5 py-2 border-b border-gray-100">
                      <p className="text-[11px] text-gray-400">Signed in as</p>
                      <p className="text-xs font-semibold text-[#17191F] truncate">{fbUser.email}</p>
                    </div>

                    {creatorProfile?.username && (
                      <Link
                        to={`/@${creatorProfile.username}`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-[#FFE6EA] hover:text-[#F22550]"
                      >
                        <Heart className="w-3.5 h-3.5 text-[#F22550]" /> My Public Page
                      </Link>
                    )}

                    <Link
                      to="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-[#FFE6EA] hover:text-[#F22550]"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-amber-700 hover:bg-amber-50"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" /> Administration
                      </Link>
                    )}

                    <div className="border-t border-gray-100 my-1" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/auth/login"
                className="text-sm font-semibold text-gray-700 hover:text-[#17191F] px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap"
              >
                Log in
              </Link>
              <Link
                to="/auth/register"
                className="inline-flex items-center justify-center text-sm font-bold text-white bg-[#F22550] hover:bg-[#D81A43] px-5 py-2.5 rounded-xl transition-colors whitespace-nowrap"
              >
                Get started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Controls */}
        <div className="flex md:hidden items-center gap-2">
          {fbUser && (
            <Link
              to="/dashboard"
              aria-label="Open Dashboard"
              className="p-2.5 text-[#F22550] bg-[#FFE6EA] rounded-xl"
            >
              <LayoutDashboard className="w-4 h-4" />
            </Link>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="p-2.5 rounded-xl text-gray-700 hover:bg-gray-100 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <nav
          id="mobile-nav-drawer"
          aria-label="Mobile navigation"
          className="md:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-5 space-y-1.5"
        >
          {navItems.map((item) => {
            const isActive =
              item.to === '/' ? pathname === '/' || pathname === '' : pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-3 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#FFE6EA] text-[#F22550]'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-[#F22550]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="pt-3 mt-2 border-t border-gray-100 space-y-2">
            {fbUser ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center py-3 text-sm font-bold bg-[#F22550] text-white rounded-xl"
                >
                  Open Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full text-center py-3 text-sm font-semibold text-amber-800 bg-amber-50 rounded-xl"
                  >
                    Admin Console
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full text-center py-3 text-sm font-semibold text-red-600 rounded-xl hover:bg-red-50"
                >
                  Log out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  to="/auth/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-center py-3 text-sm font-semibold text-gray-800 border border-gray-200 rounded-xl hover:bg-gray-50"
                >
                  Log in
                </Link>
                <Link
                  to="/auth/register"
                  onClick={() => setMenuOpen(false)}
                  className="text-center py-3 text-sm font-bold bg-[#F22550] hover:bg-[#D81A43] text-white rounded-xl"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
