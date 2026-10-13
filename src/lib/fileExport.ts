import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';

export interface DocumentExportItem {
  id: string;
  customerName: string;
  total: number;
  type: 'receipt' | 'invoice';
  invoiceNumber?: string;
}

export function formatExportFilename(
  doc: DocumentExportItem,
  extension: 'png' | 'pdf',
  customName?: string
): string {
  if (customName && customName.trim()) {
    return `${customName.trim().replace(/[^a-zA-Z0-9_-]/g, '_')}.${extension}`;
  }
  const dateStr = new Date().toISOString().split('T')[0];
  const safeCustomer = (doc.customerName || 'customer')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '');
  const idSnippet = (doc.invoiceNumber || doc.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6);
  return `${doc.type}_${safeCustomer}_${idSnippet}_${dateStr}.${extension}`;
}

/**
 * Checks whether the application is running inside a native mobile runtime (Capacitor Android/iOS)
 */
export function isNativeMobile(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Captures an HTML element as high-resolution PNG data URL
 */
export async function captureElementToPng(element: HTMLElement): Promise<string> {
  return await toPng(element, {
    backgroundColor: '#ffffff',
    pixelRatio: 2.5,
    cacheBust: true,
  });
}

/**
 * Converts a base64 dataUrl into a Blob
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const binaryStr = atob(parts[1]);
  const len = binaryStr.length;
  const u8arr = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    u8arr[i] = binaryStr.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Generates a jsPDF instance preserving accurate document dimensions
 */
export async function generateDocumentPdf(
  element: HTMLElement,
  docType: 'receipt' | 'invoice'
): Promise<{ pdf: jsPDF; dataUrl: string; base64: string }> {
  const imgDataUrl = await captureElementToPng(element);
  const isInvoice = docType === 'invoice';

  // Create temporary instance to extract original image pixel proportions
  const tempPdf = new jsPDF({
    orientation: isInvoice ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const imgProps = tempPdf.getImageProperties(imgDataUrl);

  if (isInvoice) {
    // Standard A4 landscape is 297mm wide x 210mm high
    const pdfWidth = 297;
    const proportionalHeight = (imgProps.height * pdfWidth) / imgProps.width;
    const finalHeight = Math.max(210, proportionalHeight);

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: [pdfWidth, finalHeight],
    });

    pdf.addImage(imgDataUrl, 'PNG', 0, 0, pdfWidth, proportionalHeight);
    const pdfDataUri = pdf.output('datauristring');
    const base64 = pdfDataUri.split(',')[1];
    return { pdf, dataUrl: pdfDataUri, base64 };
  } else {
    // Thermal receipt style portrait: 80mm - 120mm slip or standard proportional portrait
    const pdfWidth = 100;
    const proportionalHeight = (imgProps.height * pdfWidth) / imgProps.width;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [pdfWidth, proportionalHeight],
    });

    pdf.addImage(imgDataUrl, 'PNG', 0, 0, pdfWidth, proportionalHeight);
    const pdfDataUri = pdf.output('datauristring');
    const base64 = pdfDataUri.split(',')[1];
    return { pdf, dataUrl: pdfDataUri, base64 };
  }
}

/**
 * Downloads or saves the file to the device storage
 */
export async function downloadOrSaveFile(
  blob: Blob,
  filename: string,
  base64Data?: string
): Promise<{ success: boolean; method: 'native' | 'browser' | 'share'; error?: string }> {
  // If running in Capacitor native Android/iOS
  if (isNativeMobile() && base64Data) {
    try {
      const writtenFile = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache,
      });

      // Prompt user with native share sheet so they can save to Downloads, Drive, or files app
      const shareResult = await Share.share({
        title: filename,
        text: `Quick Receipt: ${filename}`,
        files: [writtenFile.uri],
      });

      return { success: true, method: 'native' };
    } catch (nativeErr: any) {
      if (nativeErr?.name === 'AbortError' || nativeErr?.message?.includes('canceled')) {
        return { success: true, method: 'native' };
      }
      console.warn('Native filesystem write fallback to browser download:', nativeErr);
    }
  }

  // Web / PWA browser standard download fallback
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return { success: true, method: 'browser' };
  } catch (err: any) {
    return { success: false, method: 'browser', error: err?.message || 'Download failed' };
  }
}

/**
 * Shares the document file using Android Native Share Sheet, Web Share API, or fallback
 */
export async function shareDocumentAttachment(options: {
  element: HTMLElement;
  doc: DocumentExportItem;
  fileFormat: 'png' | 'pdf';
  customFilename?: string;
  businessName?: string;
  currency?: string;
}): Promise<{ success: boolean; method: 'capacitor' | 'web_share' | 'download_fallback'; error?: string }> {
  const { element, doc, fileFormat, customFilename, businessName = 'Quick Receipt', currency = '₦' } = options;
  const filename = formatExportFilename(doc, fileFormat, customFilename);
  const shareTitle = `${doc.type === 'receipt' ? 'Receipt' : 'Invoice'} from ${businessName}`;
  const shareText = `Official ${doc.type} #${doc.invoiceNumber || doc.id.slice(0, 8).toUpperCase()} for ${currency}${doc.total.toLocaleString()} from ${businessName}.`;

  try {
    let base64Data: string;
    let blob: Blob;

    if (fileFormat === 'png') {
      const imgDataUrl = await captureElementToPng(element);
      base64Data = imgDataUrl.split(',')[1];
      blob = dataUrlToBlob(imgDataUrl);
    } else {
      const { base64, dataUrl } = await generateDocumentPdf(element, doc.type);
      base64Data = base64;
      blob = dataUrlToBlob(dataUrl);
    }

    // 1. Check if running inside Capacitor native container
    if (isNativeMobile()) {
      try {
        const fileResult = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Cache,
        });

        await Share.share({
          title: shareTitle,
          text: shareText,
          files: [fileResult.uri],
          dialogTitle: `Share ${doc.type.toUpperCase()}`,
        });

        return { success: true, method: 'capacitor' };
      } catch (nativeShareErr: any) {
        if (nativeShareErr?.name === 'AbortError' || nativeShareErr?.message?.includes('canceled')) {
          return { success: true, method: 'capacitor' };
        }
        console.warn('Capacitor native share failed, trying fallback:', nativeShareErr);
      }
    }

    // 2. Web Share API with files support (Android Chrome, iOS Safari)
    const mimeType = fileFormat === 'png' ? 'image/png' : 'application/pdf';
    const file = new File([blob], filename, { type: mimeType });

    if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: shareTitle,
          text: shareText,
        });
        return { success: true, method: 'web_share' };
      } catch (webShareErr: any) {
        if (webShareErr?.name === 'AbortError') {
          return { success: true, method: 'web_share' };
        }
        console.warn('Web Share failed, using download fallback:', webShareErr);
      }
    }

    // 3. Fallback: Save file locally
    await downloadOrSaveFile(blob, filename, base64Data);
    return { success: true, method: 'download_fallback' };
  } catch (err: any) {
    return {
      success: false,
      method: 'download_fallback',
      error: err?.message || 'Failed to generate and share document',
    };
  }
}
