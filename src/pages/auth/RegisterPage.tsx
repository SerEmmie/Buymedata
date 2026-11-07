import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from '../../router';
import { useAuth } from '../../context/AuthContext';
import {
  registerWithEmail,
  loginWithGoogle,
  sendOneTimeEmailLink,
} from '../../services/authService';
import { checkUsernameAvailability } from '../../services/creatorService';
import { BrandLogo } from '../../components/ui/BrandLogo';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User as UserIcon,
  AtSign,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Loader2,
  Send,
  CheckCircle2,
} from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { refreshProfiles } = useAuth();

  // Parse query parameter or stored username
  const searchParams = new URLSearchParams(window.location.search);
  const initialClaim = searchParams.get('claim') || window.localStorage.getItem('buymedata_claimed_username') || '';

  // Step 1: Claim Username, Step 2: Authenticate (Gmail or Magic Link)
  const [currentStep, setCurrentStep] = useState<1 | 2>(initialClaim.length >= 3 ? 2 : 1);
  const [claimedUsername, setClaimedUsername] = useState(initialClaim.toLowerCase().trim().replace(/[^a-z0-9_]/g, ''));
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  // Sign up inputs
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Check username availability on Step 1
  useEffect(() => {
    const clean = claimedUsername.toLowerCase().trim().replace(/[^a-z0-9_]/g, '');
    if (!clean || clean.length < 3) {
      setUsernameStatus('idle');
      return;
    }

    setUsernameStatus('checking');
    setCheckingUsername(true);

    const timer = setTimeout(async () => {
      try {
        const isAvail = await checkUsernameAvailability(clean);
        setUsernameStatus(isAvail ? 'available' : 'taken');
      } catch {
        setUsernameStatus('available');
      } finally {
        setCheckingUsername(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [claimedUsername]);

  const handleStep1Proceed = () => {
    if (usernameStatus === 'taken') {
      setErrorMsg('This username is already taken. Please choose another.');
      return;
    }
    if (claimedUsername.length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      return;
    }
    setErrorMsg('');
    window.localStorage.setItem('buymedata_claimed_username', claimedUsername);
    setCurrentStep(2);
  };

  // Google / Gmail one-click sign up
  const handleGoogleSignup = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await loginWithGoogle(claimedUsername);
      await refreshProfiles();
      window.localStorage.removeItem('buymedata_claimed_username');
      navigate('/dashboard');
    } catch (err: unknown) {
      console.error('Google signup error:', err);
      setErrorMsg('Google sign-in was cancelled or encountered an issue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Passwordless One-Time Email Magic Link sign up
  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await sendOneTimeEmailLink(email);
      setMagicLinkSent(true);
    } catch (err: unknown) {
      console.error('Error sending magic link:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Could not send sign-in link. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  // Standard Email + Password signup fallback
  const handlePasswordSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please provide both email and password.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    setErrorMsg('');
    setLoading(true);
    try {
      await registerWithEmail(
        fullName || claimedUsername,
        email,
        password,
        claimedUsername,
        'creator'
      );
      await refreshProfiles();
      window.localStorage.removeItem('buymedata_claimed_username');
      navigate('/dashboard');
    } catch (err: unknown) {
      console.error('Registration error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('email-already-in-use')) {
        setErrorMsg('An account with this email already exists. Please log in.');
      } else {
        setErrorMsg(msg || 'Failed to create account. Please check your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <BrandLogo size="md" className="items-center" />
          <h2 className="text-2xl font-extrabold text-[#17191F] pt-2">
            {currentStep === 1 ? 'Claim Your Page' : 'Sign Up in 1 Click'}
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            {currentStep === 1
              ? 'Choose your username to secure your personal link.'
              : 'Connect with Gmail or a one-time link to see your dashboard.'}
          </p>
        </div>

        {/* 3-Step Visual Progress Indicator */}
        <div className="flex items-center justify-between text-xs font-bold text-gray-400 py-1 px-2 border-y border-gray-100">
          <div className={`flex items-center gap-1.5 ${currentStep === 1 ? 'text-[#F22550]' : 'text-emerald-600'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-extrabold ${currentStep === 1 ? 'bg-[#F22550]' : 'bg-emerald-600'}`}>
              {currentStep > 1 ? '✓' : '1'}
            </span>
            <span>Claim Page</span>
          </div>
          <span className="text-gray-300">──</span>
          <div className={`flex items-center gap-1.5 ${currentStep === 2 ? 'text-[#F22550]' : 'text-gray-400'}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-extrabold ${currentStep === 2 ? 'bg-[#F22550]' : 'bg-gray-300'}`}>
              2
            </span>
            <span>Sign Up</span>
          </div>
          <span className="text-gray-300">──</span>
          <div className="flex items-center gap-1.5 text-gray-400">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-extrabold bg-gray-300">
              3
            </span>
            <span>Dashboard</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* STEP 1: CLAIM PAGE */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Your Desired Username
              </label>
              <div className="relative rounded-2xl border-2 border-gray-200 focus-within:border-[#F22550] focus-within:ring-2 focus-within:ring-[#F22550]/15 overflow-hidden transition-all">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-gray-400 text-sm select-none">
                  buymedata.com/@
                </span>
                <input
                  type="text"
                  autoFocus
                  placeholder="yourname"
                  value={claimedUsername}
                  onChange={(e) => setClaimedUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full pl-36 pr-10 py-3 text-sm font-bold text-[#17191F] placeholder-gray-300 focus:outline-none"
                />
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
                  {checkingUsername && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
                  {!checkingUsername && usernameStatus === 'available' && (
                    <Check className="w-4 h-4 text-emerald-600" />
                  )}
                  {!checkingUsername && usernameStatus === 'taken' && (
                    <X className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>

              {usernameStatus === 'available' && (
                <p className="text-xs font-bold text-emerald-600 flex items-center gap-1 pt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>buymedata.com/@{claimedUsername} is available! 🎉</span>
                </p>
              )}
              {usernameStatus === 'taken' && (
                <p className="text-xs font-bold text-red-500 flex items-center gap-1 pt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>@{claimedUsername} is already taken. Try another.</span>
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleStep1Proceed}
              disabled={claimedUsername.length < 3 || usernameStatus === 'taken' || checkingUsername}
              className="w-full py-3.5 px-4 bg-[#F22550] hover:bg-[#D81A43] text-white font-extrabold text-sm rounded-2xl shadow-md shadow-[#F22550]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
            >
              <span>Claim @{claimedUsername || 'yourname'} & Proceed</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: SIGN UP WITH GMAIL OR ONE-TIME LINK */}
        {currentStep === 2 && (
          <div className="space-y-5">
            {/* Secured Username Badge */}
            <div className="p-3 bg-[#FFE6EA] rounded-2xl border border-[#FFCCD5] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F22550] animate-pulse" />
                <span className="text-xs font-bold text-[#17191F]">
                  Securing: <span className="text-[#F22550]">buymedata.com/@{claimedUsername}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-[11px] font-bold text-gray-500 hover:text-gray-900 underline"
              >
                Change
              </button>
            </div>

            {magicLinkSent ? (
              <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3 animate-in fade-in">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="font-extrabold text-base text-gray-900">Check Your Inbox!</h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  We sent a one-time sign-in link to <strong className="text-gray-900">{email}</strong>.
                  Click the link in your email to instantly see your dashboard.
                </p>
                <button
                  type="button"
                  onClick={() => setMagicLinkSent(false)}
                  className="text-xs font-bold text-[#F22550] hover:underline pt-2 block mx-auto"
                >
                  Use a different email or sign in with Google
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 1-Click Google / Gmail Signup */}
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleSignup}
                  className="w-full py-3.5 px-4 bg-white hover:bg-gray-50 text-gray-800 font-extrabold text-sm rounded-2xl border-2 border-gray-200 hover:border-gray-300 shadow-xs transition-all flex items-center justify-center gap-3 disabled:opacity-50 hover:scale-[1.01]"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                  ) : (
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Continue with Google (Gmail)</span>
                </button>

                <div className="relative flex items-center justify-center py-1">
                  <div className="border-t border-gray-200 w-full" />
                  <span className="bg-white px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider relative">
                    Or with Email
                  </span>
                </div>

                {/* One-Time Magic Link to Mail Form */}
                <form onSubmit={handleSendMagicLink} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="you@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#F22550] focus:ring-1 focus:ring-[#F22550]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full py-3 px-4 bg-gray-900 hover:bg-black text-white font-extrabold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span>Send One-Time Link to Email</span>
                  </button>
                </form>

                {/* Password signup toggle */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-800 underline"
                  >
                    {showPasswordForm ? 'Hide password sign up' : 'Or sign up with password'}
                  </button>
                </div>

                {showPasswordForm && (
                  <form onSubmit={handlePasswordSignup} className="space-y-3 pt-2 border-t border-gray-100 animate-in fade-in">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Full Name or Brand Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Samuel Ade"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#F22550]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Password (min 8 characters)
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3.5 py-2 pr-10 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#F22550]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-[#F22550] hover:bg-[#D81A43] text-white font-extrabold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <ArrowRight className="w-4 h-4" />}
                      <span>Create Account & See Dashboard</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}

        <div className="pt-2 text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link to="/auth/login" className="font-extrabold text-[#F22550] hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
