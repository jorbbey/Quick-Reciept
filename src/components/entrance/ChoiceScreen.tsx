import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, UserCheck, ArrowRight, UserPlus, LogIn, Sparkles } from 'lucide-react';

interface ChoiceScreenProps {
  remainingAnonymousDocs: number;
  onContinueWithoutAccount: () => void;
  onCreateAccount: () => void;
  onSignIn: () => void;
  onBack: () => void;
}

export default function ChoiceScreen({
  remainingAnonymousDocs,
  onContinueWithoutAccount,
  onCreateAccount,
  onSignIn,
  onBack
}: ChoiceScreenProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between safe-top safe-bottom px-5 py-6 sm:py-8 max-w-lg mx-auto">
      {/* Top Bar with back button */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center -ml-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Choose How to Continue
        </span>
        <div className="w-9" />
      </div>

      {/* Main Choice Cards */}
      <div className="my-auto py-4 space-y-6">
        <div className="space-y-1.5 text-center">
          <h2 className="text-2xl font-black text-slate-950 tracking-tight">
            How would you like to start?
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm">
            Try creating receipts right away or set up an account to save across devices.
          </p>
        </div>

        <div className="space-y-3.5">
          {/* Option 1: Continue without an account */}
          <motion.button
            whileTap={{ scale: 0.985 }}
            onClick={onContinueWithoutAccount}
            className="w-full text-left p-4.5 bg-white border border-slate-200 hover:border-blue-400 rounded-2xl transition-all flex items-start gap-3.5 group cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ZapIcon />
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                  Continue without an account
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0">
                  Instant
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-snug">
                Jump straight to creating documents immediately. Store up to {remainingAnonymousDocs} records on this device for free.
              </p>
            </div>
          </motion.button>

          {/* Option 2: Create a free account */}
          <motion.button
            whileTap={{ scale: 0.985 }}
            onClick={onCreateAccount}
            className="w-full text-left p-4.5 bg-white border-2 border-slate-900 hover:bg-slate-900/5 rounded-2xl transition-all flex items-start gap-3.5 group cursor-pointer relative"
          >
            <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 mt-0.5">
              <UserPlus size={20} />
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-slate-950">
                  Create a free account
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md shrink-0">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-snug">
                Preserve receipts & invoices, access them on any phone or computer, and back up your business profile.
              </p>
            </div>
          </motion.button>

          {/* Option 3: Sign in */}
          <motion.button
            whileTap={{ scale: 0.985 }}
            onClick={onSignIn}
            className="w-full text-left p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl transition-all flex items-center gap-3.5 group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <LogIn size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black text-slate-900">
                I already have an account
              </div>
              <p className="text-[11px] text-slate-500">
                Sign in with your email and password
              </p>
            </div>
            <ArrowRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </motion.button>
        </div>
      </div>

      {/* Footer Assurance */}
      <div className="pt-2 text-center">
        <p className="text-[11px] text-slate-400 font-medium">
          No credit card required · Free to get started
        </p>
      </div>
    </div>
  );
}

function ZapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
