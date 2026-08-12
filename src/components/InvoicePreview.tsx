import React, { forwardRef } from 'react';
import { BusinessInfo, Invoice } from '../types';
import { cn } from '../lib/utils';
import { NairaIcon } from './NairaIcon';

interface InvoicePreviewProps {
  invoice: Invoice;
  business: BusinessInfo;
}

const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(({ invoice, business }, ref) => {
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

  const themeColor = getThemeColor();
  const currency = business.currency || '₦';

  return (
    <div 
      ref={ref} 
      className={cn(
        "bg-white w-full max-w-full mx-auto relative overflow-hidden flex flex-col transition-all duration-500",
        isMinimal ? "p-4 md:p-6 lg:p-8 font-sans text-slate-600 shadow-sm" : 
        isModern ? "p-0 font-sans text-slate-800 shadow-md" : 
        "p-4 md:p-6 lg:p-8 font-sans text-slate-800"
      )}
      style={{ minHeight: '750px' }}
    >
      {/* MODERN STYLE (Image 1 Exact Match) */}
      {isModern && (
        <div className="flex-1 flex flex-col relative h-full">
          {/* Left Dark Sidebar with Curve - Direct Reference to Image 1 */}
          <div 
            className="absolute top-0 left-0 bottom-0 w-[35px] md:w-[48px] z-0"
            style={{ backgroundColor: themeColor }}
          >
            {/* The signature curve from the image */}
            <div className="absolute top-0 left-full w-[50px] h-[50px] bg-white rounded-tl-[50px] md:w-[70px] md:h-[70px] md:rounded-tl-[70px] z-10" />
            <div className="absolute top-0 left-0 w-[35px] md:w-[48px] h-[50px] md:h-[70px]" style={{ backgroundColor: themeColor }} />
          </div>

          <div className="flex-1 flex flex-col p-4 pl-12 md:p-6 md:pl-16 lg:p-8 lg:pl-20 z-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-4 mb-8 md:mb-10">
              <div className="flex flex-col gap-5">
                <div className="flex items-center gap-2">
                  {business.logo ? (
                    <img src={business.logo} alt={business.name} className="w-10 h-10 object-contain" />
                  ) : (
                    <div className="flex flex-col">
                      <div className="flex gap-0.5">
                        <div className="w-4 h-4 rounded-sm border-2 border-slate-900 rotate-45" />
                        <div className="w-4 h-4 rounded-sm border-2 border-slate-900 rotate-45 -ml-2" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-tighter mt-1">BRAND LOGO</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-800 mb-1 sm:mb-2">Invoice to :</h3>
                  <div className="space-y-0.5">
                     <p className="text-xs font-bold text-slate-600">{invoice.customerName}</p>
                     <p className="text-[10px] text-slate-400 max-w-[200px] leading-tight">
                       {invoice.customerContact || "24 Dummy Street Area, Location, Lorem ipsum"}
                     </p>
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right flex flex-col items-start sm:items-end w-full sm:w-auto mt-2 sm:mt-0">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-none mb-6 md:mb-8" style={{ color: themeColor }}>invoice</h1>
                <div className="grid grid-cols-2 gap-x-4 sm:gap-x-8 gap-y-1 text-left sm:text-right">
                   <p className="text-[10px] font-black text-slate-800 uppercase">Invoice#</p>
                   <p className="text-[10px] font-bold text-slate-400">{invoice.invoiceNumber.replace('INV-', '') || "5093"}</p>
                   <p className="text-[10px] font-black text-slate-800 uppercase">Date</p>
                   <p className="text-[10px] font-bold text-slate-400">{new Date(invoice.createdAt).toLocaleDateString('en-GB')}</p>
                </div>
              </div>
            </div>

            {/* Table - Image 1 Style */}
            <div className="border-y border-slate-300 mb-8 md:mb-10">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-black text-slate-800 uppercase">
                    <th className="text-left py-2.5 px-2 md:px-3 w-12">SL.</th>
                    <th className="text-left py-2.5 px-2 md:px-3">Item Description</th>
                    <th className="text-center py-2.5 px-2 md:px-3">Price</th>
                    <th className="text-center py-2.5 px-2 md:px-3">Qty.</th>
                    <th className="text-right py-2.5 px-2 md:px-3">Total</th>
                  </tr>
                </thead>
                <tbody className="text-[10px]">
                  {invoice.items.map((item, index) => (
                    <tr key={index} className={cn(index % 2 === 1 ? "bg-slate-50" : "bg-white")}>
                      <td className="py-2.5 px-2 md:px-3 font-bold text-slate-500">{String(index + 1).padStart(2, '0')}</td>
                      <td className="py-2.5 px-2 md:px-3">
                        <p className="font-bold text-slate-800">{item.name}</p>
                      </td>
                      <td className="py-2.5 px-2 md:px-3 text-center text-slate-600">{currency}{item.price.toLocaleString()}</td>
                      <td className="py-2.5 px-2 md:px-3 text-center text-slate-600">{item.quantity}</td>
                      <td className="py-2.5 px-2 md:px-3 text-right font-black text-slate-900">{currency}{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                  {/* Fill empty space to match image appearance if few items */}
                  {invoice.items.length < 5 && Array.from({ length: 5 - invoice.items.length }).map((_, i) => (
                    <tr key={`empty-${i}`} className={cn((invoice.items.length + i) % 2 === 1 ? "bg-slate-50" : "bg-white")}>
                      <td className="py-2 px-2 md:py-2.5">&nbsp;</td>
                      <td className="py-2 px-2 md:py-2.5">&nbsp;</td>
                      <td className="py-2 px-2 md:py-2.5">&nbsp;</td>
                      <td className="py-2 px-2 md:py-2.5">&nbsp;</td>
                      <td className="py-2 px-2 md:py-2.5">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Info Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 mt-2">
              <div className="space-y-5">
                <div>
                  <h4 className="text-[11px] font-black text-slate-800 mb-0.5 sm:mb-1">Thanks for your business</h4>
                  <p className="text-[9px] font-bold text-slate-800 mb-0.5 font-sans">Terms & Conditions</p>
                  <p className="text-[8px] text-slate-400 max-w-[220px] leading-tight">
                    {invoice.termsConditions || "Lorem ipsum is simply dummy text of the printing and typesetting industry."}
                  </p>
                </div>
                {invoice.notes && (
                  <div>
                    <h4 className="text-[9px] font-bold text-slate-800 mb-0.5 font-sans uppercase tracking-wider">Additional Notes</h4>
                    <p className="text-[8px] text-slate-400 max-w-[220px] leading-tight whitespace-pre-line">
                      {invoice.notes}
                    </p>
                  </div>
                )}
                <div>
                   <h4 className="text-[11px] font-black text-slate-800 mb-0.5 sm:mb-1">Payment info:</h4>
                   <div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-0.5 text-[9px] font-bold">
                      {invoice.paymentInfo && (
                        <>
                          <span className="text-slate-800">Method:</span>
                          <span className="text-slate-400">{invoice.paymentInfo}</span>
                        </>
                      )}
                      <span className="text-slate-800">Account #:</span>
                      <span className="text-slate-400">{invoice.accountNumber || "1234567890"}</span>
                      <span className="text-slate-800">A/C Name:</span>
                      <span className="text-slate-400">{invoice.accountName || business.name || "Lorem ipsum"}</span>
                      <span className="text-slate-800">Bank Details:</span>
                      <span className="text-slate-400">{invoice.bankName || "Add your Bank details"}</span>
                   </div>
                </div>
              </div>
              <div className="flex flex-col items-stretch md:items-end justify-start">
                <div className="w-full md:max-w-[240px] space-y-1 mb-3">
                  <div className="flex justify-between text-[10px] font-black uppercase">
                    <span className="text-slate-800">Sub Total:</span>
                    <span className="text-slate-800">{currency}{invoice.subtotal.toLocaleString()}</span>
                  </div>
                </div>
                <div className="w-full md:max-w-[240px] bg-slate-900 text-white flex justify-between items-center px-4 py-2" style={{ backgroundColor: themeColor }}>
                  <span className="text-[11px] font-black uppercase tracking-widest">Total:</span>
                  <span className="text-sm font-black">{currency}{invoice.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Signature Area */}
            <div className="mt-auto pt-6 flex justify-between items-end gap-4">
               <p className="text-[10px] font-bold text-slate-800 tracking-tight">Phone # / Address / Website</p>
               <div className="text-center shrink-0">
                  {business.showSignature && business.signature && (
                    <img src={business.signature} alt="Signature" className="h-8 w-auto mix-blend-multiply mb-1 mx-auto" />
                  )}
                  <div className="border-t border-slate-400 w-32 md:w-36 pt-1">
                    <p className="text-[9px] font-black text-slate-800">Author Signature</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MINIMAL STYLE (Image 3 Refinement) */}
      {isMinimal && (
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 md:mb-10">
            <div className="flex items-center gap-4">
              {business.logo ? (
                <img src={business.logo} alt={business.name} className="w-12 h-12 object-contain" />
              ) : (
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center border-2 border-slate-100">
                   <NairaIcon size={20} className="text-slate-300" />
                </div>
              )}
              <div>
                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">{business.name}</h1>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Business. Name.</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase" style={{ color: themeColor }}>INVOICE</h2>
              <p className="text-xs font-bold text-slate-400 mt-1">{new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-10 text-slate-800">
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 font-mono">Office Address</p>
                <p className="text-xs font-bold leading-relaxed uppercase">{business.address || "Main Street, business center"}</p>
                <p className="text-xs font-bold mt-1">{business.phone}</p>
              </div>
            </div>
            <div className="text-left md:text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 font-mono">To:</p>
                <p className="text-sm font-black uppercase">{invoice.customerName}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase"># {invoice.invoiceNumber}</p>
            </div>
          </div>

          <table className="w-full mb-6 text-[11px] sm:text-xs">
            <thead style={{ backgroundColor: themeColor + '20' }}>
              <tr className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                <th className="text-left py-2.5 px-3 rounded-l-lg" style={{ color: themeColor }}>Items Description</th>
                <th className="text-center py-2.5 px-2" style={{ color: themeColor }}>Unit Price</th>
                <th className="text-center py-2.5 px-2" style={{ color: themeColor }}>Qnt</th>
                <th className="text-right py-2.5 px-3 rounded-r-lg" style={{ color: themeColor }}>Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td className="py-3 px-3">
                    <p className="font-bold uppercase text-[11px] sm:text-xs">{item.name}</p>
                    <p className="text-[9px] text-slate-400 font-medium mt-0.5 italic">Standard item description placeholder</p>
                  </td>
                  <td className="py-3 px-2 text-center font-mono text-slate-500 text-nowrap">{currency}{item.price.toLocaleString()}</td>
                  <td className="py-3 px-2 text-center font-mono text-slate-500">{item.quantity}</td>
                  <td className="py-3 px-3 text-right font-black font-mono text-nowrap">{currency}{(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mt-auto">
             <div className="max-w-full md:max-w-[280px]">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Thank you for your Business</p>
                <div className="space-y-3">
                   <div>
                      <p className="text-[10px] font-black text-slate-900 uppercase mb-0.5">Questions?</p>
                      <p className="text-[9px] text-slate-400">Email us: {invoice.questionsEmail || "info@business.com"}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-slate-900 uppercase mb-0.5">Payment Info :</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{invoice.paymentInfo || "Bank: First Bank | Acc: 1234567890"}</p>
                   </div>
                   {invoice.notes && (
                      <div>
                         <p className="text-[10px] font-black text-slate-900 uppercase mb-0.5">Additional Notes :</p>
                         <p className="text-[9px] text-slate-400 whitespace-pre-line leading-relaxed">{invoice.notes}</p>
                      </div>
                   )}
                </div>
             </div>
             <div className="w-full md:w-64 space-y-2.5 shrink-0">
                <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400">
                   <span>SUBTOTAL :</span>
                   <span className="text-slate-900 font-mono">{currency}{invoice.subtotal.toLocaleString()}</span>
                </div>
                <div className="bg-slate-900 text-white p-4 rounded-lg flex items-center justify-between" style={{ backgroundColor: themeColor }}>
                   <span className="text-[10px] font-black uppercase tracking-widest">TOTAL DUE :</span>
                   <span className="text-lg font-black font-mono">{currency}{invoice.total.toLocaleString()}</span>
                </div>
             </div>
          </div>
          {business.showSignature && business.signature && (
            <div className="mt-6 flex justify-end">
              <div className="text-right">
                <img src={business.signature} alt="Signature" className="h-10 w-auto mix-blend-multiply mb-1 ml-auto" />
                <p className="text-[9px] font-black uppercase text-slate-400 border-t border-slate-200 pt-1">Authorized Signature</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CLASSIC STYLE (Image 2 Refinement) */}
      {!isModern && !isMinimal && (
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-4 mb-8 md:mb-10">
            <div className="border-l-[10px] pl-6 min-h-[6.5rem] md:min-h-[7.5rem] flex flex-col justify-between py-1" style={{ borderLeftColor: themeColor }}>
              <div>
                 <h1 className="text-2xl md:text-3xl font-black italic leading-none" style={{ color: themeColor }}>
                   {business.name.split(' ').length > 1 ? (
                     <>
                       {business.name.split(' ')[0]}
                       <br />
                       <span className="text-slate-800 text-xs md:text-sm not-italic opacity-40 uppercase tracking-widest">{business.name.split(' ').slice(1).join(' ')}</span>
                     </>
                   ) : business.name}
                 </h1>
                 <p className="text-[8px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Premium services provided</p>
              </div>
              <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest mt-2 sm:mt-0">NO/ISN {invoice.invoiceNumber.replace('INV-', '')}</p>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-black opacity-90 leading-none select-none tracking-tighter" style={{ color: themeColor }}>INVOICE</h2>
              <p className="text-sm font-black text-slate-900 mt-2 font-mono">{new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              
              <div className="mt-6 md:mt-10 space-y-1 text-slate-800">
                 <p className="text-[10px] font-black text-slate-400 uppercase">TO.</p>
                 <p className="text-lg font-black uppercase leading-none">{invoice.customerName}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 md:mt-4">Company Name</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase">{business.address}</p>
              </div>
            </div>
          </div>

          <table className="w-full mb-8 border-y-2 border-slate-900 text-xs sm:text-sm">
            <thead>
              <tr className="text-xs font-black text-slate-900 uppercase tracking-widest border-b-2 border-slate-900">
                <th className="text-center py-2 px-2 w-16">QTY</th>
                <th className="text-left py-2 px-3 md:px-4">DESCRIPTION</th>
                <th className="text-right py-2 px-2">PRICE</th>
                <th className="text-right py-2 px-2">TOTAL</th>
              </tr>
            </thead>
            <tbody className="text-xs font-bold text-slate-700">
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b border-slate-100">
                  <td className="py-2.5 px-2 text-center text-slate-900 font-mono">{item.quantity}</td>
                  <td className="py-2.5 px-3 md:px-4">
                    <p className="font-black text-slate-900 uppercase">{item.name}</p>
                    <p className="text-[10px] text-slate-400 italic mt-0.5 font-medium">Detailed item description for professional reference</p>
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono text-nowrap">{currency}{item.price.toLocaleString()}</td>
                  <td className="py-2.5 px-2 text-right font-black text-slate-900 font-mono text-nowrap">{currency}{(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mt-auto">
            <div className="space-y-6 md:space-y-8">
               <div className="bg-slate-50 p-4 md:p-6 rounded-r-3xl border-l-[6px]" style={{ borderLeftColor: themeColor }}>
                  <h4 className="text-[10px] font-black text-slate-900 uppercase mb-2 md:mb-3">Payment Method</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
                    {invoice.paymentMethod || "Please make payments through official bank channels within 7 days of invoice date."}
                  </p>
               </div>
               
               <div className="px-4 md:px-6">
                  <h4 className="text-[10px] font-black text-slate-900 uppercase mb-2 md:mb-3 tracking-widest">Terms & Condition</h4>
                  <p className="text-[9px] text-slate-400 leading-relaxed uppercase">
                    {invoice.termsConditions || `Interest may be charged on late payments. All goods remain property of ${business.name} until paid in full.`}
                  </p>
               </div>
               {invoice.notes && (
                  <div className="px-4 md:px-6">
                     <h4 className="text-[10px] font-black text-slate-900 uppercase mb-2 md:mb-3 tracking-widest">Additional Notes</h4>
                     <p className="text-[9px] text-slate-400 leading-relaxed uppercase whitespace-pre-line">
                       {invoice.notes}
                     </p>
                  </div>
               )}
            </div>

            <div className="space-y-4">
              <div className="space-y-3 border-b border-slate-200 pb-4 md:pb-6 pr-4 md:pr-6">
                 <div className="flex justify-between items-center text-xs font-black text-slate-400 uppercase">
                    <span>Sub Total</span>
                    <span className="text-slate-900 font-mono">{currency}{invoice.subtotal.toLocaleString()}</span>
                  </div>
              </div>

              <div className="flex items-center">
                 <div className="flex-1 text-white p-3 md:p-4 font-black uppercase text-xs tracking-widest text-center" style={{ backgroundColor: themeColor }}>GRAND TOTAL</div>
                 <div className="px-6 md:px-8 py-3 md:py-4 bg-slate-100 border-2 rounded-r-lg font-black text-slate-900 text-xl md:text-2xl border-l-0 font-mono" style={{ borderColor: themeColor }}>
                    {currency}{invoice.total.toLocaleString()}
                 </div>
              </div>
            </div>
          </div>
          {business.showSignature && business.signature && (
            <div className="mt-6 md:mt-8 flex justify-end">
              <div className="text-right">
                <img src={business.signature} alt="Signature" className="h-10 w-auto mix-blend-multiply mb-1 ml-auto" />
                <p className="text-[9px] font-black uppercase text-slate-400 border-t border-slate-200 pt-1">Authorized Signature</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

InvoicePreview.displayName = 'InvoicePreview';

export default InvoicePreview;
