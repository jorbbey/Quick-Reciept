import React, { useState } from 'react';
import { 
  History, 
  LayoutTemplate, 
  Plus, 
  User, 
  Settings, 
  Receipt as ReceiptIcon, 
  FileText, 
  X 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface BottomNavProps {
  activeView: string;
  onNavigate: (view: 'dashboard' | 'templates' | 'profile' | 'settings') => void;
  onCreateReceipt: () => void;
  onCreateInvoice: () => void;
  themeColor?: string;
  hasUser?: boolean;
}

export default function BottomNav({
  activeView,
  onNavigate,
  onCreateReceipt,
  onCreateInvoice,
  themeColor = 'blue',
  hasUser = false
}: BottomNavProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const getThemeBg = () => {
    switch (themeColor) {
      case 'green': return 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/30';
      case 'purple': return 'bg-purple-600 hover:bg-purple-700 shadow-purple-500/30';
      case 'orange': return 'bg-orange-600 hover:bg-orange-700 shadow-orange-500/30';
      case 'red': return 'bg-red-600 hover:bg-red-700 shadow-red-500/30';
      case 'dark': return 'bg-slate-900 hover:bg-black shadow-slate-900/30';
      default: return 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30';
    }
  };

  const getThemeText = () => {
    switch (themeColor) {
      case 'green': return 'text-emerald-600';
      case 'purple': return 'text-purple-600';
      case 'orange': return 'text-orange-600';
      case 'red': return 'text-red-600';
      case 'dark': return 'text-slate-900';
      default: return 'text-blue-600';
    }
  };

  const isRecentActive = activeView === 'dashboard';
  const isTemplatesActive = activeView === 'templates';
  const isProfileActive = activeView === 'profile' || activeView === 'setup';
  const isSettingsActive = activeView === 'settings';

  return (
    <>
      {/* Create Quick Action Popover Sheet */}
      <AnimatePresence>
        {isCreateOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-40 transition-opacity"
            />

            {/* Quick Action Menu centered above the plus icon */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm bg-white rounded-3xl p-4 shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 px-1">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400">Create New</p>
                  <p className="text-sm font-bold text-slate-900">Choose Document Type</p>
                </div>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => {
                    setIsCreateOpen(false);
                    onCreateReceipt();
                  }}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 text-left transition-all group active:scale-97 flex flex-col gap-2.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                    <ReceiptIcon size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors block">
                      Receipt
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium leading-tight line-clamp-1">
                      Proof of purchase
                    </span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsCreateOpen(false);
                    onCreateInvoice();
                  }}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-indigo-50/70 border border-slate-200/80 hover:border-indigo-300 text-left transition-all group active:scale-97 flex flex-col gap-2.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                    <FileText size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors block">
                      Invoice
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium leading-tight line-clamp-1">
                      Billing & payment due
                    </span>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Fixed Bottom Dock Nav */}
      <nav 
        aria-label="Bottom Navigation"
        className="fixed bottom-0 inset-x-0 z-40 bg-white select-none shadow-none border-none outline-none mt-8"
        style={{ boxShadow: 'none', WebkitBoxShadow: 'none', filter: 'none' }}
      >
        {/* Top Edge with Damped / Concave Scoop for the Center Button (No top border line or box shadow) */}
        <div className="w-full relative h-[18px] flex items-end select-none">
          {/* Left flat section (no border/shadow) */}
          <div className="flex-1 h-0 border-none" />

          {/* Center SVG Notch (dips down into the dock, seamless pure white fill without stroke/shadow) */}
          <div className="w-[96px] h-[18px] shrink-0 relative overflow-visible">
            <svg 
              width="96" 
              height="18" 
              viewBox="0 0 96 18" 
              fill="none" 
              className="absolute top-0 left-0 w-full h-full"
              preserveAspectRatio="none"
              style={{ filter: 'none' }}
            >
              {/* White background fill seamlessly closing the dock body */}
              <path 
                d="M 0 0 C 22 0, 26 18, 48 18 C 70 18, 74 0, 96 0 L 96 18 L 0 18 Z" 
                fill="#FFFFFF" 
              />
            </svg>
          </div>

          {/* Right flat section (no border/shadow) */}
          <div className="flex-1 h-0 border-none" />
        </div>

        {/* Navigation Content Bar */}
        <div className="max-w-md mx-auto px-3 pt-1 pb-3 safe-bottom flex items-center justify-between relative">
          
          {/* 1. Recent */}
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            aria-label="Recent Documents"
            className={cn(
              "flex-1 flex items-center justify-center py-2.5 transition-all active:scale-95 cursor-pointer group",
              isRecentActive ? getThemeText() : "text-slate-400 hover:text-slate-600"
            )}
          >
            <div className="relative">
              <History size={22} strokeWidth={isRecentActive ? 2.5 : 2} />
              {isRecentActive && (
                <span className={cn("absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full", themeColor === 'green' ? 'bg-emerald-600' : themeColor === 'purple' ? 'bg-purple-600' : themeColor === 'orange' ? 'bg-orange-600' : themeColor === 'red' ? 'bg-red-600' : themeColor === 'dark' ? 'bg-slate-900' : 'bg-blue-600')} />
              )}
            </div>
          </button>

          {/* 2. Templates */}
          <button
            type="button"
            onClick={() => onNavigate('templates')}
            aria-label="Document Templates"
            className={cn(
              "flex-1 flex items-center justify-center py-2.5 transition-all active:scale-95 cursor-pointer group",
              isTemplatesActive ? getThemeText() : "text-slate-400 hover:text-slate-600"
            )}
          >
            <div className="relative">
              <LayoutTemplate size={22} strokeWidth={isTemplatesActive ? 2.5 : 2} />
              {isTemplatesActive && (
                <span className={cn("absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full", themeColor === 'green' ? 'bg-emerald-600' : themeColor === 'purple' ? 'bg-purple-600' : themeColor === 'orange' ? 'bg-orange-600' : themeColor === 'red' ? 'bg-red-600' : themeColor === 'dark' ? 'bg-slate-900' : 'bg-blue-600')} />
              )}
            </div>
          </button>

          {/* 3. The Plus Button (Center, joined into the dock damping notch, no text below) */}
          <div className="w-[84px] flex items-center justify-center relative -mt-[28px] shrink-0">
            {/* White joining collar that anchors the button flush into the dock */}
            <div className="p-1 rounded-full bg-white">
              <button
                type="button"
                onClick={() => setIsCreateOpen(!isCreateOpen)}
                className={cn(
                  "w-13 h-13 rounded-full text-white flex items-center justify-center shadow-lg transition-transform transform active:scale-90 hover:scale-105 cursor-pointer",
                  getThemeBg()
                )}
                title="Create Receipt or Invoice"
                aria-label="Create Document"
              >
                <motion.div
                  animate={{ rotate: isCreateOpen ? 45 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Plus size={26} strokeWidth={3} />
                </motion.div>
              </button>
            </div>
          </div>

          {/* 4. Profile */}
          <button
            type="button"
            onClick={() => onNavigate('profile')}
            aria-label="Business Profile"
            className={cn(
              "flex-1 flex items-center justify-center py-2.5 transition-all active:scale-95 cursor-pointer group",
              isProfileActive ? getThemeText() : "text-slate-400 hover:text-slate-600"
            )}
          >
            <div className="relative">
              <User size={22} strokeWidth={isProfileActive ? 2.5 : 2} />
              {hasUser && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full border border-white" />
              )}
              {isProfileActive && (
                <span className={cn("absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full", themeColor === 'green' ? 'bg-emerald-600' : themeColor === 'purple' ? 'bg-purple-600' : themeColor === 'orange' ? 'bg-orange-600' : themeColor === 'red' ? 'bg-red-600' : themeColor === 'dark' ? 'bg-slate-900' : 'bg-blue-600')} />
              )}
            </div>
          </button>

          {/* 5. Settings */}
          <button
            type="button"
            onClick={() => onNavigate('settings')}
            aria-label="Application Settings"
            className={cn(
              "flex-1 flex items-center justify-center py-2.5 transition-all active:scale-95 cursor-pointer group",
              isSettingsActive ? getThemeText() : "text-slate-400 hover:text-slate-600"
            )}
          >
            <div className="relative">
              <Settings size={22} strokeWidth={isSettingsActive ? 2.5 : 2} />
              {isSettingsActive && (
                <span className={cn("absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full", themeColor === 'green' ? 'bg-emerald-600' : themeColor === 'purple' ? 'bg-purple-600' : themeColor === 'orange' ? 'bg-orange-600' : themeColor === 'red' ? 'bg-red-600' : themeColor === 'dark' ? 'bg-slate-900' : 'bg-blue-600')} />
              )}
            </div>
          </button>

        </div>
      </nav>
    </>
  );
}
