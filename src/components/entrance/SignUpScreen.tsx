import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { signUpWithPassword, syncProfile, trackEvent } from '../../lib/analytics';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import qIcon from '../../assets/q-icon.png';

interface SignUpScreenProps {
  onSuccess: (user: SupabaseUser | null) => void;
  onNavigateToSignIn: () => void;
  onBack: () => void;
  businessName?: string;
}

export default function SignUpScreen({
  onSuccess,
  onNavigateToSignIn,
  onBack,
  businessName
}: SignUpScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password.');
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await signUpWithPassword(trimmedEmail, password);

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      const createdUser = data?.user || null;
      if (createdUser) {
        await syncProfile(trimmedEmail, businessName);
        trackEvent('user_signed_up_entrance', { email: trimmedEmail });
      }

      setLoading(false);
      onSuccess(createdUser);
    } catch (err: any) {
      setError(err?.message || 'Network error occurred. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between safe-top safe-bottom px-6 py-5 sm:py-6 max-w-md mx-auto select-none">
      {/* Top Bar: Back Arrow on Left, Centered Logo Badge + Quick Receipt Brand */}
      <header className="relative flex items-center justify-between w-full pt-1 pb-3">
        <button
          type="button"
          onClick={onBack}
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

        {/* Right placeholder to keep brand centered */}
        <div className="w-8" aria-hidden="true" />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-start pt-6 sm:pt-8 w-full">
        {/* Title & Subtitle */}
        <div className="text-left">
          <h1 className="text-[26px] sm:text-[28px] font-extrabold text-[#0A192F] tracking-tight">
            Create your account
          </h1>
          <p className="text-[#5A6882] text-[14px] sm:text-[14.5px] leading-relaxed mt-1.5">
            An account helps you keep your documents<br />
            safe and accessible anytime.
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

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} className="mt-6 sm:mt-7 space-y-4">
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
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

          {/* Confirm password */}
          <div>
            <label className="block text-[13.5px] font-semibold text-[#1E293B] mb-1.5">
              Confirm password
            </label>
            <div className="relative flex items-center">
              <Lock
                size={18}
                className="absolute left-3.5 text-[#64748B] pointer-events-none"
              />
              <input
                required
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                disabled={loading}
                className="w-full pl-10 pr-11 py-3.5 bg-white border border-[#DCE4EC] rounded-2xl text-[14px] font-medium text-[#0A192F] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1E6BFF] focus:ring-2 focus:ring-[#1E6BFF]/15 transition-all disabled:bg-slate-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 text-[#64748B] hover:text-[#0A192F] p-1 flex items-center justify-center cursor-pointer"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Create Account Button */}
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
                <span>Create Account</span>
              )}
            </motion.button>
          </div>
        </form>
      </main>

      {/* Bottom Footer: Already have an account? Sign in */}
      <footer className="text-center pt-6 pb-2">
        <span className="text-[13.5px] text-[#5A6882]">
          Already have an account?{' '}
        </span>
        <button
          type="button"
          onClick={onNavigateToSignIn}
          className="text-[13.5px] font-bold text-[#1E6BFF] hover:underline cursor-pointer"
        >
          Sign in
        </button>
      </footer>
    </div>
  );
}
