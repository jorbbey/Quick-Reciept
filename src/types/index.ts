export interface BusinessInfo {
  name: string;
  phone: string;
  address: string;
  logo?: string; // base64 string
  themeColor?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'dark';
  template?: 'classic' | 'modern' | 'minimal';
  receiptTemplate?: 'classic' | 'modern' | 'minimal';
  invoiceTemplate?: 'classic' | 'modern' | 'minimal';
  currency?: string; // e.g. "₦"
  signature?: string; // base64 string
  showSignature?: boolean;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  paymentInfo?: string;
  termsConditions?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  lastUsedAt: string;
}

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface InvoiceItem extends ReceiptItem {}

export interface Receipt {
  id: string;
  customerName: string;
  items: ReceiptItem[];
  discount: number;
  isPaid: boolean;
  createdAt: string;
  total: number;
  _synced?: boolean;
}

export interface Invoice {
  id: string;
  customerName: string;
  customerContact?: string;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
  dueDate: string;
  notes?: string;
  createdAt: string;
  template: 'classic' | 'modern' | 'minimal';
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  invoiceNumber: string;
  _synced?: boolean;
  paymentInfo?: string;
  questionsEmail?: string;
  termsConditions?: string;
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  paymentMethod?: string;
}
