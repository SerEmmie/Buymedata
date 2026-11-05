import React, { useState } from 'react';
import { Link } from '../../router';
import { resetPassword } from '../../services/authService';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch (err: unknown) {
      console.error('Password reset error:', err);
      setErrorMsg('Failed to send reset email. Please ensure the email address is valid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#6741D9] text-white flex items-center justify-center font-bold">
              B
            </div>
            <span className="font-extrabold text-xl text-gray-900">
              BuyMe<span className="text-[#6741D9]">Data</span>
            </span>
          </Link>
          <h2 className="text-xl font-bold text-gray-900 pt-1">Reset your password</h2>
          <p className="text-xs text-gray-500">
            Enter your email and we'll send you instructions to reset your account password.
          </p>
        </div>

        {submitted ? (
          <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-900 text-sm">Reset link dispatched!</h4>
            <p className="text-xs text-gray-600">
              Check your inbox at <span className="font-semibold text-gray-800">{email}</span> for instructions to reset your password.
            </p>
            <div className="pt-2">
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6741D9] hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Account Email
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#6741D9] hover:bg-[#5633C4] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Sending link...' : 'Send Reset Link'}</span>
            </button>

            <div className="text-center pt-2">
              <Link
                to="/auth/login"
                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
