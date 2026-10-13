import React, { useState } from 'react';
import { 
  Camera, 
  Landmark, 
  CheckCircle2, 
  Trash2, 
  Building2,
  Phone,
  MapPin,
  Coins,
  FileCheck2,
  PenTool
} from 'lucide-react';
import { BusinessInfo } from '../types';

interface ProfileViewProps {
  initialData: BusinessInfo | null;
  onSave: (info: BusinessInfo) => void;
  onCancel?: () => void;
}

export default function ProfileView({ initialData, onSave, onCancel }: ProfileViewProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [logo, setLogo] = useState(initialData?.logo || '');
  const [currency, setCurrency] = useState(initialData?.currency || '₦');
  const [signature, setSignature] = useState(initialData?.signature || '');
  const [showSignature, setShowSignature] = useState(initialData?.showSignature ?? false);

  // Default Bank & Remittance fields for invoices
  const [bankName, setBankName] = useState(initialData?.bankName || '');
  const [accountName, setAccountName] = useState(initialData?.accountName || initialData?.name || '');
  const [accountNumber, setAccountNumber] = useState(initialData?.accountNumber || '');
  const [paymentInfo, setPaymentInfo] = useState(initialData?.paymentInfo || '');
  const [termsConditions, setTermsConditions] = useState(initialData?.termsConditions || '');

  const [savedSuccess, setSavedSuccess] = useState(false);

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
    if (!name.trim()) {
      alert('Please enter your business name');
      return;
    }

    onSave({
      ...(initialData || {}),
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      logo,
      currency,
      signature,
      showSignature,
      bankName: bankName.trim(),
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
      paymentInfo: paymentInfo.trim(),
      termsConditions: termsConditions.trim(),
      themeColor: initialData?.themeColor || 'blue',
      template: initialData?.template || 'classic',
      receiptTemplate: initialData?.receiptTemplate || 'classic',
      invoiceTemplate: initialData?.invoiceTemplate || 'classic'
    });

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span>Business profile saved successfully! Changes are updated across all documents.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Business Logo Section */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Camera size={16} className="text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Business Logo</h3>
          </div>
          <p className="text-xs text-slate-400">
            Appears prominently on the header of all printed, shared, and exported receipts & invoices.
          </p>

          <div className="flex items-center gap-5 pt-2">
            <div className="relative group shrink-0">
              {logo ? (
                <div className="relative">
                  <img 
                    src={logo} 
                    alt="Business Logo" 
                    className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-xs" 
                  />
                  <button
                    type="button"
                    onClick={() => setLogo('')}
                    className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                    title="Remove logo"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 group-hover:bg-slate-100 group-hover:border-slate-300 transition-all cursor-pointer">
                  <Camera size={22} />
                  <span className="text-[9px] font-bold mt-1 uppercase tracking-wider text-slate-400">Add Logo</span>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleLogoUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                title="Upload logo"
              />
            </div>

            <div className="space-y-1">
              <label 
                className="inline-block px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                <span>{logo ? 'Change Image' : 'Select Image'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload}
                  className="hidden" 
                />
              </label>
              <p className="text-[11px] text-slate-400">PNG, JPG, or SVG recommended</p>
            </div>
          </div>
        </div>

        {/* Core Business Info */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={16} className="text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Business Details</h3>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <span>Business Name</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex Global Enterprises"
              className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
              required
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Phone size={12} className="text-slate-400" />
                <span>Phone Number</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +234 812 345 6789"
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Coins size={12} className="text-slate-400" />
                <span>Default Currency</span>
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all"
              >
                <option value="₦">₦ (Nigerian Naira - NGN)</option>
                <option value="$">$ (US Dollar - USD)</option>
                <option value="€">€ (Euro - EUR)</option>
                <option value="£">£ (British Pound - GBP)</option>
                <option value="GH₵">GH₵ (Ghanaian Cedi - GHS)</option>
                <option value="KSh">KSh (Kenyan Shilling - KES)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
              <MapPin size={12} className="text-slate-400" />
              <span>Business Address</span>
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Suite 4B, Victoria Island, Lagos"
              rows={2}
              className="w-full px-3.5 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 transition-all resize-none"
            />
          </div>
        </div>

        {/* Banking & Remittance for Invoices */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Landmark size={16} className="text-blue-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Default Bank Details (Auto-filled in Invoices)
            </h3>
          </div>
          <p className="text-xs text-slate-400">
            Clients use these details to pay your invoices directly.
          </p>

          <div className="grid md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. GTBank / Access"
                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Account Name</label>
              <input
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g. Apex Global Ventures"
                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Account Number</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. 0123456789"
                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Default Payment Notes</label>
              <input
                type="text"
                value={paymentInfo}
                onChange={(e) => setPaymentInfo(e.target.value)}
                placeholder="e.g. Send transaction proof to WhatsApp"
                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600">Default Terms & Conditions</label>
              <input
                type="text"
                value={termsConditions}
                onChange={(e) => setTermsConditions(e.target.value)}
                placeholder="e.g. Due within 7 days. Goods inspected on delivery."
                className="w-full px-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>
          </div>
        </div>

        {/* Business Signature */}
        <div className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <PenTool size={16} className="text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Authorized Signature</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Optionally embed an authorized signature on your receipts and invoices.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowSignature(!showSignature)}
              className={`w-11 h-6 rounded-full relative transition-colors cursor-pointer ${
                showSignature ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                  showSignature ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <div className="relative h-18 w-36 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center overflow-hidden group">
              {signature ? (
                <img src={signature} alt="Signature" className="max-h-full max-w-full object-contain p-1" />
              ) : (
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">No Signature</span>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleSignatureUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
                title="Upload signature image"
              />
            </div>

            <div className="space-y-1.5">
              <label className="inline-block px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                <span>Upload Signature</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleSignatureUpload}
                  className="hidden" 
                />
              </label>

              {signature && (
                <button 
                  type="button"
                  onClick={() => {
                    setSignature('');
                    setShowSignature(false);
                  }}
                  className="block text-xs font-bold text-red-500 hover:underline"
                >
                  Clear Signature
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            className="flex-1 py-3 px-6 rounded-xl font-bold text-xs uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] transition-all shadow-md shadow-blue-500/20"
          >
            Save Business Profile
          </button>
        </div>
      </form>
    </div>
  );
}
