import React from 'react';
import { motion } from 'motion/react';
import { RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import qLogo from '../../assets/q-logo.jpeg';

interface SplashScreenProps {
  onRetry?: () => void;
  errorMessage?: string | null;
  onContinueOffline?: () => void;
}

export default function SplashScreen({
  onRetry,
  errorMessage,
  onContinueOffline,
}: SplashScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white overflow-hidden select-none">
      {/* Decorative Organic Corner Shapes matching splash screen.png */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 390 844"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top-Left Pastel Sky-Blue Curved Arc */}
        <path
          d="M 0 0 L 0 230 C 55 220, 130 170, 175 105 C 205 60, 220 20, 225 0 Z"
          fill="#EBF3FD"
        />
        {/* Bottom-Right Pastel Sky-Blue Curved Arc */}
        <path
          d="M 390 844 L 390 595 C 340 625, 285 695, 275 765 C 270 805, 270 844, 270 844 Z"
          fill="#EBF3FD"
        />
      </svg>

      {/* Center Branding Area */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-sm px-6 -mt-8 sm:-mt-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center"
        >
          {/* Quick Receipt Logo */}
          <img
            src={qLogo}
            alt="Quick Receipt"
            className="w-[205px] sm:w-[225px] max-w-[82vw] h-auto object-contain select-none mix-blend-multiply"
            draggable={false}
          />

          {/* Accent Line / Blue Dash */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.15, duration: 0.3 }}
            className="w-7 h-[3px] bg-[#1E6BFF] rounded-full mt-3.5 mb-3.5"
          />

          {/* Tagline */}
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="text-center"
          >
            <p className="text-[14.5px] sm:text-[15px] font-medium text-[#4A5874] leading-[1.45] tracking-[-0.01em]">
              Create receipts in seconds.
              <br />
              Share instantly.
            </p>
          </motion.div>
        </motion.div>

        {/* Circular Loading Spinner / Error Recovery */}
        <div className="mt-14 sm:mt-16 min-h-[48px] flex items-center justify-center">
          {errorMessage ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center gap-3 p-4 bg-red-50/90 border border-red-200 rounded-2xl text-center max-w-xs"
            >
              <div className="flex items-center gap-2 text-red-700 text-xs font-semibold">
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 active:scale-95 transition-all"
                  >
                    <RefreshCw size={12} />
                    <span>Retry</span>
                  </button>
                )}
                {onContinueOffline && (
                  <button
                    onClick={onContinueOffline}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 active:scale-95 transition-all"
                  >
                    <span>Continue</span>
                    <ArrowRight size={12} />
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.25 }}
              className="w-8 h-8 rounded-full border-[3px] border-[#D9E8FC] border-t-[#1E6BFF] border-r-[#1E6BFF] animate-spin"
            />
          )}
        </div>
      </div>
    </div>
  );
}
