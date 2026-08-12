import React, { forwardRef } from 'react';
import { BusinessInfo, Receipt } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { NairaIcon } from './NairaIcon';

interface ReceiptPreviewProps {
  receipt: Receipt;
  business: BusinessInfo;
}

const ReceiptPreview = forwardRef<HTMLDivElement, ReceiptPreviewProps>(({ receipt, business }, ref) => {
  const isMinimal = business.template === 'minimal';
  const isModern = business.template === 'modern';
  
  const getThemeColor = () => {
    switch (business.themeColor) {
      case 'green': return '#10b981';
      case 'purple': return '#a855f7';
      case 'orange': return '#f97316';
      case 'red': return '#dc2626';
      case 'dark': return '#0f172a';
      default: return '#2563eb';
    }
  };

  const currency = business.currency || '₦';

  return (
    <div 
      ref={ref} 
      className={cn(
        "bg-white w-full max-w-full mx-auto relative overflow-hidden flex flex-col transition-all duration-500",
        isMinimal ? "p-4 md:p-8 font-sans text-slate-600 space-y-6 shadow-sm" : 
        isModern ? "p-0 font-sans text-slate-800 shadow-md" : 
        "px-8 py-10 font-mono text-slate-800"
      )}
      style={{ minHeight: isModern ? '600px' : '520px' }}
    >
      {/* Modern Template Header Accent */}
      {isModern && (
        <div className="h-28 w-full relative flex items-center justify-center p-6 text-white overflow-hidden shrink-0 mb-6" style={{ backgroundColor: getThemeColor() }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10 text-center">
            {business.logo ? (
              <img src={business.logo} alt={business.name} className="w-16 h-16 object-contain mx-auto mb-2 filter drop-shadow-md" />
            ) : (
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-2 border border-white/30">
                <NairaIcon size={24} />
              </div>
            )}
            <h1 className="text-base font-black uppercase tracking-widest">{business.name}</h1>
          </div>
        </div>
      )}

      {/* Design Elements for Classic */}
      {!isMinimal && !isModern && (
        <div className={cn(
          "absolute top-0 left-0 w-full h-1.5",
          business.themeColor === 'green' ? 'bg-emerald-600' :
          business.themeColor === 'purple' ? 'bg-purple-600' :
          business.themeColor === 'orange' ? 'bg-orange-600' :
          business.themeColor === 'red' ? 'bg-red-600' :
          business.themeColor === 'dark' ? 'bg-slate-900' :
          'bg-blue-600'
        )}></div>
      )}

      <div className={cn(
        "flex-1",
        isModern ? "p-8 space-y-8" : ""
      )}>
        {/* Header (Classic & Minimal) */}
        {!isModern && (
          <div className={cn(
            "mb-8",
            isMinimal ? "text-left border-l-4 pl-4" : "text-center",
          )}
          style={isMinimal ? { borderColor: getThemeColor() } : {}}
          >
            {business.logo && (
              <div className={cn("flex mb-3", isMinimal ? "justify-start" : "justify-center")}>
                <img src={business.logo} alt={business.name} className={cn("object-contain", isMinimal ? "w-12 h-12" : "w-16 h-16")} />
              </div>
            )}
            <h1 className={cn(
              "font-black uppercase tracking-tight leading-tight",
              isMinimal ? "text-xl text-slate-900" : "text-xl"
            )}>{business.name}</h1>
            {business.address && (
              <p className="text-[10px] max-w-[200px] mt-1 leading-tight opacity-60 uppercase font-bold" style={isMinimal ? {marginLeft: 0} : {margin: '4px auto 0'}}>
                {business.address}
              </p>
            )}
            {business.phone && (
              <p className="text-[10px] font-black opacity-40 mt-1 uppercase tracking-tighter">Tel: {business.phone}</p>
            )}
          </div>
        )}

        {/* Info Grid (Modern Layout Change) */}
        <div className={cn(
          "grid grid-cols-2 gap-4 mb-8",
          isModern ? "bg-slate-50 p-4 rounded-2xl border border-slate-100" : 
          isMinimal ? "border-b border-slate-100 pb-6" : 
          "border-y border-dashed border-slate-300 py-4"
        )}>
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Client Details</p>
            <p className="text-xs font-black truncate">{receipt.customerName.toUpperCase()}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Receipt No.</p>
            <p className="text-xs font-black">#{receipt.id.split('-').pop()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Date issued</p>
            <p className="text-xs font-black">{new Date(receipt.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Status</p>
            <p className={cn(
              "text-[10px] font-black italic",
              receipt.isPaid ? "text-emerald-500" : "text-red-500"
            )}>{receipt.isPaid ? 'PAID' : 'DUE'}</p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full mb-8">
          <thead>
            <tr className={cn(
              "text-[10px] font-black border-b text-slate-400 font-mono",
              isModern ? "border-slate-200" : isMinimal ? "border-slate-100" : "border-slate-200"
            )}>
              <th className="text-left pb-2 uppercase tracking-widest">Detail</th>
              <th className="text-center pb-2 uppercase tracking-widest">Qty</th>
              <th className="text-right pb-2 uppercase tracking-widest">Amount</th>
            </tr>
          </thead>
          <tbody className={cn(
            "text-[11px]",
            isModern ? "divide-y divide-slate-50" : ""
          )}>
            {receipt.items.map((item, index) => (
              <tr key={index}>
                <td className="py-2.5 font-bold uppercase">{item.name}</td>
                <td className="py-2.5 text-center font-mono">{item.quantity}</td>
                <td className="py-2.5 text-right font-black font-mono">{currency}{item.price.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className={cn(
          "space-y-2",
          isModern ? "border-t-2 pt-4" : isMinimal ? "mt-auto pt-4 border-t border-slate-100" : "border-t-2 border-double border-slate-800 pt-4",
        )}
        style={isModern ? { borderColor: getThemeColor() } : {}}
        >
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Sub-Total</span>
            <span className="text-xs font-bold text-slate-800">{currency}{(receipt.total + receipt.discount).toLocaleString()}</span>
          </div>
          {receipt.discount > 0 && (
            <div className="flex justify-between items-center text-red-500">
              <span className="text-[10px] font-bold uppercase">Discount</span>
              <span className="text-xs font-bold">-{currency}{receipt.discount.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-2">
            <span className="text-xs font-black uppercase tracking-tighter">Total Payable</span>
            <span className={cn(
              "text-xl font-black",
              isMinimal ? "text-slate-900" : ""
            )} style={!isMinimal ? { color: getThemeColor() } : {}}>
              {currency}{receipt.total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Area */}
      <div className={cn(
        "mt-auto",
        isModern ? "p-8 pt-0" : ""
      )}>
        {/* Signature */}
        {business.showSignature && business.signature && (
          <div className="mt-8 mb-6 flex justify-end flex-col items-end">
            <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Authorized Official</p>
            <img src={business.signature} alt="Signature" className="h-10 w-auto mix-blend-multiply opacity-80" />
            <div className="w-32 h-px bg-slate-200 mt-1" />
          </div>
        )}

        <div className={cn(
          "text-center py-6",
          !isMinimal && !isModern ? "border-t border-dashed" : "border-t border-slate-50"
        )}>
          <p className="text-[10px] font-bold italic opacity-60 px-4 leading-relaxed">"Thank you for your patronage! We look forward to serving you again."</p>
          
          {!isMinimal && (
             <div className="mt-4 flex justify-center opacity-30">
                <div className="flex gap-0.5 items-end h-4 font-mono overflow-hidden">
                  {[3, 5, 2, 6, 3, 7, 3, 2, 5, 4, 3, 6].map((h, i) => (
                    <div key={i} className="bg-black" style={{ width: i % 3 === 0 ? '2px' : '1px', height: `${h * 2}px` }} />
                  ))}
                </div>
             </div>
          )}

          <p className="text-[8px] font-black opacity-30 uppercase tracking-[0.2em] mt-4">
            PROCESSED BY QUICK RECIEPT SYSTEM 
          </p>
        </div>
      </div>
    </div>
  );
});


ReceiptPreview.displayName = 'ReceiptPreview';

export default ReceiptPreview;
