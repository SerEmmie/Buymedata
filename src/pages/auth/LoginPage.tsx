import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from '../../router';
import { useAuth } from '../../context/AuthContext';
import { loginWithEmail, loginWithGoogle, sendOneTimeEmailLink, completeEmailLinkSignIn } from '../../services/authService';
import { BrandLogo } from '../../components/ui/BrandLogo';
import { AlertCircle, Eye, EyeOff, Lock, Mail, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshProfiles } = useAuth();

  // Check if landing from an email link
  useEffect(() => {
    const handleEmailLinkOnLoad = async () => {
      const fullUrl = window.location.href;
      if (fullUrl.includes('apiKey=') || fullUrl.includes('mode=signIn')) {
        const storedEmail = window.localStorage.getItem('emailForSignIn') || '';
        const targetEmail = storedEmail || prompt('Please enter your email to complete sign in:');
        if (targetEmail) {
          try {
            setLoading(true);
            await completeEmailLinkSignIn(targetEmail);
            await refreshProfiles();
            navigate('/dashboard');
          } catch (err: unknown) {
            console.error('Email link completion error:', err);
            setErrorMsg('Unable to verify magic link. Please sign in with password or request a new link.');
          } finally {
            setLoading(false);
          }
        }
      }
    };
    handleEmailLinkOnLoad();
  }, [navigate, refreshProfiles]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      if (useMagicLink) {
        await sendOneTimeEmailLink(email);
        setMagicLinkSent(true);
      } else {
        await loginWithEmail(email, password);
        await refreshProfiles();
        navigate('/dashboard');
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      const code = err instanceof Error ? err.message : String(err);
      if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
        setErrorMsg('Invalid email or password. Please verify your credentials.');
      } else {
        setErrorMsg('Failed to sign in. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      await loginWithGoogle();
      await refreshProfiles();
      navigate('/dashboard');
    } catch (err: unknown) {
      console.error('Google login error:', err);
      setErrorMsg('Google sign-in was cancelled or encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F5F6F8]">
      <div className="max-w-md w-full space-y-7 bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <BrandLogo size="md" showSlogan={false} />
          </div>
          <h2 className="text-2xl font-black text-[#17191F] pt-2">Welcome back</h2>
          <p className="text-xs text-gray-500">Sign in to your creator dashboard and manage your support</p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2.5 border border-red-100">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {magicLinkSent ? (
          <div className="p-6 bg-[#FFE6EA] text-center rounded-2xl border border-[#FFCCD5] space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F22550] text-white flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[#17191F] text-base">Check your email</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              We just sent a one-time sign-in link to <strong className="text-[#17191F]">{email}</strong>. Click the link in your email to open your dashboard instantly.
            </p>
            <button
              type="button"
              onClick={() => { setMagicLinkSent(false); setUseMagicLink(false); }}
              className="text-xs text-[#F22550] font-bold hover:underline"
            >
              Back to regular password login
            </button>
          </div>
        ) : (
          <>
            {/* 1-Click Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-3 px-4 bg-white border-2 border-gray-200 hover:border-[#F22550] hover:bg-gray-50 text-gray-800 text-sm font-bold rounded-2xl transition-all shadow-sm flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
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
              <span>Continue with Google</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-4 text-xs text-gray-400 font-semibold uppercase tracking-wider">Or with email</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#F22550] focus:ring-2 focus:ring-[#FFE6EA]"
                  />
                </div>
              </div>

              {!useMagicLink ? (
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-gray-700">
                      Password
                    </label>
                    <Link
                      to="/auth/forgot-password"
                      className="text-xs text-[#F22550] hover:underline font-semibold"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-[#F22550] focus:ring-2 focus:ring-[#FFE6EA]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-[#FFE6EA]/60 rounded-xl text-xs text-gray-600 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F22550] flex-shrink-0" />
                  <span>We'll send a passwordless login link directly to your inbox.</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setUseMagicLink(!useMagicLink)}
                  className="text-xs text-gray-500 hover:text-[#F22550] font-medium"
                >
                  {useMagicLink ? 'Sign in with password instead' : 'Send me a magic link instead'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#F22550] hover:bg-[#D81A43] text-white font-bold text-sm rounded-2xl shadow-lg shadow-[#F22550]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Please wait...' : useMagicLink ? 'Send One-Time Link' : 'Sign In to Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}

        <div className="pt-2 text-center text-xs text-gray-500">
          New creator?{' '}
          <Link to="/auth/register" className="font-bold text-[#F22550] hover:underline">
            Claim your page now →
          </Link>
        </div>
      </div>
    </div>
  );
}
