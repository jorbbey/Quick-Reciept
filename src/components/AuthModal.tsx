import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, ShieldCheck, ArrowRight, Loader2 } from 'lucide-react';
import { signInWithEmail, verifyOTP, trackEvent, syncProfile } from '../lib/analytics';
import { cn } from '../lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  businessName?: string;
}

export default function AuthModal({ isOpen, onClose, onSuccess, businessName }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await signInWithEmail(email);
    
    if (error) {
      setError(error.message);
    } else {
      setStep('otp');
    }
    setLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await verifyOTP(email, otp);
    
    if (error) {
      setError(error.message);
    } else {
      await syncProfile(email, businessName);
      trackEvent('login_completed', { email });
      onSuccess();
      onClose();
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200"
        >
          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                {step === 'email' ? (
                  <Mail className="text-blue-600" size={24} />
                ) : (
                  <ShieldCheck className="text-blue-600" size={24} />
                )}
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                {step === 'email' ? 'Save to Cloud' : 'Verify Identity'}
              </h2>
              <p className="text-slate-500 text-sm font-medium">
                {step === 'email' 
                  ? 'Sign in with your email to sync and restore your receipts across all devices.' 
                  : `We've sent a 6-digit code to ${email}`}
              </p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold uppercase tracking-wider">
                {error}
              </div>
            )}

            <form onSubmit={step === 'email' ? handleSendOTP : handleVerifyOTP} className="space-y-4">
              {step === 'email' ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                  <input
                    autoFocus
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Verification Code</label>
                  <input
                    autoFocus
                    required
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-black text-center text-2xl tracking-[0.5em] text-slate-900 placeholder:text-slate-200"
                  />
                </div>
              )}

              <button
                disabled={loading}
                type="submit"
                className={cn(
                  "w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                  "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]",
                  loading && "opacity-70 cursor-not-allowed"
                )}
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <span>{step === 'email' ? 'Send Code' : 'Verify & Continue'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

  
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
