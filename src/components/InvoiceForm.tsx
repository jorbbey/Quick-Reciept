import React, { useState, useEffect } from 'react';
import { Plus, Trash2, User, Phone, Calendar, FileText, CreditCard, Mail, ShieldAlert, Landmark, Check, Users, ChevronDown, ChevronUp, Sparkles, AlertCircle } from 'lucide-react';
import { Invoice, InvoiceItem, Customer, BusinessInfo } from '../types';
import { generateId } from '../lib/utils';
import { getRecentCustomers, searchCustomers, saveCustomer } from '../lib/customers';
import { motion, AnimatePresence } from 'motion/react';

interface InvoiceFormProps {
  onSubmit: (invoice: Invoice) => void;
  onChange?: (invoice: Partial<Invoice>) => void;
  initialData?: Partial<Invoice>;
  selectedTemplate?: 'classic' | 'modern' | 'minimal';
  businessInfo?: BusinessInfo | null;
  currency?: string;
}

const DRAFT_KEY = 'qr_invoice_draft';

export default function InvoiceForm({
  onSubmit,
  onChange,
  initialData,
  selectedTemplate = 'classic',
  businessInfo,
  currency = '₦'
}: InvoiceFormProps) {
  const getInitialDraft = () => {
    if (initialData) return null;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const draft = getInitialDraft();

  const [customerName, setCustomerName] = useState(initialData?.customerName ?? draft?.customerName ?? '');
  const [customerContact, setCustomerContact] = useState(initialData?.customerContact ?? draft?.customerContact ?? '');
  const [invoiceNumber, setInvoiceNumber] = useState(
    initialData?.invoiceNumber || draft?.invoiceNumber || `INV-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
  );
  const [items, setItems] = useState<InvoiceItem[]>(
    initialData?.items?.length
      ? initialData.items
      : draft?.items?.length
      ? draft.items
      : [{ id: generateId(), name: '', price: 0, quantity: 1 }]
  );
  const [dueDate, setDueDate] = useState(
    initialData?.dueDate || draft?.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [notes, setNotes] = useState(initialData?.notes ?? draft?.notes ?? '');
  const [status, setStatus] = useState<Invoice['status']>(initialData?.status ?? draft?.status ?? 'pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Template-specific field states (prefilled with business defaults if present)
  const [paymentInfo, setPaymentInfo] = useState(
    initialData?.paymentInfo || draft?.paymentInfo || businessInfo?.paymentInfo || ''
  );
  const [questionsEmail, setQuestionsEmail] = useState(initialData?.questionsEmail || draft?.questionsEmail || '');
  const [termsConditions, setTermsConditions] = useState(
    initialData?.termsConditions || draft?.termsConditions || businessInfo?.termsConditions || ''
  );
  const [accountName, setAccountName] = useState(
    initialData?.accountName || draft?.accountName || businessInfo?.accountName || businessInfo?.name || ''
  );
  const [accountNumber, setAccountNumber] = useState(
    initialData?.accountNumber || draft?.accountNumber || businessInfo?.accountNumber || ''
  );
  const [bankName, setBankName] = useState(
    initialData?.bankName || draft?.bankName || businessInfo?.bankName || ''
  );
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || draft?.paymentMethod || '');

  // Advanced options toggle
  const hasAdvancedContent = Boolean(
    paymentInfo || questionsEmail || termsConditions || accountName || accountNumber || bankName || paymentMethod || notes
  );
  const [showAdvanced, setShowAdvanced] = useState(hasAdvancedContent);

  // Customer suggestions state
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    setRecentCustomers(getRecentCustomers(5));
  }, []);

  // Update state when initialData changes
  useEffect(() => {
    if (initialData) {
      if (initialData.customerName !== undefined) setCustomerName(initialData.customerName);
      if (initialData.customerContact !== undefined) setCustomerContact(initialData.customerContact);
      if (initialData.invoiceNumber) setInvoiceNumber(initialData.invoiceNumber);
      if (initialData.items) setItems(initialData.items.length ? initialData.items : [{ id: generateId(), name: '', price: 0, quantity: 1 }]);
      if (initialData.dueDate) setDueDate(initialData.dueDate);
      if (initialData.notes !== undefined) setNotes(initialData.notes);
      if (initialData.status) setStatus(initialData.status);
      if (initialData.paymentInfo !== undefined) setPaymentInfo(initialData.paymentInfo);
      if (initialData.questionsEmail !== undefined) setQuestionsEmail(initialData.questionsEmail);
      if (initialData.termsConditions !== undefined) setTermsConditions(initialData.termsConditions);
      if (initialData.accountName !== undefined) setAccountName(initialData.accountName);
      if (initialData.accountNumber !== undefined) setAccountNumber(initialData.accountNumber);
      if (initialData.bankName !== undefined) setBankName(initialData.bankName);
      if (initialData.paymentMethod !== undefined) setPaymentMethod(initialData.paymentMethod);
    }
  }, [initialData]);

  // Auto-save draft
  useEffect(() => {
    if (!initialData) {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            customerName,
            customerContact,
            invoiceNumber,
            items,
            dueDate,
            notes,
            status,
            paymentInfo,
            questionsEmail,
            termsConditions,
            accountName,
            accountNumber,
            bankName,
            paymentMethod
          })
        );
      } catch {}
    }
  }, [
    customerName,
    customerContact,
    invoiceNumber,
    items,
    dueDate,
    notes,
    status,
    paymentInfo,
    questionsEmail,
    termsConditions,
    accountName,
    accountNumber,
    bankName,
    paymentMethod,
    initialData
  ]);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = subtotal;

  // Notify parent of changes for real-time preview
  useEffect(() => {
    onChange?.({
      customerName,
      customerContact,
      invoiceNumber,
      items,
      subtotal,
      total,
      dueDate,
      notes,
      status,
      template: selectedTemplate,
      paymentInfo,
      questionsEmail,
      termsConditions,
      accountName,
      accountNumber,
      bankName,
      paymentMethod
    });
  }, [
    customerName,
    customerContact,
    invoiceNumber,
    items,
    subtotal,
    total,
    dueDate,
    notes,
    status,
    selectedTemplate,
    paymentInfo,
    questionsEmail,
    termsConditions,
    accountName,
    accountNumber,
    bankName,
    paymentMethod,
    onChange
  ]);

  const handleCustomerNameChange = (val: string) => {
    setCustomerName(val);
    setErrorMessage(null);
    if (val.trim()) {
      setFilteredCustomers(searchCustomers(val));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectCustomer = (c: Customer) => {
    setCustomerName(c.name);
    if (c.phone) setCustomerContact(c.phone);
    setShowSuggestions(false);
    setErrorMessage(null);
  };

  const addItem = () => {
    setItems([...items, { id: generateId(), name: '', price: 0, quantity: 1 }]);
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setErrorMessage(null);
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerName.trim()) {
      setErrorMessage('Please enter a customer name.');
      return;
    }
    if (items.some(i => !i.name || !i.name.trim() || i.price <= 0)) {
      setErrorMessage('Please complete all item descriptions and enter prices greater than zero.');
      return;
    }

    setErrorMessage(null);
    saveCustomer(customerName, customerContact);

    // Clear draft on successful submit
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}

    const invoice: Invoice = {
      id: generateId(),
      customerName: customerName.trim(),
      customerContact,
      invoiceNumber,
      items,
      subtotal,
      total,
      dueDate,
      notes,
      template: selectedTemplate,
      status,
      createdAt: new Date().toISOString(),
      paymentInfo,
      questionsEmail,
      termsConditions,
      accountName,
      accountNumber,
      bankName,
      paymentMethod
    };
    onSubmit(invoice);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer & Invoice Info */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-4 relative">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Invoice Details</h2>
          <span className="text-[10px] px-2 py-1 bg-blue-50 text-blue-500 rounded font-mono font-bold tracking-widest">{invoiceNumber}</span>
        </div>

        {/* Recent Customers Pills */}
        {recentCustomers.length > 0 && (
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Users size={12} /> Recent Customers
            </span>
            <div className="flex flex-wrap gap-1.5">
              {recentCustomers.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCustomer(c)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    customerName.toLowerCase() === c.name.toLowerCase()
                      ? 'bg-blue-50 border-blue-300 font-bold text-blue-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5 relative">
            <label className="text-xs font-semibold text-slate-600 ml-1 flex items-center gap-1.5">
              <User size={12} className="text-slate-400" />
              Customer Name
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => handleCustomerNameChange(e.target.value)}
              onFocus={() => {
                if (customerName.trim()) {
                  setFilteredCustomers(searchCustomers(customerName));
                  setShowSuggestions(true);
                }
              }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="e.g. John Doe"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none transition-all font-medium focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': 'var(--theme-primary, #2563eb)33' } as React.CSSProperties}
              required
            />

            {/* Autocomplete Dropdown */}
            {showSuggestions && filteredCustomers.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                {filteredCustomers.map((c) => (
                  <div
                    key={c.id}
                    onMouseDown={() => selectCustomer(c)}
                    className="p-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between border-b border-slate-100 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-800">{c.name}</p>
                      {c.phone && <p className="text-xs text-slate-400">{c.phone}</p>}
                    </div>
                    {customerName.toLowerCase() === c.name.toLowerCase() && (
                      <Check size={14} className="text-blue-600" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 ml-1 flex items-center gap-1.5">
              <Phone size={12} className="text-slate-400" />
              Customer Phone / Contact
            </label>
            <input
              type="text"
              value={customerContact}
              onChange={(e) => setCustomerContact(e.target.value)}
              placeholder="e.g. +234..."
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none transition-all font-medium focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': 'var(--theme-primary, #2563eb)33' } as React.CSSProperties}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 ml-1 flex items-center gap-1.5">
              <Calendar size={12} className="text-slate-400" />
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none transition-all font-medium focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': 'var(--theme-primary, #2563eb)33' } as React.CSSProperties}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 ml-1 flex items-center gap-1.5">
              <FileText size={12} className="text-slate-400" />
              Invoice Number
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none transition-all font-medium focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': 'var(--theme-primary, #2563eb)33' } as React.CSSProperties}
              required
            />
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Items & Rates</h2>
        </div>

        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-12 gap-2 md:gap-3 pb-3 md:pb-4 border-b border-slate-50 last:border-0 last:pb-0"
              >
                <div className="col-span-12 md:col-span-6 flex flex-col gap-1">
                  <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase ml-1">Description</span>
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                    placeholder="e.g. Website Design..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none transition-all focus:ring-2 focus:border-transparent font-medium"
                    style={{ '--tw-ring-color': 'var(--theme-primary, #2563eb)33' } as React.CSSProperties}
                    required
                  />
                </div>
                <div className="col-span-3 md:col-span-2 flex flex-col gap-1">
                  <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase ml-1 text-center">Qty</span>
                  <input
                    type="number"
                    value={item.quantity || ''}
                    onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                    placeholder="1"
                    className="w-full px-2 md:px-3 py-2 border border-slate-200 rounded-lg text-sm text-center outline-none transition-all focus:ring-2 focus:border-transparent font-medium"
                    style={{ '--tw-ring-color': 'var(--theme-primary, #2563eb)33' } as React.CSSProperties}
                    required
                  />
                </div>
                <div className="col-span-7 md:col-span-3 flex flex-col gap-1">
                  <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase ml-1">Rate ({currency})</span>
                  <input
                    type="number"
                    value={item.price || ''}
                    onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                    placeholder="150000"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none transition-all focus:ring-2 focus:border-transparent font-medium text-right sm:text-left"
                    style={{ '--tw-ring-color': 'var(--theme-primary, #2563eb)33' } as React.CSSProperties}
                    required
                  />
                </div>
                <div className="col-span-2 md:col-span-1 flex items-end justify-center pb-1">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-slate-200 hover:text-red-500 p-2 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <button
            type="button"
            onClick={addItem}
            className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-100 rounded-xl text-xs font-bold text-slate-400 hover:border-slate-200 hover:bg-slate-50 transition-all group"
          >
            <Plus size={14} className="group-hover:scale-125 transition-transform" />
            Add New Item
          </button>
        </div>
      </div>

      {/* Advanced Options Toggle */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              More Options (Payment details, Bank, Terms)
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span className="text-[10px] font-bold uppercase">
              {showAdvanced ? 'Hide' : 'Expand'}
            </span>
            {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {showAdvanced && (
          <div className="p-5 border-t border-slate-100 space-y-4 bg-slate-50/50">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                {selectedTemplate} Template Fields
              </h3>
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-black uppercase tracking-wider">
                Dynamic Adapt
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Minimal Template Fields */}
              {selectedTemplate === 'minimal' && (
                <>
                  <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-600 ml-1 flex items-center gap-1.5">
                      <CreditCard size={12} className="text-slate-400" />
                      Payment Info
                    </label>
                    <input
                      type="text"
                      value={paymentInfo}
                      onChange={(e) => setPaymentInfo(e.target.value)}
                      placeholder="e.g. Bank: First Bank | Acc: 1234567890"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none transition-all font-medium focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': 'var(--theme-primary, #2563eb)33' } as React.CSSProperties}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-600 ml-1 flex items-center gap-1.5">
                      <Mail size={12} className="text-slate-400" />
                      Questions Email
                    </label>
                    <input
                      type="email"
                      value={questionsEmail}
                      onChange={(e) => setQuestionsEmail(e.target.value)}
                      placeholder="e.g. info@business.com"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none transition-all font-medium focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': 'var(--theme-primary, #2563eb)33' } as React.CSSProperties}
                    />
                  </div>
                </>
              )}

              {/* Modern Template Fields */}
              {selectedTemplate === 'modern' && (
                <>
                  <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-600 ml-1 flex items-center gap-1.5">
                      <ShieldAlert size={12} className="text-slate-400" />
                      Terms & Conditions
                    </label>
                    <textarea
                      value={termsConditions}
                      onChange={(e) => setTermsConditions(e.target.value)}
                      placeholder="e.g. Please pay within 7 days of receiving this invoice."
                      rows={2}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none transition-all font-medium focus:ring-2 focus:border-transparent resize-none"
                      style={{ '--tw-ring-color': 'var(--theme-primary, #2563eb)33' } as React.CSSProperties}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-600 ml-1 flex items-center gap-1.5">
                      <CreditCard size={12} className="text-slate-400" />
                      Payment Info
                    </label>
                    <input
                      type="text"
                      value={paymentInfo}
                      onChange={(e) => setPaymentInfo(e.target.value)}
                      placeholder="e.g. Bank Transfer"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none transition-all font-medium focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': 'var(--theme-primary, #2563eb)33' } as React.CSSProperties}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 ml-1 flex items-center gap-1.5">
                      <Landmark size={12} className="text-slate-400" />
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Access Bank"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none transition-all font-medium focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': 'var(--theme-primary, #2563eb)33' } as React.CSSProperties}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-600 ml-1 flex items-center gap-1.5">
                      <User size={12} className="text-slate-400" />
                      Account Name
                    </label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="e.g. John Doe Ventures"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none transition-all font-medium focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': 'var(--theme-primary, #2563eb)33' } as React.CSSProperties}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-600 ml-1 flex items-center gap-1.5">
                      <FileText size={12} className="text-slate-400" />
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 0123456789"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none transition-all font-medium focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': 'var(--theme-primary, #2563eb)33' } as React.CSSProperties}
                    />
                  </div>
                </>
              )}

              {/* Classic Template Fields */}
              {selectedTemplate === 'classic' && (
                <>
                  <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-600 ml-1 flex items-center gap-1.5">
                      <CreditCard size={12} className="text-slate-400" />
                      Payment Method
                    </label>
                    <input
                      type="text"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      placeholder="e.g. Bank Transfer or Cash on Delivery"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none transition-all font-medium focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': 'var(--theme-primary, #2563eb)33' } as React.CSSProperties}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 col-span-1 md:col-span-2">
                    <label className="text-xs font-semibold text-slate-600 ml-1 flex items-center gap-1.5">
                      <ShieldAlert size={12} className="text-slate-400" />
                      Terms & Conditions
                    </label>
                    <textarea
                      value={termsConditions}
                      onChange={(e) => setTermsConditions(e.target.value)}
                      placeholder="e.g. All goods remain property of business until fully paid."
                      rows={2}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none transition-all font-medium focus:ring-2 focus:border-transparent resize-none"
                      style={{ '--tw-ring-color': 'var(--theme-primary, #2563eb)33' } as React.CSSProperties}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Notes Section */}
            <div className="pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">Additional Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Payment details, terms, etc."
                rows={3}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none transition-all font-medium focus:ring-2 focus:border-transparent resize-none"
                style={{ '--tw-ring-color': 'var(--theme-primary, #2563eb)33' } as React.CSSProperties}
              />
            </div>
          </div>
        )}
      </div>

      {/* Totals Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</span>
            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
              {(['pending', 'paid'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-4 py-1.5 text-[9px] font-black uppercase rounded transition-all ${status === s ? 'bg-white text-blue-600 font-bold border border-slate-200' : 'text-slate-400'}`}
                  style={status === s ? { color: 'var(--theme-primary, #2563eb)' } : {}}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Total Amount Due</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{currency}{total.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* In-form Validation Error Banner */}
      {errorMessage && (
        <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-bold animate-in fade-in duration-200">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex gap-4 pt-2">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] py-4 rounded-xl font-bold text-base md:text-lg transition-all min-h-[52px] flex items-center justify-center"
          style={{ backgroundColor: 'var(--theme-primary, #2563eb)' }}
        >
          Generate Invoice
        </button>
      </div>
    </form>
  );
}

