import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { signInWithPassword, resetPassword, trackEvent } from '../../lib/analytics';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import qIcon from '../../assets/q-icon.png';

interface SignInScreenProps {
  onSuccess: (user: SupabaseUser | null) => void;
  onNavigateToSignUp: () => void;
  onBack: () => void;
}

export default function SignInScreen({
  onSuccess,
  onNavigateToSignUp,
  onBack
}: SignInScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password reset sub-view state
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signInError } = await signInWithPassword(trimmedEmail, password);

      if (signInError) {
        setError(
          signInError.message === 'Invalid login credentials'
            ? 'Invalid email or password. Please verify your details.'
            : signInError.message
        );
        setLoading(false);
        return;
      }

      const loggedInUser = data?.user || null;
      if (loggedInUser) {
        trackEvent('user_signed_in_entrance', { email: trimmedEmail });
      }

      setLoading(false);
      onSuccess(loggedInUser);
    } catch (err: any) {
      setError(err?.message || 'Network error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(false);

    const targetEmail = resetEmail.trim() || email.trim();
    if (!targetEmail) {
      setResetError('Please enter your account email address.');
      return;
    }

    setResetLoading(true);
    try {
      const { error: rErr } = await resetPassword(targetEmail);
      if (rErr) {
        setResetError(rErr.message);
      } else {
        setResetSuccess(true);
      }
    } catch (err: any) {
      setResetError(err?.message || 'Failed to send password reset request.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between safe-top safe-bottom px-6 py-5 sm:py-6 max-w-md mx-auto select-none">
      {/* Top Bar: Back Arrow on Left, Centered Logo Badge + Quick Receipt Brand */}
      <header className="relative flex items-center justify-between w-full pt-1 pb-3">
        <button
          type="button"
          onClick={() => {
            if (isResetMode) {
              setIsResetMode(false);
              setResetError(null);
              setResetSuccess(false);
            } else {
              onBack();
            }
          }}
          className="p-2 -ml-2 text-[#0A192F] hover:text-[#1E6BFF] transition-colors rounded-xl flex items-center justify-center cursor-pointer"
          aria-label="Back"
        >
          <ArrowLeft size={22} strokeWidth={2.2} />
        </button>

        {/* Center Brand Mark */}
        <div className="flex items-center gap-2">
          <img
            src={qIcon}
            alt="Quick Receipt"
            className="w-7 h-7 object-contain"
            draggable={false}
          />
          <span className="font-bold text-[16px] tracking-tight">
            <span className="text-[#0A192F]">Quick</span>{' '}
            <span className="text-[#1E6BFF]">Receipt</span>
          </span>
        </div>

        {/* Right placeholder to keep brand perfectly centered */}
        <div className="w-8" aria-hidden="true" />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-start pt-6 sm:pt-8 w-full">
        {!isResetMode ? (
          <>
            {/* Title & Subtitle */}
            <div className="text-left">
              <h1 className="text-[26px] sm:text-[28px] font-extrabold text-[#0A192F] tracking-tight">
                Welcome back
              </h1>
              <p className="text-[#5A6882] text-[14px] sm:text-[14.5px] leading-relaxed mt-1.5">
                Sign in to access your documents and<br />
                continue where you left off.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold flex items-start gap-2.5"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSignIn} className="mt-6 sm:mt-7 space-y-4">
              {/* Email address */}
              <div>
                <label className="block text-[13.5px] font-semibold text-[#1E293B] mb-1.5">
                  Email address
                </label>
                <div className="relative flex items-center">
                  <Mail
                    size={18}
                    className="absolute left-3.5 text-[#64748B] pointer-events-none"
                  />
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={loading}
                    className="w-full pl-10 pr-4 py-3.5 bg-white border border-[#DCE4EC] rounded-2xl text-[14px] font-medium text-[#0A192F] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1E6BFF] focus:ring-2 focus:ring-[#1E6BFF]/15 transition-all disabled:bg-slate-50"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[13.5px] font-semibold text-[#1E293B] mb-1.5">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock
                    size={18}
                    className="absolute left-3.5 text-[#64748B] pointer-events-none"
                  />
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={loading}
                    className="w-full pl-10 pr-11 py-3.5 bg-white border border-[#DCE4EC] rounded-2xl text-[14px] font-medium text-[#0A192F] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1E6BFF] focus:ring-2 focus:ring-[#1E6BFF]/15 transition-all disabled:bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-[#64748B] hover:text-[#0A192F] p-1 flex items-center justify-center cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Forgot your password? link */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail(email);
                    setIsResetMode(true);
                    setError(null);
                  }}
                  className="text-[13px] font-semibold text-[#1E6BFF] underline underline-offset-2 hover:text-[#1658DB] transition-colors cursor-pointer"
                >
                  Forgot your password?
                </button>
              </div>

              {/* Sign In Button */}
              <div className="pt-4 sm:pt-6">
                <motion.button
                  whileTap={{ scale: 0.985 }}
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[52px] bg-[#1E6BFF] hover:bg-[#1658DB] active:bg-[#1147B5] disabled:bg-[#1E6BFF]/60 text-white font-bold text-base rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(30,107,255,0.25)] transition-all cursor-pointer"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <span>Sign In</span>
                  )}
                </motion.button>
              </div>
            </form>
          </>
        ) : (
          /* Password Reset Sub-flow */
          <div className="text-left space-y-4">
            <div>
              <h1 className="text-[26px] sm:text-[28px] font-extrabold text-[#0A192F] tracking-tight">
                Reset your password
              </h1>
              <p className="text-[#5A6882] text-[14px] sm:text-[14.5px] leading-relaxed mt-1.5">
                Enter your account email and we will send you a password reset link.
              </p>
            </div>

            {resetError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-semibold flex items-start gap-2.5"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{resetError}</span>
              </motion.div>
            )}

            {resetSuccess ? (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl text-[#0A192F] text-xs font-medium space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-[#1E6BFF]">
                  <CheckCircle2 size={18} />
                  <span>Reset link sent!</span>
                </div>
                <p className="text-[#5A6882] leading-relaxed">
                  Please check your email inbox and spam folder. Click the link in the message to reset your password.
                </p>
                <button
                  type="button"
                  onClick={() => setIsResetMode(false)}
                  className="mt-2 text-xs font-bold text-[#1E6BFF] underline cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
                <div>
                  <label className="block text-[13.5px] font-semibold text-[#1E293B] mb-1.5">
                    Email address
                  </label>
                  <div className="relative flex items-center">
                    <Mail
                      size={18}
                      className="absolute left-3.5 text-[#64748B] pointer-events-none"
                    />
                    <input
                      required
                      type="email"
                      autoComplete="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="you@example.com"
                      disabled={resetLoading}
                      className="w-full pl-10 pr-4 py-3.5 bg-white border border-[#DCE4EC] rounded-2xl text-[14px] font-medium text-[#0A192F] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1E6BFF] focus:ring-2 focus:ring-[#1E6BFF]/15 transition-all"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <motion.button
                    whileTap={{ scale: 0.985 }}
                    type="submit"
                    disabled={resetLoading}
                    className="w-full min-h-[52px] bg-[#1E6BFF] hover:bg-[#1658DB] active:bg-[#1147B5] disabled:bg-[#1E6BFF]/60 text-white font-bold text-base rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(30,107,255,0.25)] transition-all cursor-pointer"
                  >
                    {resetLoading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <span>Send Reset Link</span>
                    )}
                  </motion.button>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsResetMode(false)}
                    className="text-xs font-semibold text-[#5A6882] hover:text-[#0A192F] cursor-pointer"
                  >
                    Cancel and return to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>

      {/* Bottom Footer: Don't have an account? Create one */}
      {!isResetMode && (
        <footer className="text-center pt-6 pb-2">
          <span className="text-[13.5px] text-[#5A6882]">
            Don't have an account?{' '}
          </span>
          <button
            type="button"
            onClick={onNavigateToSignUp}
            className="text-[13.5px] font-bold text-[#1E6BFF] hover:underline cursor-pointer"
          >
            Create one
          </button>
        </footer>
      )}
    </div>
  );
}
