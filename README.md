# Quick Receipt & Invoice Generator

**Quick Receipt** is a fast, professional receipt and invoice management application designed for small businesses, online vendors, and freelancers. It enables merchants to create, customize, export, and share sleek receipts and invoices with clients in seconds.

---

## 🌟 Core Features

- **⚡ Instant Document Generation**: Create professional receipts and invoices in under 10 seconds.
- **🎨 Custom Templates & Branding**:
  - Upload business logos & signature images.
  - Choose between Classic, Modern, and Minimalist document templates.
  - Personalize accent colors and default currency symbols (`₦`, `$`, `€`, `£`, `GH₵`, `KSh`).
- **📱 WhatsApp Direct Sharing**: Pre-formatted WhatsApp messages for instant customer delivery with itemized summaries and totals.
- **📄 Export & Download**: Export generated documents as high-resolution **PNG** images or multi-page **PDF** files.
- **🔄 Fast Workflows**:
  - **1-Click Duplication**: Duplicate previous receipts or invoices for recurring customers.
  - **Invoice to Receipt Conversion**: Instantly convert pending/paid invoices into official receipts.
  - **Status Toggle**: Easily switch invoices between *Paid* and *Pending*.
- **☁️ Sync & Backup**:
  - Works offline out-of-the-box using local storage.
  - Optional Supabase integration for cloud syncing across devices.
  - Bulk export history and profile data as a `.zip` archive.
- **📊 Business Analytics**: Track sales trends, total revenue, and document history at a glance.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion (Framer Motion)
- **Icons**: Lucide React
- **Export Engines**: `html-to-image`, `jspdf`, `jszip`
- **Database / Auth**: Supabase (`@supabase/supabase-js`)
- **Build Tool**: Vite

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` package manager

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd quick-receipt
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables** (Optional for cloud sync):
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 📂 Project Structure

```
├── src/
│   ├── components/       # React UI Components
│   │   ├── BusinessSetup.tsx   # Business Profile & Settings
│   │   ├── ReceiptForm.tsx     # Receipt Generator Form
│   │   ├── InvoiceForm.tsx     # Invoice Generator Form
│   │   ├── ReceiptPreview.tsx  # Dynamic Receipt Renderer
│   │   ├── InvoicePreview.tsx  # Dynamic Invoice Renderer
│   │   └── AuthModal.tsx       # Cloud Authentication Modal
│   ├── lib/              # Utility functions & helpers
│   ├── types/            # TypeScript interfaces and types
│   ├── App.tsx           # Main Application Container & Views
│   └── main.tsx          # Application Entry Point
├── metadata.json         # Platform metadata configuration
└── package.json          # Dependencies & Scripts
```

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
