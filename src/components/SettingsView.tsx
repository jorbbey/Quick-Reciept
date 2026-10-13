import React, { useState } from 'react';
import { 
  Palette, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  LogOut, 
  ShieldAlert, 
  DownloadCloud, 
  Database, 
  UserCheck, 
  Loader2, 
  Sparkles,
  Sliders,
  ExternalLink
} from 'lucide-react';
import { BusinessInfo, Receipt, Invoice } from '../types';
import { updatePassword } from '../lib/analytics';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import JSZip from 'jszip';

interface SettingsViewProps {
  businessInfo: BusinessInfo | null;
  onUpdateThemeColor: (color: BusinessInfo['themeColor']) => void;
  user: SupabaseUser | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  receipts: Receipt[];
  invoices: Invoice[];
}

export default function SettingsView({
  businessInfo,
  onUpdateThemeColor,
  user,
  onOpenAuth,
  onSignOut,
  receipts,
  invoices
}: SettingsViewProps) {
  // Theme state
  const selectedTheme = businessInfo?.themeColor || 'blue';

  // Password change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Export / Backup loading state
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);

  const themeColors: { id: BusinessInfo['themeColor']; label: string; bgClass: string; hex: string }[] = [
    { id: 'blue', label: 'Classic Blue', bgClass: 'bg-blue-600', hex: '#2563eb' },
    { id: 'green', label: 'Emerald Green', bgClass: 'bg-emerald-600', hex: '#10b981' },
    { id: 'purple', label: 'Vibrant Purple', bgClass: 'bg-purple-600', hex: '#a855f7' },
    { id: 'orange', label: 'Warm Orange', bgClass: 'bg-orange-600', hex: '#f97316' },
    { id: 'red', label: 'Crimson Red', bgClass: 'bg-red-600', hex: '#dc2626' },
    { id: 'dark', label: 'Midnight Dark', bgClass: 'bg-slate-900', hex: '#0f172a' },
  ];

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match. Please verify both fields.');
      return;
    }

    setPasswordLoading(true);
    const { error } = await updatePassword(newPassword);

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmNewPassword('');
    }
    setPasswordLoading(false);
  };

  const handleBackupAll = async () => {
    setIsBackingUp(true);
    try {
      const zip = new JSZip();
      const backupPayload = {
        business: businessInfo,
        receipts,
        invoices,
        exportDate: new Date().toISOString(),
        version: '2.0.0'
      };

      zip.file('quick_receipt_backup.json', JSON.stringify(backupPayload, null, 2));

      // Human-readable summary manifest
      const receiptsSummary = receipts.map(r => `[RECEIPT] ${r.id} | ${r.customerName} | ${businessInfo?.currency || '₦'}${r.total} | ${r.createdAt}`).join('\n');
      const invoicesSummary = invoices.map(inv => `[INVOICE] ${inv.invoiceNumber || inv.id} | ${inv.customerName} | ${businessInfo?.currency || '₦'}${inv.total} | Due: ${inv.dueDate} | Status: ${inv.status}`).join('\n');
      
      const textManifest = `QUICK RECEIPT DOCUMENT BACKUP ARCHIVE
Business: ${businessInfo?.name || 'Quick Receipt Business'}
Exported On: ${new Date().toLocaleString()}

Total Receipts: ${receipts.length}
Total Invoices: ${invoices.length}

=== RECEIPTS ===
${receiptsSummary || 'No receipts'}

=== INVOICES ===
${invoicesSummary || 'No invoices'}
`;

      zip.file('documents_manifest.txt', textManifest);

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      const dateStr = new Date().toISOString().split('T')[0];
      link.download = `quick-receipt-backup-${dateStr}.zip`;
      link.click();

      setBackupSuccess(true);
      setTimeout(() => setBackupSuccess(false), 3000);
    } catch (err) {
      console.error('Backup generation failed', err);
    } finally {
      setIsBackingUp(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* 1. Theme Color Change */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Theme Color</h3>
          </div>
          <span className="text-[11px] font-bold text-slate-400 capitalize">
            {themeColors.find(t => t.id === selectedTheme)?.label}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          This color accents your receipts, invoices, buttons, and mobile navigation bar.
        </p>

        {/* Color Palette Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 pt-1">
          {themeColors.map((color) => {
            const isSelected = selectedTheme === color.id;
            return (
              <button
                key={color.id}
                type="button"
                onClick={() => onUpdateThemeColor(color.id)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-50/50 shadow-xs scale-102 ring-2 ring-blue-600/20' 
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full ${color.bgClass} flex items-center justify-center shadow-xs transition-transform`}>
                  {isSelected && (
                    <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  )}
                </div>
                <span className={`text-[10px] font-bold truncate max-w-full ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                  {color.label.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Color Accent Preview Card */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded-full shrink-0 shadow-xs" 
              style={{ backgroundColor: themeColors.find(t => t.id === selectedTheme)?.hex }} 
            />
            <span className="text-xs font-bold text-slate-700">Preview Accent Applied</span>
          </div>
          <span 
            className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md text-white"
            style={{ backgroundColor: themeColors.find(t => t.id === selectedTheme)?.hex }}
          >
            Sample Badge
          </span>
        </div>
      </div>

      {/* 2. Email, Password, and Account Security */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <KeyRound size={16} className="text-blue-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Account & Security</h3>
        </div>

        {user ? (
          <div className="space-y-4">
            {/* User Info Card */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                  <UserCheck size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{user.email}</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[9px] font-black uppercase tracking-wider">
                      Synced
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    Cloud account active • Real-time sync enabled
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  {showPasswordChange ? 'Hide Form' : 'Change Password'}
                </button>

                <button
                  type="button"
                  onClick={onSignOut}
                  className="px-3.5 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Change Password Form */}
            {showPasswordChange && (
              <form onSubmit={handlePasswordSubmit} className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Update Account Password
                </p>

                {passwordError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-bold">
                    {passwordError}
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Password updated successfully!</span>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">New Password</label>
                    <div className="relative">
                      <input
                        required
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confirm Password</label>
                    <div className="relative">
                      <input
                        required
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="Re-type new password"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                      />
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {passwordLoading ? (
                    <Loader2 className="animate-spin" size={14} />
                  ) : (
                    <KeyRound size={14} />
                  )}
                  <span>Save New Password</span>
                </button>
              </form>
            )}
          </div>
        ) : (
          /* Guest / Not logged in State */
          <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 text-white rounded-xl shrink-0">
                <Database size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Sign in to sync your business across devices</p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Create an account to safeguard your receipts and access them from anywhere.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenAuth}
              className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 active:scale-95"
            >
              Sign In / Create Account
            </button>
          </div>
        )}
      </div>

      {/* 3. Data Advisory & Storage */}
      <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert size={16} className="text-amber-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Data Advisory</h3>
        </div>

        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row gap-4">
          <div className="bg-amber-100 p-2.5 rounded-xl shrink-0 h-fit w-fit">
            <ShieldAlert className="text-amber-700" size={20} />
          </div>
          <div className="flex-1 space-y-2">
            <p className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Local Storage Advisory
            </p>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              Quick Receipt caches your documents in your local device browser storage and automatically backs them up to your cloud profile when connected.
              <span className="font-bold"> Clearing your browser data or browsing in incognito mode without signing in will delete unsynced records.</span>
            </p>

            {backupSuccess && (
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Backup zip archive downloaded successfully!</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleBackupAll}
              disabled={isBackingUp || (receipts.length === 0 && invoices.length === 0)}
              className="mt-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 disabled:grayscale active:scale-95"
            >
              {isBackingUp ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <DownloadCloud size={14} />
              )}
              <span>Download Complete Archive (ZIP)</span>
            </button>
          </div>
        </div>

        {/* Storage Analytics */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Receipts</span>
            <span className="text-base font-black text-slate-800">{receipts.length}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Invoices</span>
            <span className="text-base font-black text-slate-800">{invoices.length}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Storage</span>
            <span className="text-base font-black text-slate-800">
              {Math.max(1, Math.round(JSON.stringify({ business: businessInfo, receipts, invoices }).length / 1024))} KB
            </span>
          </div>
        </div>
      </div>

      {/* Secured Digital Records note (exclusively on Settings page) */}
      <footer className="pt-6 pb-2 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">Secure Digital Records</p>
        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">© 2026 QUICK RECEIPT · ENTERPRISE EDITION</p>
      </footer>
    </div>
  );
}
