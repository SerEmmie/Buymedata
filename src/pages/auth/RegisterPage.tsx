import React, { useState } from 'react';
import { Link, useNavigate } from '../../router';
import { useAuth } from '../../context/AuthContext';
import { registerWithEmail, loginWithGoogle } from '../../services/authService';
import { checkUsernameAvailability } from '../../services/creatorService';
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
} from 'lucide-react';

export function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { refreshProfiles } = useAuth();

  const handleUsernameBlur = async () => {
    const clean = username.toLowerCase().trim();
    if (!clean || clean.length < 3) {
      setUsernameStatus('idle');
      return;
    }
    setUsernameStatus('checking');
    const isAvail = await checkUsernameAvailability(clean);
    setUsernameStatus(isAvail ? 'available' : 'taken');
  };

  // Password strength
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getPasswordStrength();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (usernameStatus === 'taken') {
      setErrorMsg('This username is already taken. Please choose another.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }
    if (!termsAccepted) {
      setErrorMsg('You must agree to the Terms of Service to register.');
      return;
    }

    setLoading(true);

    try {
      await registerWithEmail(fullName, email, password, username, 'creator');
      await refreshProfiles();
      navigate('/onboarding');
    } catch (err: unknown) {
      console.error('Registration error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('email-already-in-use')) {
        setErrorMsg('An account with this email address already exists. Please log in.');
      } else {
        setErrorMsg(msg || 'Failed to create account. Please check your details.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await loginWithGoogle();
      await refreshProfiles();
      navigate('/onboarding');
    } catch (err) {
      console.error('Google signup error:', err);
      setErrorMsg('Google sign up was cancelled or encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#6741D9] text-white flex items-center justify-center font-bold text-lg">
              B
            </div>
            <span className="font-extrabold text-2xl text-gray-900">
              BuyMe<span className="text-[#6741D9]">Data</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-gray-900 pt-1">Create your creator page</h2>
          <p className="text-xs text-gray-500">Receive support and fundraise directly from your community</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-3.5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. Samuel Adekunle"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9] focus:ring-1 focus:ring-[#6741D9]"
              />
            </div>
          </div>

          {/* Email */}
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
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9] focus:ring-1 focus:ring-[#6741D9]"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-gray-700">
                Choose Username (your public link)
              </label>
              {usernameStatus === 'available' && (
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Available
                </span>
              )}
              {usernameStatus === 'taken' && (
                <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-0.5">
                  <X className="w-3 h-3" /> Unavailable
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-semibold text-gray-400">
                buymedata.com/
              </span>
              <input
                type="text"
                required
                placeholder="yourhandle"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                  setUsernameStatus('idle');
                }}
                onBlur={handleUsernameBlur}
                className="w-full pl-28 pr-4 py-2.5 text-xs font-semibold rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9] focus:ring-1 focus:ring-[#6741D9]"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9] focus:ring-1 focus:ring-[#6741D9]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength bar */}
            {password && (
              <div className="mt-1.5 flex gap-1">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      strength >= step
                        ? strength <= 2
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                        : 'bg-gray-100'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-[#6741D9] focus:ring-1 focus:ring-[#6741D9]"
              />
            </div>
          </div>

          {/* Terms checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2 cursor-pointer text-xs text-gray-600">
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded text-[#6741D9] focus:ring-[#6741D9] w-4 h-4"
              />
              <span>
                I agree to the{' '}
                <Link to="/terms" target="_blank" className="text-[#6741D9] underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" target="_blank" className="text-[#6741D9] underline">
                  Privacy Policy
                </Link>.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#6741D9] hover:bg-[#5633C4] text-white font-bold text-xs rounded-xl shadow-md shadow-[#6741D9]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Creating account...' : 'Create My Page'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink mx-4 text-xs text-gray-400 font-semibold uppercase">Or continue with</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        {/* Google Signup */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2.5"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Sign up with Google</span>
        </button>

        <p className="text-center text-xs text-gray-500">
          Already have an account?{' '}
          <Link to="/auth/login" className="font-bold text-[#6741D9] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
