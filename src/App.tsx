/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Settings, 
  History, 
  ArrowLeft, 
  Download, 
  Share2, 
  Trash2, 
  Cloud, 
  CloudOff,
  LogOut, 
  User, 
  RefreshCw, 
  Info, 
  Search,
  ChevronRight,
  Printer,
  FileText,
  MessageCircle,
  Copy,
  CheckCircle2,
  Repeat
} from 'lucide-react';
import { NairaIcon } from './components/NairaIcon';
import { motion, AnimatePresence } from 'motion/react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { BusinessInfo, Receipt, ReceiptItem, Invoice, InvoiceItem } from './types';
import { cn, formatCurrency, generateId, isValidUUID, generateWhatsAppMessage } from './lib/utils';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { 
  trackEvent, 
  initAnalytics, 
  supabase, 
  getSafeSession,
  signOut, 
  saveReceiptToCloud, 
  fetchReceiptsFromCloud, 
  deleteReceiptFromCloud,
  saveInvoiceToCloud,
  fetchInvoicesFromCloud,
  deleteInvoiceFromCloud,
  fetchProfile,
  syncProfile
} from './lib/analytics';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Components
import BusinessSetup from './components/BusinessSetup';
import ReceiptForm from './components/ReceiptForm';
import ReceiptPreview from './components/ReceiptPreview';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AuthModal from './components/AuthModal';

