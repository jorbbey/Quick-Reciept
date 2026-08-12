import React, { useState, useEffect } from 'react';
import { Plus, Trash2, User, Check, Users } from 'lucide-react';
import { Receipt, ReceiptItem, Customer } from '../types';
import { generateId } from '../lib/utils';
import { getRecentCustomers, searchCustomers, saveCustomer } from '../lib/customers';
import { motion, AnimatePresence } from 'motion/react';

interface ReceiptFormProps {
  onSubmit: (receipt: Receipt) => void;
  onChange?: (receipt: Partial<Receipt>) => void;
  initialData?: Partial<Receipt>;
  currency?: string;
}

export default function ReceiptForm({ onSubmit, onChange, initialData, currency = '₦' }: ReceiptFormProps) {
  const [customerName, setCustomerName] = useState(initialData?.customerName || '');
  const [items, setItems] = useState<ReceiptItem[]>(
    initialData?.items?.length ? initialData.items : [{ id: generateId(), name: '', price: 0, quantity: 1 }]
  );
  const [discount, setDiscount] = useState(initialData?.discount || 0);
  const [isPaid, setIsPaid] = useState(initialData?.isPaid ?? true);

  // Customer suggestions state
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    setRecentCustomers(getRecentCustomers(5));
  }, []);

  // Update form if initialData prop changes
  useEffect(() => {
    if (initialData) {
      if (initialData.customerName !== undefined) setCustomerName(initialData.customerName);
      if (initialData.items) setItems(initialData.items.length ? initialData.items : [{ id: generateId(), name: '', price: 0, quantity: 1 }]);
      if (initialData.discount !== undefined) setDiscount(initialData.discount);
      if (initialData.isPaid !== undefined) setIsPaid(initialData.isPaid);
    }
  }, [initialData]);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const total = Math.max(0, subtotal - discount);

  // Notify parent of changes for real-time preview
  useEffect(() => {
    onChange?.({
      customerName,
      items,
      discount,
      isPaid,
      total
    });
  }, [customerName, items, discount, isPaid, total, onChange]);

  const handleCustomerNameChange = (val: string) => {
    setCustomerName(val);
    if (val.trim()) {
      setFilteredCustomers(searchCustomers(val));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectCustomer = (c: Customer) => {
    setCustomerName(c.name);
    setShowSuggestions(false);
  };

  const addItem = () => {
    setItems([...items, { id: generateId(), name: '', price: 0, quantity: 1 }]);
  };

  const updateItem = (id: string, field: keyof ReceiptItem, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) return alert('Please enter customer name');
    if (items.some(i => !i.name || i.price <= 0)) return alert('Please complete all item details');

    // Save customer memory
    saveCustomer(customerName);

    const receipt: Receipt = {
      id: generateId(),
      customerName,
      items,
      discount,
      isPaid,
      createdAt: new Date().toISOString(),
      total
    };
    onSubmit(receipt);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Customer Info */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Customer Info</h2>
          <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-500 rounded font-mono">DRAFT</span>
        </div>

        {/* Recent Customer Pills */}
        {recentCustomers.length > 0 && (
          <div className="mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
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

        <div className="flex flex-col gap-1.5 relative">
          <label className="text-xs font-semibold text-slate-600 ml-1">Customer Name</label>
          <div className="relative">
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
              placeholder="e.g. Chinedu Okafor"
              className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm outline-none transition-all font-medium focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': 'var(--theme-primary, #2563eb)33' } as React.CSSProperties}
              required
            />
          </div>

          {/* Autocomplete Dropdown */}
          {showSuggestions && filteredCustomers.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-30 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
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
      </div>

      {/* Items Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm pb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Items & Services</h2>
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
                    placeholder="e.g. Wireless Speaker"
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
                  <span className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase ml-1">Price ({currency})</span>
                  <input
                    type="number"
                    value={item.price || ''}
                    onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))}
                    placeholder="45000"
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
            Add Items
          </button>
        </div>
      </div>

      {/* Totals Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col md:flex-row gap-6 md:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 block mb-1.5 ml-1">Discount ({currency})</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">{currency}</span>
              <input
                type="number"
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value))}
                placeholder="0"
                className="pl-8 pr-3 py-2.5 w-full border border-slate-200 rounded-lg text-sm outline-none font-medium transition-all focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': 'var(--theme-primary, #2563eb)33' } as React.CSSProperties}
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">Status</span>
            <div className="flex gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setIsPaid(true)}
                className={`px-4 py-1.5 text-[10px] font-bold rounded transition-all ${isPaid ? 'bg-white shadow-sm' : 'text-slate-400'}`}
                style={isPaid ? { color: 'var(--theme-primary, #2563eb)' } : {}}
              >
                PAID
              </button>
              <button
                type="button"
                onClick={() => setIsPaid(false)}
                className={`px-4 py-1.5 text-[10px] font-bold rounded transition-all ${!isPaid ? 'bg-white shadow-sm text-red-600' : 'text-slate-400'}`}
              >
                UNPAID
              </button>
            </div>
          </div>

          <div className="text-right flex-1 flex flex-col justify-end">
            <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Total Amount</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{currency}{total.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-2">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white hover:bg-blue-700 py-4 rounded-xl font-bold text-lg transition-all active:scale-95 shadow-xl shadow-blue-500/20"
          style={{ backgroundColor: 'var(--theme-primary, #2563eb)' }}
        >
          Generate Final Receipt
        </button>
      </div>
    </form>
  );
}

