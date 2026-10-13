import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, Sparkles, ArrowRight, Loader2, KeyRound, CheckCircle2 } from 'lucide-react';
import { signUpWithPassword, signInWithPassword, resetPassword, trackEvent, syncProfile } from '../lib/analytics';
import { cn } from '../lib/utils';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user?: SupabaseUser | null) => void;
  businessName?: string;
  reason?: 'limit_reached' | 'manual';
  initialMode?: 'signup' | 'login';
}

export default function AuthModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  businessName, 
  reason = 'manual',
  initialMode
}: AuthModalProps) {
  const [mode, setMode] = useState<'signup' | 'login' | 'forgot_password'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Set default mode based on reason or initialMode
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setResetSuccess(false);
      if (initialMode) {
        setMode(initialMode);
      } else if (reason === 'limit_reached') {
        setMode('signup');
      } else {
        setMode('login');
      }
    }
  }, [isOpen, reason, initialMode]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await signUpWithPassword(email.trim(), password);

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const createdUser = data?.user || null;
    if (createdUser && email) {
      await syncProfile(email.trim(), businessName);
      trackEvent('user_signed_up', { email: email.trim() });
    }

    setLoading(false);
    onSuccess(createdUser);
    onClose();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: loginError } = await signInWithPassword(email.trim(), password);

    if (loginError) {
      setError(loginError.message === 'Invalid login credentials' 
        ? 'Invalid email or password. Please try again.' 
        : loginError.message);
      setLoading(false);
      return;
    }

    const loggedInUser = data?.user || null;
    if (loggedInUser && email) {
      await syncProfile(email.trim(), businessName);
      trackEvent('login_completed', { email: email.trim() });
    }

    setLoading(false);
    onSuccess(loggedInUser);
    onClose();
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetErr } = await resetPassword(email.trim());

    if (resetErr) {
      setError(resetErr.message);
    } else {
      setResetSuccess(true);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden border border-slate-200"
        >
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                reason === 'limit_reached' && mode === 'signup' 
                  ? "bg-amber-50 text-amber-600" 
                  : "bg-blue-50 text-blue-600"
              )}>
                {reason === 'limit_reached' && mode === 'signup' ? (
                  <Sparkles size={24} />
                ) : mode === 'forgot_password' ? (
                  <KeyRound size={24} />
                ) : mode === 'signup' ? (
                  <Sparkles size={24} />
                ) : (
                  <Lock size={24} />
                )}
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Header Titles */}
            <div className="space-y-2">
              {reason === 'limit_reached' && mode === 'signup' ? (
                <>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                    You've created 5 documents 🎉
                  </h2>
                  <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">
                    Create your free Quick Receipt account to keep your documents saved and continue creating receipts and invoices.
                  </p>
                </>
              ) : mode === 'signup' ? (
                <>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                    Create Account
                  </h2>
                  <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">
                    Keep your receipts, invoices, and business profile safely stored in the cloud.
                  </p>
                </>
              ) : mode === 'login' ? (
                <>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                    Welcome Back
                  </h2>
                  <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">
                    Log in to access your saved receipts, invoices, and synced business profile.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                    Reset Password
                  </h2>
                  <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">
                    Enter your account email to receive a password reset link.
                  </p>
                </>
              )}
            </div>

            {error && (
              <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold leading-relaxed">
                {error}
              </div>
            )}

            {resetSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Password reset link sent! Please check your email inbox.</span>
              </div>
            )}

            {/* Signup Form */}
            {mode === 'signup' && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                  <div className="relative">
                    <input
                      autoFocus
                      required
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@business.com"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-slate-900 text-sm placeholder:text-slate-300"
                    />
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Choose Password</label>
                  <div className="relative">
                    <input
                      required
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-slate-900 text-sm placeholder:text-slate-300"
                    />
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Confirm Password</label>
                  <div className="relative">
                    <input
                      required
                      type="password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-slate-900 text-sm placeholder:text-slate-300"
                    />
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <button
                  disabled={loading}
                  type="submit"
                  className={cn(
                    "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2",
                    "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]",
                    loading && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('login');
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    Already have an account? <span className="text-blue-600 font-black">Log in</span>
                  </button>
                </div>
              </form>
            )}

            {/* Login Form */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                  <div className="relative">
                    <input
                      autoFocus
                      required
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@business.com"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-slate-900 text-sm placeholder:text-slate-300"
                    />
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setResetSuccess(false);
                        setMode('forgot_password');
                      }}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      required
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-slate-900 text-sm placeholder:text-slate-300"
                    />
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <button
                  disabled={loading}
                  type="submit"
                  className={cn(
                    "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2",
                    "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]",
                    loading && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <span>Log In</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('signup');
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    Don't have an account? <span className="text-blue-600 font-black">Create account</span>
                  </button>
                </div>
              </form>
            )}

            {/* Forgot Password Form */}
            {mode === 'forgot_password' && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                  <div className="relative">
                    <input
                      autoFocus
                      required
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@business.com"
                      className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-slate-900 text-sm placeholder:text-slate-300"
                    />
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <button
                  disabled={loading || resetSuccess}
                  type="submit"
                  className={cn(
                    "w-full py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2",
                    "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]",
                    (loading || resetSuccess) && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setMode('login');
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    Remember your password? <span className="text-blue-600 font-black">Back to Log in</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
