import React, { useState } from 'react';
import { 
  Receipt as ReceiptIcon, 
  FileText, 
  Check, 
  X, 
  CheckCircle2, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { BusinessInfo } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface TemplatesViewProps {
  businessInfo: BusinessInfo | null;
  onUpdateTemplate: (type: 'receipt' | 'invoice', template: 'classic' | 'modern' | 'minimal') => void;
  onCreateReceipt: (template?: 'classic' | 'modern' | 'minimal') => void;
  onCreateInvoice: (template?: 'classic' | 'modern' | 'minimal') => void;
}

interface TemplateItem {
  id: 'classic' | 'modern' | 'minimal';
  name: string;
  shortDesc: string;
  bulletPoints: string[];
  preview: React.ReactNode;
}

export default function TemplatesView({
  businessInfo,
  onUpdateTemplate,
  onCreateReceipt,
  onCreateInvoice
}: TemplatesViewProps) {
  const [activeTab, setActiveTab] = useState<'receipts' | 'invoices'>('receipts');
  const [selectedTemplate, setSelectedTemplate] = useState<{
    type: 'receipt' | 'invoice';
    item: TemplateItem;
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentReceiptTemplate = businessInfo?.receiptTemplate || businessInfo?.template || 'classic';
  const currentInvoiceTemplate = businessInfo?.invoiceTemplate || businessInfo?.template || 'classic';

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  const getThemeHex = () => {
    switch (businessInfo?.themeColor) {
      case 'green': return '#10b981';
      case 'purple': return '#a855f7';
      case 'orange': return '#f97316';
      case 'red': return '#dc2626';
      case 'dark': return '#0f172a';
      default: return '#2563eb';
    }
  };

  const themeHex = getThemeHex();
  const currency = businessInfo?.currency || '₦';

  // Receipt templates
  const receiptTemplates: TemplateItem[] = [
    {
      id: 'classic',
      name: 'Classic Receipt',
      shortDesc: 'Traditional thermal and POS style receipt with monospace font, dashed borders, and itemized calculations.',
      bulletPoints: [
        'Monospace receipt styling with authentic POS borders',
        'Itemized table with subtotal and sales breakdown',
        'Clean centered header and footer greeting'
      ],
      preview: (
        <div className="bg-white p-2.5 font-mono text-[8px] text-slate-800 rounded-lg border border-slate-200 shadow-2xs space-y-1.5 w-full select-none">
          <div className="w-full h-1 bg-blue-600 rounded-full" style={{ backgroundColor: themeHex }} />
          <div className="text-center font-bold uppercase text-[9px] truncate">
            {businessInfo?.name || 'STORE NAME'}
          </div>
          <div className="border-t border-dashed border-slate-300 pt-1 flex justify-between text-slate-400 text-[7px]">
            <span>REC-8041</span>
            <span>TODAY</span>
          </div>
          <div className="space-y-0.5 border-t border-b border-dashed border-slate-300 py-1 text-[7.5px]">
            <div className="flex justify-between">
              <span>Item #1 x1</span>
              <span className="font-bold">{currency}14,500</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Item #2 x2</span>
              <span>{currency}3,000</span>
            </div>
          </div>
          <div className="flex justify-between font-black text-[9px]">
            <span>TOTAL</span>
            <span style={{ color: themeHex }}>{currency}17,500</span>
          </div>
        </div>
      )
    },
    {
      id: 'modern',
      name: 'Modern Header',
      shortDesc: 'High-impact design featuring your brand theme color across a bold header block and rounded cards.',
      bulletPoints: [
        'Bold colored banner header matching your active brand theme',
        'Soft rounded item cards with contemporary typography',
        'Highlighted total pill and streamlined summary'
      ],
      preview: (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-2xs text-[8px] w-full select-none">
          <div 
            className="p-2 text-white text-center font-sans relative"
            style={{ backgroundColor: themeHex }}
          >
            <div className="font-black text-[9px] uppercase tracking-wider truncate">
              {businessInfo?.name || 'MODERN VENTURES'}
            </div>
            <div className="text-[6.5px] opacity-80">OFFICIAL RECEIPT</div>
          </div>
          <div className="p-2 space-y-1.5 font-sans">
            <div className="bg-slate-50 p-1.5 rounded space-y-0.5 text-[7.5px]">
              <div className="flex justify-between font-medium">
                <span>Retainer Fee</span>
                <span className="font-bold">{currency}45,000</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-100">
              <span className="text-slate-400 font-bold text-[7px]">AMOUNT</span>
              <span className="font-black text-[9px]" style={{ color: themeHex }}>{currency}45,000</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'minimal',
      name: 'Minimalist Clean',
      shortDesc: 'Editorial layout with left vertical color rule, crisp sans-serif margins, and clean spacing.',
      bulletPoints: [
        'Minimalist left vertical rule styled with your theme color',
        'Airy margins and generous white space',
        'Distraction-free professional typography'
      ],
      preview: (
        <div className="bg-white p-2.5 font-sans text-[8px] text-slate-700 rounded-lg border border-slate-200 shadow-2xs space-y-1.5 w-full select-none">
          <div className="border-l-2 pl-1.5 space-y-0.5" style={{ borderColor: themeHex }}>
            <div className="font-black text-[9px] uppercase text-slate-900 truncate">
              {businessInfo?.name || 'STUDIO DESIGN'}
            </div>
            <div className="text-[7px] text-slate-400">Transaction Summary</div>
          </div>
          <div className="space-y-0.5 py-1 text-[7.5px]">
            <div className="flex justify-between">
              <span className="font-medium text-slate-800">Consulting (2h)</span>
              <span className="font-bold">{currency}30,000</span>
            </div>
          </div>
          <div className="pt-1 border-t border-slate-200 flex justify-between font-black text-[9px] text-slate-900">
            <span>Total</span>
            <span style={{ color: themeHex }}>{currency}30,000</span>
          </div>
        </div>
      )
    }
  ];

  // Invoice templates
  const invoiceTemplates: TemplateItem[] = [
    {
      id: 'classic',
      name: 'Executive Classic',
      shortDesc: 'Corporate commercial invoice with distinct bill-to section, payment terms, and remittance bank details.',
      bulletPoints: [
        'Formal business invoice layout with bill-to client section',
        'Payment terms, due dates, and full bank details',
        'Structured tabular item rows with itemized subtotal'
      ],
      preview: (
        <div className="bg-white p-2.5 font-sans text-[8px] text-slate-800 rounded-lg border border-slate-200 shadow-2xs space-y-1.5 w-full select-none">
          <div className="flex justify-between items-start border-b border-slate-200 pb-1">
            <div className="truncate">
              <div className="font-black text-[9px] uppercase truncate">{businessInfo?.name || 'COMMERCE LTD'}</div>
              <div className="text-[6.5px] text-slate-400">#INV-2026-001</div>
            </div>
            <span className="px-1 py-0.2 rounded text-[6.5px] font-black text-amber-700 bg-amber-50 shrink-0">
              DUE
            </span>
          </div>
          <div className="bg-slate-50 p-1.5 rounded space-y-0.5 text-[7.5px]">
            <div className="flex justify-between font-medium">
              <span>Brand Identity</span>
              <span className="font-bold">{currency}120,000</span>
            </div>
          </div>
          <div className="flex justify-between font-black text-[9px] pt-1 border-t border-slate-200">
            <span>Balance:</span>
            <span style={{ color: themeHex }}>{currency}120,000</span>
          </div>
        </div>
      )
    },
    {
      id: 'modern',
      name: 'Signature Accent',
      shortDesc: 'Signature vertical color bar, curved accent details, and bold split client and payment panels.',
      bulletPoints: [
        'Signature curved accent bar in your chosen brand color',
        'Highlighted payment balance and due date overview',
        'Contemporary multi-column client details'
      ],
      preview: (
        <div className="bg-white rounded-lg border border-slate-200 shadow-2xs flex overflow-hidden text-[8px] w-full select-none min-h-[100px]">
          <div className="w-2 shrink-0" style={{ backgroundColor: themeHex }} />
          <div className="p-2 flex-1 space-y-1.5">
            <div className="flex justify-between items-start">
              <div className="truncate">
                <div className="font-black text-[9px] uppercase tracking-wide truncate">
                  {businessInfo?.name || 'CREATIVE AGENCY'}
                </div>
                <div className="text-[6.5px] text-slate-400">INVOICE</div>
              </div>
              <span className="text-[7px] font-black shrink-0" style={{ color: themeHex }}>
                7 DAYS
              </span>
            </div>
            <div className="bg-slate-50 p-1.5 rounded space-y-0.5 text-[7.5px]">
              <div className="flex justify-between">
                <span>UI Prototyping</span>
                <span className="font-bold">{currency}85,000</span>
              </div>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-100">
              <span className="text-[7px] font-bold text-slate-400">Total:</span>
              <span className="text-[9px] font-black" style={{ color: themeHex }}>{currency}85,000</span>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'minimal',
      name: 'Airy Minimalist',
      shortDesc: 'Clean monochrome precision with light dividing rules and spacious, elegant business formatting.',
      bulletPoints: [
        'High-readability sans-serif corporate typography',
        'Delicate hairline dividers with clear total hierarchy',
        'Spacious, clutter-free agency aesthetic'
      ],
      preview: (
        <div className="bg-white p-2.5 font-sans text-[8px] text-slate-700 rounded-lg border border-slate-200 shadow-2xs space-y-1.5 w-full select-none">
          <div className="flex justify-between items-baseline border-b border-slate-100 pb-1">
            <span className="font-black text-[9px] text-slate-900 uppercase truncate">
              {businessInfo?.name || 'CONSULTING GROUP'}
            </span>
            <span className="text-[7px] font-mono text-slate-400 shrink-0">#INV-802</span>
          </div>
          <div className="py-1 space-y-0.5 text-[7.5px]">
            <div className="flex justify-between border-b border-slate-50 pb-0.5">
              <span>Financial Audit</span>
              <span className="font-semibold text-slate-900">{currency}250,000</span>
            </div>
          </div>
          <div className="pt-1 border-t border-slate-200 flex justify-between font-black text-[9px]">
            <span>Net Due</span>
            <span style={{ color: themeHex }}>{currency}250,000</span>
          </div>
        </div>
      )
    }
  ];

  const currentList = activeTab === 'receipts' ? receiptTemplates : invoiceTemplates;
  const currentDefaultId = activeTab === 'receipts' ? currentReceiptTemplate : currentInvoiceTemplate;

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2"
        >
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </motion.div>
      )}

      {/* 2 Buttons to select between receipt and invoice (no counts) */}
      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl max-w-xs mx-auto">
        <button
          type="button"
          onClick={() => setActiveTab('receipts')}
          className={cn(
            "py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer",
            activeTab === 'receipts' 
              ? "bg-white text-slate-900 shadow-xs" 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          <ReceiptIcon size={16} />
          <span>Receipt</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={cn(
            "py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer",
            activeTab === 'invoices' 
              ? "bg-white text-slate-900 shadow-xs" 
              : "text-slate-500 hover:text-slate-700"
          )}
        >
          <FileText size={16} />
          <span>Invoice</span>
        </button>
      </div>

      {/* Simple Grid of Existing Templates (2 templates per line) */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
        {currentList.map((tpl) => {
          const isDefault = currentDefaultId === tpl.id;
          return (
            <div
              key={tpl.id}
              onClick={() => setSelectedTemplate({ type: activeTab === 'receipts' ? 'receipt' : 'invoice', item: tpl })}
              className="flex flex-col items-center group cursor-pointer"
            >
              <div 
                className={cn(
                  "w-full rounded-2xl border p-3 transition-all flex flex-col justify-center min-h-[140px] sm:min-h-[160px] relative bg-white",
                  isDefault 
                    ? "border-blue-600 ring-2 ring-blue-600/15 shadow-sm" 
                    : "border-slate-200 group-hover:border-slate-300 group-hover:shadow-xs"
                )}
              >
                {/* Active default badge */}
                {isDefault && (
                  <div className="absolute top-2 right-2 z-10 bg-blue-600 text-white rounded-full p-1 shadow-xs">
                    <Check size={10} strokeWidth={3} />
                  </div>
                )}

                {/* Template Visual Preview Thumbnail */}
                <div className="w-full flex items-center justify-center transform transition-transform group-hover:scale-[1.02]">
                  {tpl.preview}
                </div>
              </div>

              {/* Template name written in a small font size below */}
              <span className={cn(
                "text-[11px] sm:text-xs font-semibold text-center mt-2 truncate w-full px-1 transition-colors",
                isDefault ? "text-blue-600 font-bold" : "text-slate-700 group-hover:text-slate-900"
              )}>
                {tpl.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Template Details Popup Modal */}
      <AnimatePresence>
        {selectedTemplate && (
          <>
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTemplate(null)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 transition-opacity"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-sm mx-auto z-50 bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900">
                    {selectedTemplate.item.name}
                  </h3>
                  <span className="text-[10px] text-slate-400 font-medium capitalize">
                    {selectedTemplate.type} Template
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTemplate(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Visual preview frame */}
              <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                {selectedTemplate.item.preview}
              </div>

              {/* Concise Descriptions */}
              <div className="space-y-1.5 pt-1">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {selectedTemplate.item.shortDesc}
                </p>
                <div className="space-y-1 pt-1">
                  {selectedTemplate.item.bulletPoints.map((point, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions: Set as Default & Create */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                {(selectedTemplate.type === 'receipt' 
                  ? currentReceiptTemplate === selectedTemplate.item.id 
                  : currentInvoiceTemplate === selectedTemplate.item.id) ? (
                  <div className="w-full py-2.5 px-4 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Currently Active Default</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateTemplate(selectedTemplate.type, selectedTemplate.item.id);
                      triggerToast(`Set ${selectedTemplate.item.name} as default ${selectedTemplate.type} template!`);
                    }}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all active:scale-98 flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20"
                  >
                    <Check size={15} />
                    <span>Set as Default Template</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const tplId = selectedTemplate.item.id;
                    const type = selectedTemplate.type;
                    setSelectedTemplate(null);
                    if (type === 'receipt') {
                      onCreateReceipt(tplId);
                    } else {
                      onCreateInvoice(tplId);
                    }
                  }}
                  className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <span>Create with this Template</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
