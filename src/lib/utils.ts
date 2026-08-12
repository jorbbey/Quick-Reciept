import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('NGN', '₦');
}

export function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function generateWhatsAppMessage(options: {
  type: 'receipt' | 'invoice';
  id: string;
  customerName: string;
  total: number;
  businessName?: string;
  currency?: string;
  items?: { name: string; quantity: number; price: number }[];
  date?: string;
  status?: string;
}) {
  const { type, id, customerName, total, businessName, currency = '₦', items = [], date, status } = options;
  const isReceipt = type === 'receipt';
  const docTitle = isReceipt ? 'RECEIPT' : 'INVOICE';
  const displayId = id.split('-').pop() || id.slice(-6);

  let msg = `*${businessName ? businessName.toUpperCase() : 'QUICK RECEIPT'}*\n`;
  msg += `---------------------------------\n`;
  msg += `🧾 *OFFICIAL ${docTitle}* #${displayId}\n`;
  if (date) msg += `📅 Date: ${new Date(date).toLocaleDateString()}\n`;
  if (status) msg += `📌 Status: ${status.toUpperCase()}\n`;
  msg += `👤 Customer: ${customerName}\n`;
  msg += `---------------------------------\n`;

  if (items.length > 0) {
    msg += `*Items:*\n`;
    items.forEach(item => {
      msg += `• ${item.name} (x${item.quantity}) - ${currency}${item.price.toLocaleString()}\n`;
    });
    msg += `---------------------------------\n`;
  }

  msg += `💰 *TOTAL AMOUNT: ${currency}${total.toLocaleString()}*\n\n`;
  msg += `Thank you for your business! 🙏\n`;
  msg += `_Generated via Quick Receipt_`;

  return encodeURIComponent(msg);
}

export function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