export default function App() {
  const [businessInfo, setBusinessInfo] = useLocalStorage<BusinessInfo | null>('qr_business_info', null);
  const [receipts, setReceipts] = useLocalStorage<Receipt[]>('qr_receipts', []);
  const [invoices, setInvoices] = useLocalStorage<Invoice[]>('qr_invoices', []);
  const [view, setView] = useState<'dashboard' | 'setup' | 'create' | 'preview' | 'create_invoice' | 'preview_invoice' | 'stats'>('dashboard');
  const [activeTab, setActiveTab] = useState<'receipts' | 'invoices'>('receipts');
  const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [customFilename, setCustomFilename] = useState('');
  const exportRef = useRef<HTMLDivElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authReason, setAuthReason] = useState<'limit_reached' | 'manual'>('manual');
  const [pendingDoc, setPendingDoc] = useState<{ type: 'receipt' | 'invoice'; data: Receipt | Invoice } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Form pre-fill memory state
  const [receiptInitialData, setReceiptInitialData] = useState<Partial<Receipt> | null>(null);
  const [invoiceInitialData, setInvoiceInitialData] = useState<Partial<Invoice> | null>(null);

  const handleWhatsAppShare = (type: 'receipt' | 'invoice') => {
    const item = type === 'receipt' ? currentReceipt : currentInvoice;
    if (!item) return;

    const encodedMsg = generateWhatsAppMessage({
      type,
      id: item.id,
      customerName: item.customerName,
      total: item.total,
      businessName: businessInfo?.name,
      currency: businessInfo?.currency || '₦',
      items: item.items,
      date: item.createdAt,
      status: type === 'receipt' ? ((item as Receipt).isPaid ? 'PAID' : 'DUE') : (item as Invoice).status
    });

    window.open(`https://wa.me/?text=${encodedMsg}`, '_blank');
    trackEvent(`${type}_shared_whatsapp_direct`, { id: item.id });
  };

  const handleCreateAnother = (type: 'receipt' | 'invoice') => {
    if (type === 'receipt') {
      setReceiptInitialData(null);
      setCurrentReceipt(null);
      setView('create');
    } else {
      setInvoiceInitialData(null);
      setCurrentInvoice(null);
      setView('create_invoice');
    }
  };

  const handleDuplicate = (type: 'receipt' | 'invoice', item?: Receipt | Invoice | null) => {
    const target = item || (type === 'receipt' ? currentReceipt : currentInvoice);
    if (!target) return;

    if (type === 'receipt') {
      const r = target as Receipt;
      setReceiptInitialData({
        customerName: r.customerName,
        items: r.items,
        discount: r.discount,
        isPaid: r.isPaid
      });
      setView('create');
    } else {
      const inv = target as Invoice;
      setInvoiceInitialData({
        customerName: inv.customerName,
        customerContact: inv.customerContact,
        items: inv.items,
        notes: inv.notes,
        paymentInfo: inv.paymentInfo,
        bankName: inv.bankName,
        accountName: inv.accountName,
        accountNumber: inv.accountNumber,
        termsConditions: inv.termsConditions
      });
      setView('create_invoice');
    }
  };

  const handleConvertInvoiceToReceipt = (invoice: Invoice) => {
    const convertedReceipt: Receipt = {
      id: generateId(),
      customerName: invoice.customerName,
      items: invoice.items.map(item => ({ id: item.id || generateId(), name: item.name, quantity: item.quantity, price: item.price })),
      discount: 0,
      total: invoice.total,
      createdAt: new Date().toISOString(),
      isPaid: true
    };

    // Mark invoice as paid in local state
    const updatedInvoices = invoices.map(i => i.id === invoice.id ? { ...i, status: 'paid' as const } : i);
    setInvoices(updatedInvoices);
    if (user && invoice._synced) {
      saveInvoiceToCloud({ ...invoice, status: 'paid' }, businessInfo);
    }

    handleCreateReceipt(convertedReceipt);
  };

  const handleToggleInvoiceStatus = async (invoice: Invoice) => {
    const newStatus = invoice.status === 'paid' ? 'pending' : 'paid';
    const updated: Invoice = { ...invoice, status: newStatus as 'paid' | 'pending' };
    
    setInvoices(prev => prev.map(i => i.id === invoice.id ? updated : i));
    if (currentInvoice?.id === invoice.id) {
      setCurrentInvoice(updated);
    }
    if (user && invoice._synced) {
      await saveInvoiceToCloud(updated, businessInfo);
    }
    trackEvent('invoice_status_toggled', { id: invoice.id, status: newStatus });
  };

  // Sync receipts, invoices, and business profile with cloud if logged in
  const handleAuthSuccess = async (authenticatedUser?: SupabaseUser | null) => {
    let currentUser = authenticatedUser || user;
    if (!currentUser) {
      const { data: { session } } = await supabase?.auth.getSession() || { data: { session: null } };
      currentUser = session?.user || null;
    }
    if (currentUser) {
      setUser(currentUser);
    }

    // 1. Sync Business Profile
    if (currentUser && businessInfo) {
      await syncProfile(currentUser.email || '', businessInfo);
    }

    // 2. Migrate existing local receipts to the newly authenticated account
    if (currentUser) {
      for (const r of receipts) {
        if (!r._synced) {
          await saveReceiptToCloud(r, businessInfo);
        }
      }
      setReceipts(prev => prev.map(r => ({ ...r, _synced: true })));

      // 3. Migrate existing local invoices
      for (const i of invoices) {
        if (!i._synced) {
          await saveInvoiceToCloud(i, businessInfo);
        }
      }
      setInvoices(prev => prev.map(i => ({ ...i, _synced: true })));
    }

    // 4. If there was a pending document waiting to be created upon hitting 5-document limit
    if (pendingDoc) {
      if (pendingDoc.type === 'receipt') {
        const newReceipt = pendingDoc.data as Receipt;
        setReceipts(prev => [newReceipt, ...prev.map(r => r.id === newReceipt.id ? { ...r, _synced: true } : r)]);
        setCurrentReceipt(newReceipt);
        setView('preview');
        if (currentUser) {
          await saveReceiptToCloud(newReceipt, businessInfo);
        }
        trackEvent('receipt_created', {
          total_amount: newReceipt.total,
          item_count: newReceipt.items.length,
          is_paid: newReceipt.isPaid
        });
      } else {
        const newInvoice = pendingDoc.data as Invoice;
        setInvoices(prev => [newInvoice, ...prev.map(i => i.id === newInvoice.id ? { ...i, _synced: true } : i)]);
        setCurrentInvoice(newInvoice);
        setView('preview_invoice');
        if (currentUser) {
          await saveInvoiceToCloud(newInvoice, businessInfo);
        }
        trackEvent('invoice_created', {
          total_amount: newInvoice.total,
          item_count: newInvoice.items.length,
          due_date: newInvoice.dueDate
        });
      }
      setPendingDoc(null);
    } else if (currentReceipt && view === 'preview') {
      await handleSaveToCloud(currentReceipt);
    } else if (currentInvoice && view === 'preview_invoice') {
      await handleSaveInvoiceToCloud(currentInvoice);
    }

    // 5. Sync history from cloud
    await syncHistory();
  };

  const syncHistory = async () => {
    const session = await getSafeSession();
    if (!session?.user) return;
    
    setIsLoadingHistory(true);
    try {
      const [cloudReceipts, cloudInvoices, profile] = await Promise.all([
        fetchReceiptsFromCloud(),
        fetchInvoicesFromCloud(),
        fetchProfile()
      ]);

      if (cloudReceipts.length > 0) {
        setReceipts(prev => {
          const merged = [...cloudReceipts.map(r => ({ ...r, _synced: true }))];
          prev.forEach(local => {
            if (!merged.find(m => m.id === local.id)) {
              merged.push(local);
            }
          });
          return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });
      }

      if (cloudInvoices.length > 0) {
        setInvoices(prev => {
          const merged = [...cloudInvoices.map(i => ({ ...i, _synced: true }))];
          prev.forEach(local => {
            if (!merged.find(m => m.id === local.id)) {
              merged.push(local);
            }
          });
          return merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        });
      }

      // Check if business info exists in cloud profile or cloud history items
      const cloudBusinessName = 
        profile?.business_info?.name ||
        profile?.business_name || 
        cloudReceipts.find(r => r.businessName)?.businessName || 
        cloudInvoices.find(i => i.businessName)?.businessName;

      let currentActiveBusiness = businessInfo;

      if (cloudBusinessName) {
        const cloudBusinessInfo: BusinessInfo = {
          name: cloudBusinessName,
          phone: profile?.business_info?.phone || '',
          address: profile?.business_info?.address || '',
          logo: profile?.business_info?.logo || '',
          themeColor: profile?.business_info?.themeColor || cloudReceipts[0]?.themeColor || cloudInvoices[0]?.themeColor || 'blue',
          template: profile?.business_info?.template || cloudReceipts[0]?.template || cloudInvoices[0]?.template || 'classic',
          signature: profile?.business_info?.signature || cloudReceipts[0]?.signature || cloudInvoices[0]?.signature || '',
          showSignature: !!(profile?.business_info?.signature || cloudReceipts[0]?.signature || cloudInvoices[0]?.signature)
        };

        if (!currentActiveBusiness || !currentActiveBusiness.name) {
          currentActiveBusiness = cloudBusinessInfo;
          setBusinessInfo(cloudBusinessInfo);
        } else {
          syncProfile(session.user.email || '', currentActiveBusiness);
        }
      } else if (currentActiveBusiness?.name) {
        syncProfile(session.user.email || '', currentActiveBusiness);
      }

      // If user had no local business info but cloud profile loaded, transition to dashboard
      if (currentActiveBusiness && currentActiveBusiness.name) {
        setView(prev => (!businessInfo && prev === 'setup' ? 'dashboard' : prev));
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSaveInvoiceToCloud = async (invoice: Invoice) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsSaving(true);
    const { error } = await saveInvoiceToCloud(invoice, businessInfo);
    if (!error) {
      setInvoices(prev => prev.map(i => i.id === invoice.id ? { ...i, _synced: true } : i));
      trackEvent('invoice_saved', { id: invoice.id });
    } else {
      console.error('Supabase Invoice Save Error:', error);
    }
    setIsSaving(false);
  };

  const handleSaveToCloud = async (receipt: Receipt) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsSaving(true);
    
    // UUID Migration: If existing receipt has an old format ID (e.g. REC-XXX), 
    // we need to update it to a valid UUID before Supabase will accept it.
    let receiptToSave = { ...receipt };
    const originalId = receipt.id;
    
    if (!isValidUUID(originalId)) {
      const newId = generateId();
      receiptToSave.id = newId;
      
      // Update local state to match the new ID so future syncs work correctly
      setReceipts(prev => prev.map(r => r.id === originalId ? { ...r, id: newId } : r));
      
      // If this is the currently viewed receipt, update it too
      if (currentReceipt?.id === originalId) {
        setCurrentReceipt({ ...currentReceipt, id: newId });
      }
    }

    const { error } = await saveReceiptToCloud(receiptToSave, businessInfo);
    if (!error) {
      // Use the updated ID for the sync check
      const finalId = receiptToSave.id;
      setReceipts(prev => prev.map(r => r.id === finalId ? { ...r, _synced: true } : r));
      trackEvent('receipt_saved', { id: finalId });
    } else {
      console.error('Supabase Save Error:', error);
    }
    setIsSaving(false);
  };

  const handleRemoveFromCloud = async (id: string, type: 'receipt' | 'invoice' = 'receipt') => {
    if (!user) return;
    setIsSaving(true);
    
    if (type === 'receipt') {
      const { error } = await deleteReceiptFromCloud(id);
      if (!error) {
        setReceipts(prev => prev.map(r => r.id === id ? { ...r, _synced: false } : r));
        if (currentReceipt?.id === id) {
          setCurrentReceipt({ ...currentReceipt, _synced: false });
        }
      }
    } else {
      const { error } = await deleteInvoiceFromCloud(id);
      if (!error) {
        setInvoices(prev => prev.map(i => i.id === id ? { ...i, _synced: false } : i));
        if (currentInvoice?.id === id) {
          setCurrentInvoice({ ...currentInvoice, _synced: false });
        }
      }
    }
    setIsSaving(false);
  };

  const getThemeColorClass = () => {
    switch (businessInfo?.themeColor) {
      case 'green': return 'blue-600 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20';
      case 'purple': return 'blue-600 bg-purple-600 hover:bg-purple-700 shadow-purple-500/20';
      case 'orange': return 'blue-600 bg-orange-600 hover:bg-orange-700 shadow-orange-500/20';
      case 'red': return 'blue-600 bg-red-600 hover:bg-red-700 shadow-red-500/20';
      case 'dark': return 'blue-600 bg-slate-900 hover:bg-black shadow-slate-900/20';
      default: return 'blue-600 bg-blue-600 hover:bg-blue-700 shadow-blue-500/20';
    }
  };

  const getThemeTextClass = () => {
    switch (businessInfo?.themeColor) {
      case 'green': return 'text-emerald-600';
      case 'purple': return 'text-purple-600';
      case 'orange': return 'text-orange-600';
      case 'red': return 'text-red-600';
      case 'dark': return 'text-slate-900';
      default: return 'text-blue-600';
    }
  };

  const currentThemeColor = getThemeColorClass().split(' ')[1]; // Get 'bg-xxxx-600'
  const currentThemeText = getThemeTextClass();

  const handleReceiptChange = React.useCallback((receiptData: Partial<Receipt>) => {
    setCurrentReceipt({ ...receiptData, createdAt: new Date().toISOString(), id: '00000000-0000-0000-0000-000000000000' } as Receipt);
  }, []);

  const handleInvoiceChange = React.useCallback((invoiceData: Partial<Invoice>) => {
    setCurrentInvoice({ ...invoiceData, createdAt: new Date().toISOString(), id: '00000000-0000-0000-0000-000000000000' } as Invoice);
  }, []);

  const handleSaveBusiness = (info: BusinessInfo) => {
    const isNew = !businessInfo;
    setBusinessInfo(info);
    setView('dashboard');

    if (user) {
      syncProfile(user.email || '', info);
    }

    if (isNew) {
      trackEvent('business_created', { 
        name: info.name,
        template: info.template,
        theme: info.themeColor
      });
    } else {
      trackEvent('business_updated', {
        template: info.template,
        theme: info.themeColor
      });
    }
  };

  const handleCreateReceipt = (receipt: Receipt) => {
    // 5-document limit check for anonymous users
    if (!user) {
      const totalDocs = receipts.length + invoices.length;
      if (totalDocs >= 5) {
        setPendingDoc({ type: 'receipt', data: receipt });
        setAuthReason('limit_reached');
        setIsAuthModalOpen(true);
        return;
      }
    }

    setReceipts([receipt, ...receipts]);
    setCurrentReceipt(receipt);
    setView('preview');

    trackEvent('receipt_created', {
      total_amount: receipt.total,
      item_count: receipt.items.length,
      is_paid: receipt.isPaid
    });

    if (user) {
      handleSaveToCloud(receipt);
    }
  };

  const handleCreateInvoice = (invoice: Invoice) => {
    // 5-document limit check for anonymous users
    if (!user) {
      const totalDocs = receipts.length + invoices.length;
      if (totalDocs >= 5) {
        setPendingDoc({ type: 'invoice', data: invoice });
        setAuthReason('limit_reached');
        setIsAuthModalOpen(true);
        return;
      }
    }

    setInvoices([invoice, ...invoices]);
    setCurrentInvoice(invoice);
    setView('preview_invoice');

    trackEvent('invoice_created', {
      total_amount: invoice.total,
      item_count: invoice.items.length,
      due_date: invoice.dueDate
    });

    if (user) {
      handleSaveInvoiceToCloud(invoice);
    }
  };

  const handleDeleteReceipt = async (id: string) => {
    if (user) {
      await deleteReceiptFromCloud(id);
    }
    setReceipts(receipts.filter(r => r.id !== id));
    trackEvent('receipt_deleted', { id });
  };

  const handleDeleteInvoice = async (id: string) => {
    if (user) {
      await deleteInvoiceFromCloud(id);
    }
    setInvoices(invoices.filter(i => i.id !== id));
    trackEvent('invoice_deleted', { id });
  };

  const getFilename = (extension: string, type: 'receipt' | 'invoice' = 'receipt') => {
    if (customFilename) return `${customFilename}.${extension}`;
    const date = new Date().toISOString().split('T')[0];
    const item = type === 'receipt' ? currentReceipt : currentInvoice;
    const name = item?.customerName.toLowerCase().replace(/\s+/g, '-') || 'customer';
    return `${name}_${type}_${date}.${extension}`;
  };

  const shareReceipt = async (type: 'receipt' | 'invoice' = 'receipt') => {
    if (!exportRef.current) return;
    
    try {
      const dataUrl = await toPng(exportRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      const filename = getFilename('png', type);
      const file = new File([blob], filename, { type: 'image/png' });
      const item = type === 'receipt' ? currentReceipt : currentInvoice;

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: `${type === 'receipt' ? 'Receipt' : 'Invoice'} from ${businessInfo?.name}`,
          text: `Here is your ${type} for ${formatCurrency(item?.total || 0)}`
        });
        trackEvent(`${type}_shared`, { channel: 'web_share_api' });
      } else {
        // Fallback for WhatsApp
        const text = encodeURIComponent(`${type === 'receipt' ? 'Receipt' : 'Invoice'} from ${businessInfo?.name}\nTotal: ${formatCurrency(item?.total || 0)}\nView Link: ${window.location.href}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
        trackEvent(`${type}_shared`, { channel: 'whatsapp_link' });
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const downloadReceipt = async (type: 'png' | 'pdf', docType: 'receipt' | 'invoice' = 'receipt') => {
    if (!exportRef.current) return;
    
    const dataUrl = await toPng(exportRef.current, { backgroundColor: '#ffffff', pixelRatio: 2 });
    
    if (type === 'png') {
      const link = document.createElement('a');
      link.download = getFilename('png', docType);
      link.href = dataUrl;
      link.click();
      trackEvent(`${docType}_downloaded`, { type: 'png' });
    } else {
      // First, get original image metrics to calculate accurate proportional height
      const tempPdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const imgProps = tempPdf.getImageProperties(dataUrl);
      const pdfWidth = tempPdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Re-create the PDF with exact proportional canvas format [width, height], 
      // preventing any whitespace under short receipts or cropping under long invoices.
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });
      
      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(getFilename('pdf', docType));
      trackEvent(`${docType}_downloaded`, { type: 'pdf' });
    }
  };

  // Auto-redirect to setup if no business info
  useEffect(() => {
    initAnalytics();

    // Auth Listener
    getSafeSession().then((session) => {
      setUser(session?.user || null);
      if (session?.user) {
        syncHistory();
      }
    });

    let subscription: { unsubscribe: () => void } | null = null;
    if (supabase) {
      try {
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          setUser(session?.user || null);
          if (session?.user) {
            syncHistory();
          }
        });
        subscription = data?.subscription || null;
      } catch {
        // Safe fallback if auth subscription fails
      }
    }
    
    // Secret access to stats
    const params = new URLSearchParams(window.location.search);
    if (params.get('stats') === 'true') {
      setIsAdmin(true);
      localStorage.setItem('qr_admin_access', 'true');
    } else if (localStorage.getItem('qr_admin_access') === 'true') {
      setIsAdmin(true);
    }

    return () => {
      subscription?.unsubscribe?.();
    };
  }, []);

  React.useEffect(() => {
    if (!businessInfo && view !== 'setup') {
      setView('setup');
    }
  }, [businessInfo]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 pb-10">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 md:px-6 py-1 flex items-center justify-between safe-top">
        <div className="flex items-center cursor-pointer shrink-0" onClick={() => setView('dashboard')}>
          <img 
            src="https://hectvnfwjxkexfoxcohj.supabase.co/storage/v1/object/public/media-files/quick_logo.png" 
            alt="Quick Receipt Logo" 
            className="h-14 w-auto md:h-16 object-contain -my-2" 
          />
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <nav className="flex gap-4 md:gap-6 text-xs md:text-sm font-medium text-slate-500">
            <button onClick={() => setView('create')} className={cn("hover:text-slate-800 transition-colors py-1 flex items-center gap-1.5", view === 'create' && cn(currentThemeText, "border-b-2", currentThemeText.replace('text-', 'border-')))}>
              <Plus size={14} strokeWidth={3} className="sm:hidden" />
              <span className="hidden sm:inline">Create</span>
            </button>
            <button onClick={() => setView('dashboard')} className={cn("hover:text-slate-800 transition-colors py-1 flex items-center gap-1.5", (view === 'dashboard' || view === 'history') && cn(currentThemeText, "border-b-2", currentThemeText.replace('text-', 'border-')))}>
              <History size={14} strokeWidth={3} className="sm:hidden" />
              <span className="hidden sm:inline">History</span>
            </button>
            {isAdmin && (
              <button onClick={() => setView('stats')} className={cn("hover:text-slate-800 transition-colors py-1", view === 'stats' && cn(currentThemeText, "border-b-2", currentThemeText.replace('text-', 'border-')))}>Insights</button>
            )}
          </nav>

          <div className="flex items-center gap-1 md:gap-2 border-l border-slate-200 pl-2 md:pl-4 ml-1 md:ml-2">
            <button 
              onClick={() => setView('setup')}
              className={cn(
                "p-1.5 md:p-2 rounded-full transition-colors flex items-center justify-center",
                view === 'setup' ? "bg-blue-50 text-blue-600 ring-2 ring-blue-600/20" : "hover:bg-slate-100 text-slate-600"
              )}
              title="Settings & Business Profile"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>

            {user ? (
              <button 
                onClick={() => signOut()}
                className="p-1.5 md:p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600 flex items-center gap-2"
                title={`Logged in as ${user.email}`}
              >
                <LogOut size={18} />
                <span className="hidden lg:inline text-[10px] font-black uppercase tracking-tighter max-w-[80px] truncate">{user.email?.split('@')[0]}</span>
              </button>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 transition-all active:scale-95"
              >
                <User size={12} strokeWidth={3} />
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={cn(
        "flex-1 p-3 md:p-6 mx-auto w-full transition-all duration-300",
        view === 'stats' ? "max-w-[1400px]" : (view === 'create_invoice' || view === 'preview_invoice') ? "max-w-7xl" : (view === 'create' || view === 'preview') ? "max-w-6xl" : "max-w-2xl"
      )}>
        <AnimatePresence mode="wait">
          {view === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-1"
            >
              <BusinessSetup 
                initialData={businessInfo} 
                onSave={handleSaveBusiness} 
                onCancel={() => businessInfo && setView('dashboard')}
                receipts={receipts}
                user={user}
                onOpenAuth={() => {
                  setAuthReason('manual');
                  setIsAuthModalOpen(true);
                }}
                onSignOut={async () => {
                  await signOut();
                  setUser(null);
                }}
              />
            </motion.div>
          )}

          {view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Business Summary */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center gap-2">
                <img src="https://hectvnfwjxkexfoxcohj.supabase.co/storage/v1/object/public/media-files/quick_logo.png" alt="Quick Receipt Logo" className="w-24 h-24 object-contain" />
                <div className="-mt-10">
                  <h2 className="text-sm font-black tracking-tighter flex items-center justify-center uppercase">
                    <span className="text-[#000033]">Quick</span>
                    <span className="text-blue-600 ml-1">Receipt</span>
                  </h2>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">{businessInfo?.name || 'Create records in seconds'}</p>
                </div>
                <button
                  onClick={() => setView('setup')}
                  className="mt-1 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-full text-[10px] font-bold text-slate-600 transition-colors active:scale-95"
                >
                  <Settings size={12} />
                  <span>Edit Business Profile</span>
                </button>
              </div>

              {/* Free Usage Tracker Banner for Anonymous Users */}
              {!user && (
                <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-11 h-11 rounded-xl flex flex-col items-center justify-center font-black text-xs shrink-0",
                      (receipts.length + invoices.length) >= 5 ? "bg-amber-100 text-amber-800" : "bg-blue-50 text-blue-600"
                    )}>
                      <span>{receipts.length + invoices.length}/5</span>
                      <span className="text-[7px] uppercase tracking-tighter font-bold">Docs</span>
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
                        <span>Free Anonymous Plan</span>
                        {(receipts.length + invoices.length) >= 5 ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[8px] font-black uppercase">
                            5 Document Limit Reached
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-blue-600 lowercase">
                            ({5 - (receipts.length + invoices.length)} left before free account)
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {(receipts.length + invoices.length) >= 5 
                          ? "Create a free account to keep all documents saved and enjoy unlimited receipts & invoices."
                          : "Try Quick Receipt freely. Create an account anytime to enable cloud backup & sync."}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setAuthReason((receipts.length + invoices.length) >= 5 ? 'limit_reached' : 'manual');
                      setIsAuthModalOpen(true);
                    }}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 active:scale-95 shadow-sm whitespace-nowrap",
                      (receipts.length + invoices.length) >= 5 
                        ? "bg-amber-600 hover:bg-amber-700 text-white" 
                        : "bg-slate-900 hover:bg-black text-white"
                    )}
                  >
                    {(receipts.length + invoices.length) >= 5 ? 'Create Free Account' : 'Sign Up / Log In'}
                  </button>
                </div>
              )}

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setView('create')}
                  className={cn("text-white p-4 h-32 rounded-3xl font-bold flex flex-col items-center justify-center gap-3 transition-all active:scale-95 shadow-lg", getThemeColorClass())}
                >
                  <div className="bg-white/20 p-3 rounded-2xl">
                    <Plus size={24} strokeWidth={3} />
                  </div>
                  <span className="uppercase text-[10px] tracking-widest">New Receipt</span>
                </button>

                <button
                  onClick={() => setView('create_invoice')}
                  className={cn(
                    "p-4 h-32 rounded-3xl font-bold flex flex-col items-center justify-center gap-3 transition-all active:scale-95 border-2",
                    "bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <div className="bg-slate-100 p-3 rounded-2xl text-slate-800">
                    <FileText size={24} strokeWidth={3} />
                  </div>
                  <span className="uppercase text-[10px] tracking-widest">New Invoice</span>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                <button
                  onClick={() => setActiveTab('receipts')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    activeTab === 'receipts' ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Receipts {receipts.length > 0 && `(${receipts.length})`}
                </button>
                <button
                  onClick={() => setActiveTab('invoices')}
                  className={cn(
                    "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    activeTab === 'invoices' ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Invoices {invoices.length > 0 && `(${invoices.length})`}
                </button>
              </div>

              {/* Search Bar */}
              {(activeTab === 'receipts' ? receipts : invoices).length > 0 && (
                <div className="relative group px-1">
                  <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Search size={16} strokeWidth={3} />
                  </div>
                  <input 
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all placeholder:text-slate-300"
                  />
                </div>
              )}

              {/* History */}
              <div className="space-y-3 pb-8">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-slate-400">
                    <History size={16} />
                    <span className="text-xs uppercase font-bold tracking-widest">
                      Recent {activeTab}
                    </span>
                  </div>
                  {isLoadingHistory && <RefreshCw size={12} className="animate-spin text-blue-500" />}
                </div>
                
                {(activeTab === 'receipts' ? receipts : invoices).length === 0 ? (
                  <div className="text-center py-16 bg-slate-100/30 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <div className="mb-4 flex flex-col items-center gap-2">
                       {activeTab === 'receipts' ? <Plus className="text-slate-300" /> : <FileText className="text-slate-300" />}
                       <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No {activeTab} yet</p>
                    </div>
                    {activeTab === 'invoices' && (
                      <button 
                        onClick={() => setView('create_invoice')}
                        className="text-[9px] font-black uppercase text-blue-500 hover:underline"
                      >
                        + Create an Invoice
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {activeTab === 'receipts' ? (
                      receipts
                        .filter(r => 
                          r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        )
                        .map((receipt) => (
                        <div 
                          key={receipt.id}
                          onClick={() => {
                            setCurrentReceipt(receipt);
                            setView('preview');
                          }}
                          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer group relative flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg", currentThemeText.replace('text-', 'bg-').replace('-600', '-50'), currentThemeText)}>
                              {receipt.customerName ? receipt.customerName[0].toUpperCase() : 'C'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-black text-slate-800 uppercase tracking-tighter">{receipt.customerName || 'Customer'}</h4>
                                {receipt._synced && <Cloud size={10} className="text-blue-400" />}
                              </div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {new Date(receipt.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })} • {receipt.items.length} items
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 pr-2">
                             <div className="text-right">
                                <p className="font-black text-slate-900 text-lg tracking-tighter">₦{receipt.total.toLocaleString()}</p>
                                <p className="text-[8px] font-black uppercase text-slate-300 tracking-widest">{receipt.id.slice(0, 8)}</p>
                             </div>

                             <button
                               onClick={(e) => {
                                 e.stopPropagation();
                                 handleDuplicate('receipt', receipt);
                               }}
                               className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                               title="Duplicate Receipt"
                             >
                               <Copy size={15} />
                             </button>

                             <ChevronRight className="text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" size={18} strokeWidth={3} />
                          </div>
                          
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (confirm('Permanently delete this record?')) {
                                handleDeleteReceipt(receipt.id);
                              }
                            }}
                            className="absolute -right-8 group-hover:right-2 opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-95"
                            title="Delete Receipt"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    ) : (
                      invoices
                        .filter(i => 
                          i.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((invoice) => (
                        <div 
                          key={invoice.id}
                          onClick={() => {
                            setCurrentInvoice(invoice);
                            setView('preview_invoice');
                          }}
                          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer group relative flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg bg-blue-50 text-blue-600")}>
                              {invoice.customerName ? invoice.customerName[0].toUpperCase() : 'C'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-black text-slate-800 uppercase tracking-tighter">{invoice.customerName || 'Customer'}</h4>
                                {invoice._synced && <Cloud size={10} className="text-blue-400" />}
                              </div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                {invoice.invoiceNumber} • DU {new Date(invoice.dueDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 md:gap-3 pr-2">
                             <div className="text-right">
                                <p className="font-black text-slate-900 text-lg tracking-tighter">₦{invoice.total.toLocaleString()}</p>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleInvoiceStatus(invoice);
                                  }}
                                  className={cn(
                                    "text-[8px] font-black uppercase px-2 py-0.5 rounded-full hover:scale-105 transition-transform",
                                    invoice.status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                                  )}
                                  title="Click to toggle Paid/Pending"
                                >
                                  {invoice.status}
                                </button>
                             </div>

                             <div className="flex items-center gap-1">
                               <button
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleConvertInvoiceToReceipt(invoice);
                                 }}
                                 className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                 title="Issue Receipt for this Invoice"
                               >
                                 + Receipt
                               </button>

                               <button
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleDuplicate('invoice', invoice);
                                 }}
                                 className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                 title="Duplicate Invoice"
                               >
                                 <Copy size={15} />
                               </button>
                             </div>

                             <ChevronRight className="text-slate-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" size={18} strokeWidth={3} />
                          </div>
                          
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (confirm('Permanently delete this invoice?')) {
                                handleDeleteInvoice(invoice.id);
                              }
                            }}
                            className="absolute -right-8 group-hover:right-2 opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all active:scale-95"
                            title="Delete Invoice"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Cloud Sync Upsell */}
              {!user && (
                <div className="bg-blue-600 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl shadow-blue-100 mt-4">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                   <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                          <Cloud size={18} />
                          <h4 className="font-black uppercase tracking-[0.2em] text-xs">Cloud Backup</h4>
                        </div>
                        <p className="text-[11px] font-bold opacity-80 uppercase tracking-wider">Sync records across all your devices.</p>
                      </div>
                      <button 
                        onClick={() => setIsAuthModalOpen(true)}
                        className="whitespace-nowrap px-6 py-3 bg-white text-blue-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-50 transition-all active:scale-95"
                      >
                        Login to Sync
                      </button>
                   </div>
                </div>
              )}
            </motion.div>
          )}

          {(view === 'create' || view === 'create_invoice') && (
            <motion.div
              key={view}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col md:flex-row gap-6 md:items-start w-full"
            >
              <div 
                className={cn(
                  "w-full",
                  view === 'create_invoice' ? "md:w-[380px] lg:w-[420px] shrink-0" : "flex-grow md:w-7/12"
                )}
                style={{ '--theme-primary': businessInfo?.themeColor === 'green' ? '#10b981' : businessInfo?.themeColor === 'purple' ? '#a855f7' : businessInfo?.themeColor === 'orange' ? '#f97316' : businessInfo?.themeColor === 'red' ? '#dc2626' : businessInfo?.themeColor === 'dark' ? '#0f172a' : '#2563eb' } as React.CSSProperties}
              >
                {/* Form Navigation Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 mb-6 backdrop-blur-md">
                  <button
                    onClick={() => setView('create')}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      view === 'create' ? "bg-white shadow-md text-blue-600" : "text-slate-400 hover:text-slate-600"
                    )}
                    style={view === 'create' ? { color: 'var(--theme-primary, #2563eb)' } : {}}
                  >
                    <div className="flex items-center justify-center gap-2">
                       <Plus size={12} strokeWidth={4} />
                       Create Receipt
                    </div>
                  </button>
                  <button
                    onClick={() => setView('create_invoice')}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      view === 'create_invoice' ? "bg-white shadow-md text-blue-600" : "text-slate-400 hover:text-slate-600"
                    )}
                    style={view === 'create_invoice' ? { color: 'var(--theme-primary, #2563eb)' } : {}}
                  >
                    <div className="flex items-center justify-center gap-2">
                       <FileText size={12} strokeWidth={4} />
                       Create Invoice
                    </div>
                  </button>
                </div>

                {view === 'create' ? (
                  <ReceiptForm 
                    onSubmit={handleCreateReceipt} 
                    onChange={handleReceiptChange}
                    initialData={receiptInitialData}
                  />
                ) : (
                  <InvoiceForm 
                    onSubmit={handleCreateInvoice} 
                    onChange={handleInvoiceChange}
                    selectedTemplate={businessInfo?.template || 'classic'}
                    initialData={invoiceInitialData}
                  />
                )}
              </div>
              
              <div 
                className={cn(
                  "hidden md:block sticky top-24",
                  view === 'create_invoice' ? "flex-1 min-w-0" : "md:w-5/12"
                )}
              >
                 {/* Template Selector Above Preview */}
                 <div className="mb-4">
                   <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                     {(['classic', 'modern', 'minimal'] as const).map((t) => (
                       <button
                         key={t}
                         onClick={() => businessInfo && setBusinessInfo({ ...businessInfo, template: t })}
                         className={cn(
                           "py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                           businessInfo?.template === t 
                             ? "bg-white shadow-sm text-slate-900 border border-slate-200" 
                             : "text-slate-400 hover:text-slate-600"
                         )}
                       >
                         {t}
                       </button>
                     ))}
                   </div>
                 </div>

                 <div className={cn("bg-slate-200 rounded-2xl flex flex-col items-center justify-center min-h-[500px]", (view === 'create_invoice' || view === 'preview_invoice') ? "p-4" : "p-8")}>
                    <div className={cn("overflow-hidden shadow-2xl rounded-sm w-full mx-auto", (view === 'create_invoice' || view === 'preview_invoice') ? "max-w-[850px]" : "max-w-[320px]")}>
                      {view === 'create' ? (
                        currentReceipt && businessInfo && (
                          <ReceiptPreview 
                            receipt={currentReceipt} 
                            business={businessInfo} 
                          />
                        )
                      ) : (
                        currentInvoice && businessInfo && (
                          <InvoicePreview 
                            invoice={currentInvoice} 
                            business={businessInfo} 
                          />
                        )
                      )}
                      {!currentReceipt && !currentInvoice && (
                        <div className="bg-white p-12 text-center text-slate-300 italic text-sm">
                          Start typing to see preview...
                        </div>
                      )}
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {(view === 'preview' || view === 'preview_invoice') && (
            <motion.div
              key={view}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "flex flex-col gap-8 items-start justify-center pb-20 w-full mx-auto",
                view === 'preview_invoice' ? "lg:flex-row lg:max-w-6xl" : "md:flex-row"
              )}
            >
              <div className={cn(
                "flex flex-col gap-4 w-full",
                view === 'preview_invoice' ? "lg:flex-grow lg:max-w-[850px]" : "md:w-5/12 lg:w-4/12"
              )}>
                <div className={cn(
                  "bg-slate-200 rounded-3xl flex items-center justify-center relative w-full",
                  view === 'preview_invoice' ? "p-4 md:p-6 lg:p-8" : "p-6 md:p-10"
                )}>
                  {(view === 'preview' ? currentReceipt?._synced : currentInvoice?._synced) && (
                    <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-1 rounded-full shadow-lg animate-in fade-in zoom-in duration-300">
                      <Cloud size={12} className="fill-white/20" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Saved to Cloud</span>
                    </div>
                  )}
                  <div className={cn(
                    "overflow-hidden shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] rounded-sm w-full",
                    view === 'preview_invoice' ? "max-w-[850px]" : "max-w-[340px]"
                  )}>
                    {view === 'preview' && currentReceipt ? (
                      <ReceiptPreview 
                        ref={exportRef}
                        receipt={currentReceipt} 
                        business={businessInfo!} 
                      />
                    ) : (
                      currentInvoice && (
                        <InvoicePreview 
                          ref={exportRef}
                          invoice={currentInvoice} 
                          business={businessInfo!} 
                        />
                      )
                    )}
                  </div>
                </div>

                {/* Quick Template Switcher */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-white border border-slate-200 rounded-xl shadow-sm">
                  {(['classic', 'modern', 'minimal'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => businessInfo && setBusinessInfo({ ...businessInfo, template: t })}
                      className={cn(
                        "py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all",
                        businessInfo?.template === t 
                          ? "bg-slate-900 text-white" 
                          : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className={cn(
                "w-full flex flex-col gap-4 text-[#000033]",
                view === 'preview_invoice' ? "lg:w-[350px] shrink-0" : "md:w-5/12"
              )}>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                   <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Export Options</h3>
                   
                   <div className="mb-6 space-y-2">
                     <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Custom Filename</label>
                     <input 
                        type="text"
                        value={customFilename}
                        onChange={(e) => setCustomFilename(e.target.value)}
                        placeholder={getFilename('', view === 'preview' ? 'receipt' : 'invoice').replace('.', '')}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                     />
                   </div>

                  <div className="space-y-3">
                      {/* Direct WhatsApp Share */}
                      <button
                        onClick={() => handleWhatsAppShare(view === 'preview' ? 'receipt' : 'invoice')}
                        className="w-full flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl font-bold transition-all active:scale-95 shadow-lg shadow-emerald-600/20 text-sm"
                      >
                        <MessageCircle size={18} />
                        Share via WhatsApp
                      </button>

                      <button
                        onClick={() => shareReceipt(view === 'preview' ? 'receipt' : 'invoice')}
                        className={cn("w-full flex items-center justify-center gap-2.5 text-white py-3 rounded-xl font-bold transition-all active:scale-95 shadow-md text-sm", getThemeColorClass())}
                      >
                        <Share2 size={18} />
                        Share Image Link
                      </button>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => downloadReceipt('png', view === 'preview' ? 'receipt' : 'invoice')}
                          className="flex items-center justify-center gap-2 bg-white text-slate-900 py-3 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-all text-xs shadow-sm"
                        >
                          <Download size={16} />
                          PNG
                        </button>
                        <button
                          onClick={() => downloadReceipt('pdf', view === 'preview' ? 'receipt' : 'invoice')}
                          className="flex items-center justify-center gap-2 bg-white text-slate-900 py-3 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-all text-xs shadow-sm"
                        >
                          <Download size={16} />
                          PDF
                        </button>
                      </div>

                      {/* Invoice Specific Actions */}
                      {view === 'preview_invoice' && currentInvoice && (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleConvertInvoiceToReceipt(currentInvoice)}
                            className="w-full flex items-center justify-center gap-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 py-2.5 rounded-xl font-bold border border-emerald-200 transition-all text-xs"
                          >
                            <CheckCircle2 size={15} />
                            Issue Official Receipt
                          </button>

                          <button
                            onClick={() => handleToggleInvoiceStatus(currentInvoice)}
                            className={cn(
                              "w-full flex items-center justify-center gap-2 py-2 rounded-xl font-bold transition-all text-xs border",
                              currentInvoice.status === 'paid' 
                                ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200" 
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            )}
                          >
                            Mark as {currentInvoice.status === 'paid' ? 'Pending' : 'Paid'}
                          </button>
                        </div>
                      )}

                      {/* Fast Repeat / Duplicate Controls */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleDuplicate(view === 'preview' ? 'receipt' : 'invoice')}
                          className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 py-2.5 rounded-xl font-bold text-xs transition-all"
                        >
                          <Copy size={14} />
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleCreateAnother(view === 'preview' ? 'receipt' : 'invoice')}
                          className="flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2.5 rounded-xl font-bold text-xs transition-all"
                        >
                          <Plus size={14} strokeWidth={3} />
                          New {view === 'preview' ? 'Receipt' : 'Invoice'}
                        </button>
                      </div>

                      <div className="relative py-1">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                        <div className="relative flex justify-center uppercase font-black text-[9px] tracking-[0.3em] text-slate-300 bg-white px-3">Cloud Sync</div>
                      </div>

                      {(view === 'preview' ? currentReceipt?._synced : currentInvoice?._synced) ? (
                        <button
                          disabled={isSaving}
                          onClick={() => handleRemoveFromCloud((view === 'preview' ? currentReceipt?.id : currentInvoice?.id)!, view === 'preview' ? 'receipt' : 'invoice')}
                          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black uppercase text-[10px] tracking-wider bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-all active:scale-[0.98]"
                        >
                          {isSaving ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <>
                              <CloudOff size={16} />
                              Remove from Cloud
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          disabled={isSaving}
                          onClick={() => view === 'preview' ? handleSaveToCloud(currentReceipt!) : handleSaveInvoiceToCloud(currentInvoice!)}
                          className={cn(
                            "w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black uppercase text-[10px] tracking-wider transition-all active:scale-[0.98]",
                            "bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 shadow-sm"
                          )}
                        >
                          {isSaving ? (
                            <RefreshCw size={16} className="animate-spin" />
                          ) : (
                            <>
                              <Cloud size={16} />
                              Save to Cloud
                            </>
                          )}
                        </button>
                      )}

                      {!user && (
                         <div className="flex items-center gap-2 p-2.5 bg-blue-50/50 rounded-xl">
                            <Info size={14} className="text-blue-500 shrink-0" />
                            <p className="text-[8px] font-bold text-blue-600 uppercase tracking-tighter">Sync your history across all devices instantly.</p>
                         </div>
                      )}

                      <button
                        onClick={() => {
                          setView('dashboard');
                          setCustomFilename('');
                        }}
                        className="w-full flex items-center justify-center gap-2 text-slate-400 py-1.5 font-black uppercase text-[10px] tracking-[0.2em] hover:text-slate-800 transition-colors"
                      >
                        Back to History
                      </button>
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'stats' && (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <AnalyticsDashboard onBack={() => setView('dashboard')} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="p-8 text-center bg-slate-100/50">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">Secure Digital Records</p>
        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">© 2026 QUICK RECIEPT · ENTERPRISE EDITION</p>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingDoc(null);
        }}
        businessName={businessInfo?.name}
        reason={authReason}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
