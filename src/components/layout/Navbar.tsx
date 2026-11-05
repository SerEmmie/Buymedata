import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate, useLocation } from '../../router';
import {
  Heart,
  User as UserIcon,
  LayoutDashboard,
  ShieldAlert,
  Bell,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { getUserNotifications } from '../../services/notificationService';

export function Navbar() {
  const { fbUser, userProfile, creatorProfile, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (fbUser) {
      getUserNotifications(fbUser.uid).then((notifs) => {
        setUnreadCount(notifs.filter((n) => !n.isRead).length);
      }).catch(console.warn);
    }
  }, [fbUser, pathname]);

  const handleLogout = async () => {
    await logout();
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6741D9] to-[#8C68FF] flex items-center justify-center text-white shadow-md shadow-[#6741D9]/20 group-hover:scale-105 transition-transform">
            <span className="font-extrabold text-lg">B</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-gray-900">
            BuyMe<span className="text-[#6741D9]">Data</span>
          </span>
          <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F0EBFF] text-[#6741D9]">
            NGN ₦
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-600">
          <Link
            to="/how-it-works"
            className={`hover:text-[#6741D9] transition-colors ${pathname === '/how-it-works' ? 'text-[#6741D9] font-semibold' : ''}`}
          >
            How it works
          </Link>
          <Link
            to="/about"
            className={`hover:text-[#6741D9] transition-colors ${pathname === '/about' ? 'text-[#6741D9] font-semibold' : ''}`}
          >
            About
          </Link>
          <Link
            to="/faq"
            className={`hover:text-[#6741D9] transition-colors ${pathname === '/faq' ? 'text-[#6741D9] font-semibold' : ''}`}
          >
            FAQ
          </Link>
          <Link
            to="/folatech"
            className="hover:text-[#6741D9] transition-colors flex items-center gap-1 text-gray-500 hover:text-gray-900 text-xs bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200"
          >
            <Sparkles className="w-3 h-3 text-[#6741D9]" /> Explore Sample Creator
          </Link>
        </nav>

        {/* Right CTA / Auth status */}
        <div className="hidden md:flex items-center gap-3">
          {fbUser ? (
            <div className="flex items-center gap-3">
              {/* Notification icon */}
              <Link
                to="/dashboard/notifications"
                className="relative p-2 text-gray-500 hover:text-[#6741D9] hover:bg-gray-50 rounded-lg transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* Admin Portal Button if admin */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Admin
                </Link>
              )}

              {/* Creator Dashboard Button */}
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-[#F0EBFF] text-[#6741D9] hover:bg-[#E5DBFF] rounded-lg transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-full border border-gray-200 transition-colors"
                >
                  <img
                    src={creatorProfile?.profileImage || fbUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                    alt="avatar"
                    className="w-7 h-7 rounded-full object-cover"
                  />
                  <span className="max-w-[100px] truncate">{userProfile?.fullName || fbUser.displayName || 'Account'}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 mr-1" />
                </button>

                {dropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onMouseLeave={() => setDropdownOpen(false)}
                  >
                    <div className="px-3.5 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-400">Signed in as</p>
                      <p className="text-sm font-semibold text-gray-800 truncate">{fbUser.email}</p>
                    </div>

                    {creatorProfile?.username && (
                      <Link
                        to={`/${creatorProfile.username}`}
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-[#F0EBFF] hover:text-[#6741D9]"
                      >
                        <Heart className="w-3.5 h-3.5 text-[#6741D9]" /> My Public Page
                      </Link>
                    )}

                    <Link
                      to="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-gray-700 hover:bg-[#F0EBFF] hover:text-[#6741D9]"
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
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/auth/login"
                className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 transition-colors"
              >
                Sign in
              </Link>
              <Link
                to="/auth/register"
                className="inline-flex items-center justify-center text-sm font-semibold text-white bg-[#6741D9] hover:bg-[#5633C4] px-4 py-2 rounded-xl shadow-sm shadow-[#6741D9]/25 transition-all hover:shadow-md"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          {fbUser && (
            <Link to="/dashboard" className="p-2 text-[#6741D9] bg-[#F0EBFF] rounded-lg">
              <LayoutDashboard className="w-4 h-4" />
            </Link>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            aria-label="Toggle navigation"
          >
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden border-b border-gray-100 bg-white px-4 pt-2 pb-5 space-y-3">
          <Link
            to="/how-it-works"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-sm font-medium text-gray-700"
          >
            How it works
          </Link>
          <Link
            to="/about"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-sm font-medium text-gray-700"
          >
            About BuyMeData
          </Link>
          <Link
            to="/faq"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-sm font-medium text-gray-700"
          >
            FAQ
          </Link>
          <Link
            to="/folatech"
            onClick={() => setMenuOpen(false)}
            className="block py-2 text-sm font-medium text-[#6741D9]"
          >
            Explore Sample Creator (@folatech)
          </Link>

          <div className="pt-2 border-t border-gray-100 space-y-2">
            {fbUser ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full text-center py-2.5 text-sm font-medium bg-[#6741D9] text-white rounded-lg"
                >
                  Open Creator Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="block w-full text-center py-2 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg"
                  >
                    Admin Console
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="block w-full text-center py-2 text-sm font-medium text-red-600"
                >
                  Sign out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/auth/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-center py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg"
                >
                  Sign in
                </Link>
                <Link
                  to="/auth/register"
                  onClick={() => setMenuOpen(false)}
                  className="text-center py-2.5 text-sm font-semibold bg-[#6741D9] text-white rounded-lg"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
