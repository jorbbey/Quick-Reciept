import React from 'react';
import { motion } from 'motion/react';
import welcomeIllustration from '../../assets/welcome screen illustration.png';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onAlreadyHaveAccount: () => void;
}

export default function WelcomeScreen({
  onGetStarted,
  onAlreadyHaveAccount
}: WelcomeScreenProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between safe-top safe-bottom px-5 sm:px-6 pt-6 sm:pt-8 pb-5 sm:pb-7 max-w-md mx-auto relative overflow-hidden select-none">
      {/* Decorative Organic Brand Background Arcs */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 390 844"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 0 0 L 0 220 C 50 210, 125 160, 165 100 C 195 58, 210 20, 215 0 Z"
          fill="#EBF3FD"
        />
        <path
          d="M 390 844 L 390 610 C 345 640, 290 710, 280 775 C 275 810, 275 844, 275 844 Z"
          fill="#EBF3FD"
        />
      </svg>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex flex-col justify-between items-start w-full">
        {/* Left-aligned text in 3 lines with 'in minutes.' in blue */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="w-full text-left space-y-3 pt-6 sm:pt-8 px-1 mb-2"
        >
          <h1 className="text-[28px] sm:text-[32px] font-black text-[#0A192F] tracking-tight leading-[1.22] text-left">
            <span>Create professional</span>
            <br />
            <span>receipts and invoices</span>
            <br />
            <span className="text-[#1E6BFF]">in minutes.</span>
          </h1>
          <p className="text-[#5A6882] text-[14px] sm:text-[15px] leading-relaxed text-left max-w-xs sm:max-w-sm">
            Create, customize, save, and share business documents wherever you are.
          </p>
        </motion.div>

        {/* Illustration Image: significantly enlarged to almost full page in width, flushing into the Get Started button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, duration: 0.4, ease: 'easeOut' }}
          className="w-full flex-1 flex items-end justify-center -mx-2 sm:-mx-3 -mb-3 sm:-mb-4 px-0 relative z-10"
        >
          <img
            src={welcomeIllustration}
            alt="Quick Receipt Illustration"
            className="w-full max-w-[390px] sm:max-w-[420px] max-h-[52vh] sm:max-h-[460px] h-auto object-contain drop-shadow-sm select-none pointer-events-none"
            draggable={false}
          />
        </motion.div>
      </main>

      {/* Action Buttons: Blue 'Get Started' and Blue-Outlined 'I already have an account' */}
      <footer className="relative z-20 w-full space-y-3 pt-1 pb-1">
        {/* Primary Blue Button */}
        <motion.button
          whileTap={{ scale: 0.985 }}
          onClick={onGetStarted}
          className="w-full min-h-[54px] bg-[#1E6BFF] hover:bg-[#1658DB] active:bg-[#1147B5] text-white font-bold text-base rounded-2xl flex items-center justify-center shadow-[0_4px_16px_rgba(30,107,255,0.28)] transition-all cursor-pointer"
        >
          <span>Get Started</span>
        </motion.button>

        {/* Outline Button with Blue Border & Blue Text */}
        <motion.button
          whileTap={{ scale: 0.985 }}
          onClick={onAlreadyHaveAccount}
          className="w-full min-h-[52px] bg-white hover:bg-blue-50/50 active:bg-blue-50 border-2 border-[#1E6BFF] text-[#1E6BFF] font-bold text-base rounded-2xl flex items-center justify-center transition-all cursor-pointer"
        >
          <span>I already have an account</span>
        </motion.button>
      </footer>
    </div>
  );
}
