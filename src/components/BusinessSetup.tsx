import React, { useState } from 'react';
import { Camera, X, Landmark, FileText, CreditCard, ShieldAlert, DownloadCloud, Database, Lock, KeyRound, CheckCircle2, LogOut, UserCheck, Loader2 } from 'lucide-react';
import { BusinessInfo, Receipt } from '../types';
import { updatePassword, signOut } from '../lib/analytics';
import JSZip from 'jszip';

interface BusinessSetupProps {
  initialData: BusinessInfo | null;
  onSave: (info: BusinessInfo) => void;
  onCancel: () => void;
  receipts: Receipt[];
  user?: any;
  onOpenAuth?: () => void;
  onSignOut?: () => void;
}

export default function BusinessSetup({ initialData, onSave, onCancel, receipts, user, onOpenAuth, onSignOut }: BusinessSetupProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [logo, setLogo] = useState(initialData?.logo || '');
  const [themeColor, setThemeColor] = useState<BusinessInfo['themeColor']>(initialData?.themeColor || 'blue');
  const [template, setTemplate] = useState<BusinessInfo['template']>(initialData?.template || 'classic');
  const [currency, setCurrency] = useState(initialData?.currency || '₦');
  const [signature, setSignature] = useState(initialData?.signature || '');
  const [showSignature, setShowSignature] = useState(initialData?.showSignature ?? false);

  // Bank & Invoice fields
  const [bankName, setBankName] = useState(initialData?.bankName || '');
  const [accountName, setAccountName] = useState(initialData?.accountName || initialData?.name || '');
  const [accountNumber, setAccountNumber] = useState(initialData?.accountNumber || '');
  const [paymentInfo, setPaymentInfo] = useState(initialData?.paymentInfo || '');
  const [termsConditions, setTermsConditions] = useState(initialData?.termsConditions || '');

  // Password Change state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match. Please verify.');
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

  const handleBackup = async () => {
    const zip = new JSZip();
    const data = {
      business: { name, phone, address, logo, themeColor, template, currency, bankName, accountName, accountNumber, paymentInfo, termsConditions },
      receipts,
      exportDate: new Date().toISOString(),
      version: '1.2.0'
    };

    zip.file('backup_data.json', JSON.stringify(data, null, 2));
    
    // Also add a human readable list
    const manifest = receipts.map(r => `${r.id} | ${r.customerName} | ${r.total} | ${r.createdAt}`).join('\n');
    zip.file('receipts_list.txt', `Quick Receipt Backup\nGenerated: ${new Date().toLocaleString()}\n\n${manifest}`);

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `quick-receipt-backup-${new Date().toISOString().split('T')[0]}.zip`;
    link.click();
  };

  const themeColors = [
    { id: 'blue', color: 'bg-blue-600' },
    { id: 'green', color: 'bg-emerald-600' },
    { id: 'purple', color: 'bg-purple-600' },
    { id: 'orange', color: 'bg-orange-600' },
    { id: 'red', color: 'bg-red-600' },
    { id: 'dark', color: 'bg-slate-900' },
  ];

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignature(reader.result as string);
        setShowSignature(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert('Business name is required');
    onSave({
      name,
      phone,
      address,
      logo,
      themeColor,
      template,
      currency,
      signature,
      showSignature,
      bankName,
      accountName,
      accountNumber,
      paymentInfo,
      termsConditions
    });
  };

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">Business Profile</h2>
        <p className="text-slate-800 font-bold text-xl">General & Default Settings</p>
      </div>

      {!user && onOpenAuth && (
        <div className="mb-6 p-4 bg-blue-50/80 border border-blue-100 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm">
              <Database size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Already have a saved business account?</p>
              <p className="text-[11px] text-slate-500 font-medium">Log in to restore your profile, receipts, and invoices instantly.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shrink-0 active:scale-95 shadow-sm"
          >
            Sign In / Log In
          </button>
        </div>
      )}

      {user && (
        <div className="mb-8 p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <UserCheck size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <span>{user.email}</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-wider">
                    Unlimited
                  </span>
                </p>
                <p className="text-[11px] text-slate-500 font-medium">Account active • Cloud auto-sync enabled</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <KeyRound size={14} />
                <span>{showPasswordChange ? 'Cancel' : 'Change Password'}</span>
              </button>

              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="px-3.5 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <LogOut size={14} />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          </div>

          {showPasswordChange && (
            <form onSubmit={handlePasswordChange} className="pt-4 border-t border-slate-200 space-y-3">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Update Account Password</p>
              
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
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">New Password</label>
                  <div className="relative">
                    <input
                      required
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Confirm New Password</label>
                  <div className="relative">
                    <input
                      required
                      type="password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                    />
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {passwordLoading ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <KeyRound size={14} />
                )}
                <span>Update Password</span>
              </button>
            </form>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Upload */}
        <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
          <div className="relative group shrink-0">
            {logo ? (
              <img src={logo} alt="Logo" className="w-20 h-20 rounded-xl object-cover border border-slate-200 shadow-sm" />
            ) : (
              <div className="w-20 h-20 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 group-hover:bg-slate-100 transition-colors">
                <Camera size={20} />
                <span className="text-[9px] font-bold mt-1 uppercase">Logo</span>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleLogoUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Business Logo</p>
            <p className="text-xs text-slate-400 mt-0.5">Appears at the top of every document.</p>
            {logo && (
              <button 
                type="button"
                onClick={() => setLogo('')}
                className="text-xs font-bold text-red-500 mt-2 hover:underline"
              >
                Remove Logo
              </button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 ml-1">Business Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Olu Electronics & Stores"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-medium"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 ml-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+234 812 345 6789"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 ml-1">Business Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="No. 42 Commercial Avenue, Ikeja, Lagos"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-medium min-h-[70px]"
          />
        </div>

        {/* Currency & Preferred Template */}
        <div className="grid md:grid-cols-2 gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 ml-1">Default Currency Symbol</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-medium"
            >
              <option value="₦">₦ (Nigerian Naira - NGN)</option>
              <option value="$">$ (US Dollar - USD)</option>
              <option value="€">€ (Euro - EUR)</option>
              <option value="£">£ (British Pound - GBP)</option>
              <option value="GH₵">GH₵ (Ghanaian Cedi - GHS)</option>
              <option value="KSh">KSh (Kenyan Shilling - KES)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 ml-1">Default Template</label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as BusinessInfo['template'])}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all font-medium capitalize"
            >
              <option value="classic">Classic Template</option>
              <option value="modern">Modern Template</option>
              <option value="minimal">Minimalist Template</option>
            </select>
          </div>
        </div>

        {/* Default Bank Details for Invoices */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Landmark size={16} className="text-blue-600" />
            <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Default Bank Details (Auto-filled in Invoices)</p>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-600">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. GTBank / Access"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-600">Account Name</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. Olu Electronics"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-600">Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 0123456789"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3 pt-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-600">Default Payment Notes / Instructions</label>
              <input
                type="text"
                value={paymentInfo}
                onChange={(e) => setPaymentInfo(e.target.value)}
                placeholder="e.g. Please send payment proof to WhatsApp"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-600">Default Terms & Conditions</label>
              <input
                type="text"
                value={termsConditions}
                onChange={(e) => setTermsConditions(e.target.value)}
                placeholder="e.g. Payment due in 7 days. No refunds after 3 days."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-600 ml-1">Theme Color</label>
          <div className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
            {themeColors.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setThemeColor(t.id as BusinessInfo['themeColor'])}
                className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center transition-all ${themeColor === t.id ? 'ring-4 ring-slate-200 scale-110' : 'opacity-60 hover:opacity-100'}`}
              >
                {themeColor === t.id && (
                  <div className="w-2 h-2 bg-white rounded-full shadow-sm" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Signature Section */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-800">Business Signature</p>
              <p className="text-xs text-slate-400 mt-0.5">Optional signature on documents.</p>
            </div>
            <div 
              onClick={() => setShowSignature(!showSignature)}
              className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${showSignature ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all transform ${showSignature ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative h-16 w-32 bg-white border border-slate-200 border-dashed rounded-lg flex items-center justify-center overflow-hidden">
               {signature ? (
                 <img src={signature} alt="Signature" className="max-h-full max-w-full object-contain" />
               ) : (
                 <span className="text-[8px] text-slate-300 font-bold uppercase">No Signature</span>
               )}
               <input 
                 type="file" 
                 accept="image/*" 
                 onChange={handleSignatureUpload}
                 className="absolute inset-0 opacity-0 cursor-pointer"
               />
            </div>
            {signature && (
              <button 
                type="button"
                onClick={() => {
                  setSignature('');
                  setShowSignature(false);
                }}
                className="text-xs font-bold text-red-500 hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          {initialData && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 rounded-lg font-bold text-sm bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="flex-1 px-6 py-2.5 rounded-lg font-bold text-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/10"
          >
            Save Profile
          </button>
        </div>
      </form>

      {/* Advanced / Data Management */}
      {initialData && (
        <div className="mt-12 pt-8 border-t border-slate-100">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row gap-4">
            <div className="bg-amber-100 p-2 rounded-lg shrink-0 h-fit w-fit">
              <ShieldAlert className="text-amber-600" size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900">Data Advisory</p>
              <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                This app runs on your browser local memory and syncs with your business account.
                <span className="font-bold"> Clearing browser cache without logging in will remove unsaved local offline history.</span>
              </p>
              
              <button
                onClick={handleBackup}
                disabled={receipts.length === 0}
                className="mt-4 w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:grayscale"
              >
                <DownloadCloud size={14} />
                Download All Documents (ZIP)
              </button>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-[10px] text-slate-400 font-medium px-2">
            <div className="flex items-center gap-1.5">
              <Database size={10} />
              <span>Storage Usage: {JSON.stringify({ business: initialData, receipts }).length} bytes</span>
            </div>
            <span>Records: {receipts.length}</span>
          </div>
        </div>
      )}
    </div>
  );
}
