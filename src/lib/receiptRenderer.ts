import html2canvas from 'html2canvas';
import type { Transaction, BusinessSettings } from '@/types';
import type { StandaloneTransaction } from '@/types/standalone';
import { generateReceiptText, generateStandaloneReceiptText } from '@/lib/utils/receipt';
import { getReceiptConfig, type ReceiptConfig } from '@/lib/receiptConfig';

// Printable pixel widths at 203 DPI (8 dots/mm)
const PAPER_PIXEL_WIDTHS: Record<number, number> = {
  42: 264,
  48: 320,
  58: 384,
  60: 384,
  80: 576,
};

export interface ReceiptCanvasResult {
  width: number;
  height: number;
  dataUrl: string;
  monoBitmap: Uint8Array;
}

// ============ HTML Building ============

function buildReceiptHTML(text: string, config: ReceiptConfig): string {
  const lines = text.split('\n');
  const processedLines = lines.map((line) => {
    // Empty lines become tiny spacers
    if (line.trim() === '') {
      return '<span style="display:block;line-height:3px;font-size:3px"> </span>';
    }
    // TOTAL line gets bold
    if (/^.*TOTAL\s/.test(line) && !line.startsWith(' ')) {
      return `<span style="display:block;font-weight:700">${escapeHtml(line)}</span>`;
    }
    return `<span style="display:block">${escapeHtml(line)}</span>`;
  });

  return `<div style="
    width: ${config.containerWidth}px;
    padding: ${config.paddingY}px ${config.paddingX}px;
    background: #FAFAF7;
    box-sizing: border-box;
  "><pre style="
    margin: 0;
    font-family: ${config.fontFamily};
    font-size: ${config.fontSize}px;
    line-height: ${config.lineHeight}px;
    letter-spacing: ${config.letterSpacing}px;
    white-space: pre;
    color: #111;
    -webkit-font-smoothing: none;
    font-weight: 400;
  "><code>${processedLines.join('')}</code></pre></div>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============ HTML to Canvas Capture ============

async function captureHTMLToCanvas(html: string): Promise<HTMLCanvasElement> {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.innerHTML = html;
  document.body.appendChild(container);

  // Wait for fonts to load
  await document.fonts.ready;

  const element = container.firstElementChild as HTMLElement;
  const canvas = await html2canvas(element, {
    scale: window.devicePixelRatio || 2,
    backgroundColor: '#FAFAF7',
    logging: false,
  });

  document.body.removeChild(container);
  return canvas;
}

// ============ Canvas Scaling + Threshold ============

function scaleCanvas(source: HTMLCanvasElement, targetWidth: number): HTMLCanvasElement {
  const scale = targetWidth / source.width;
  const targetHeight = Math.round(source.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Draw scaled
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);

  // 1-bit threshold pass
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = imageData.data;
  for (let i = 0; i < px.length; i += 4) {
    const gray = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    const val = gray < 128 ? 0 : 255;
    px[i] = val;
    px[i + 1] = val;
    px[i + 2] = val;
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

// ============ Bitmap Conversion ============

export function canvasToMonoBitmap(canvas: HTMLCanvasElement): Uint8Array {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;

  const bytesPerRow = Math.ceil(canvas.width / 8);
  const bitmap = new Uint8Array(bytesPerRow * canvas.height);

  for (let row = 0; row < canvas.height; row++) {
    for (let col = 0; col < canvas.width; col++) {
      const pixelIndex = (row * canvas.width + col) * 4;
      const r = pixels[pixelIndex];
      const g = pixels[pixelIndex + 1];
      const b = pixels[pixelIndex + 2];
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      if (gray < 128) {
        const byteIndex = row * bytesPerRow + Math.floor(col / 8);
        const bitIndex = 7 - (col % 8);
        bitmap[byteIndex] |= (1 << bitIndex);
      }
    }
  }

  return bitmap;
}

// ============ Public API ============

export async function renderTransactionReceipt(
  transaction: Transaction,
  settings: BusinessSettings,
  paperWidth: number = 58,
  configOverrides?: Partial<ReceiptConfig>
): Promise<ReceiptCanvasResult> {
  console.log('[receiptRenderer] renderTransactionReceipt start', { paperWidth, ts: Date.now() });
  const config = getReceiptConfig(paperWidth, configOverrides);
  const text = generateReceiptText(transaction, settings, paperWidth);
  const html = buildReceiptHTML(text, config);
  const captured = await captureHTMLToCanvas(html);

  // Preview: use high-res capture directly (sharp for on-screen display)
  const dataUrl = captured.toDataURL('image/png');

  // Print: scale down to printer pixel width + threshold for mono bitmap
  const targetWidth = PAPER_PIXEL_WIDTHS[paperWidth] || 384;
  const scaled = scaleCanvas(captured, targetWidth);
  const monoBitmap = canvasToMonoBitmap(scaled);
  console.log('[receiptRenderer] renderTransactionReceipt done', { width: scaled.width, height: scaled.height });

  return {
    width: scaled.width,
    height: scaled.height,
    dataUrl,
    monoBitmap,
  };
}

export async function renderStandaloneReceipt(
  transaction: StandaloneTransaction,
  config: {
    businessName: string;
    currency: string;
    taxRate: number;
    serviceChargeEnabled: boolean;
    serviceChargeRate: number;
  },
  paperWidth: number = 58,
  configOverrides?: Partial<ReceiptConfig>
): Promise<ReceiptCanvasResult> {
  console.log('[receiptRenderer] renderStandaloneReceipt start', { paperWidth, ts: Date.now() });
  const receiptConfig = getReceiptConfig(paperWidth, configOverrides);
  const text = generateStandaloneReceiptText(transaction, config, paperWidth);
  const html = buildReceiptHTML(text, receiptConfig);
  const captured = await captureHTMLToCanvas(html);

  // Preview: use high-res capture directly (sharp for on-screen display)
  const dataUrl = captured.toDataURL('image/png');

  // Print: scale down to printer pixel width + threshold for mono bitmap
  const targetWidth = PAPER_PIXEL_WIDTHS[paperWidth] || 384;
  const scaled = scaleCanvas(captured, targetWidth);
  const monoBitmap = canvasToMonoBitmap(scaled);
  console.log('[receiptRenderer] renderStandaloneReceipt done', { width: scaled.width, height: scaled.height });

  return {
    width: scaled.width,
    height: scaled.height,
    dataUrl,
    monoBitmap,
  };
}
