import { $Font, type Font } from 'bdfparser';
import spleenBdf from '@/assets/spleen-12x24.bdf?raw';

// ============ Constants ============

const CHAR_WIDTH = 12;
const CHAR_HEIGHT = 24;

// Printable pixel widths at 203 DPI (8 dots/mm)
const PAPER_PIXEL_WIDTHS: Record<number, number> = {
  42: 264,
  48: 320,
  58: 384,
  60: 384,
  80: 576,
};

const CHARS_PER_LINE: Record<number, number> = {
  42: 22,  // 264 / 12 = 22
  48: 26,  // 320 / 12 = 26 (remainder 8px padding)
  58: 32,  // 384 / 12 = 32
  60: 32,  // 384 / 12 = 32
  80: 48,  // 576 / 12 = 48
};

export interface BitmapReceiptResult {
  width: number;
  height: number;
  dataUrl: string;
  monoBitmap: Uint8Array;
}

// ============ Font Loading ============

let fontPromise: Promise<Font> | null = null;

async function* linesFromString(s: string) {
  for (const line of s.split('\n')) yield line;
}

function loadFont(): Promise<Font> {
  if (!fontPromise) {
    fontPromise = $Font(linesFromString(spleenBdf));
  }
  return fontPromise;
}

// ============ Glyph Cache ============

const glyphCache = new Map<number, number[][] | null>();

function getGlyphPixels(font: Font, charCode: number): number[][] | null {
  if (glyphCache.has(charCode)) {
    return glyphCache.get(charCode)!;
  }
  const char = String.fromCharCode(charCode);
  const glyph = font.glyph(char);
  if (!glyph) {
    glyphCache.set(charCode, null);
    return null;
  }
  const bitmap = glyph.draw();
  if (!bitmap) {
    glyphCache.set(charCode, null);
    return null;
  }
  const pixels = bitmap.todata(2) as number[][];
  glyphCache.set(charCode, pixels);
  return pixels;
}

// ============ Render Text to ImageData ============

const EMPTY_LINE_HEIGHT = 4; // pixels for empty lines (spacer)

function renderReceiptBitmap(
  text: string,
  font: Font,
  paperWidth: number
): { imageData: Uint8Array; width: number; height: number } {
  const pixelWidth = PAPER_PIXEL_WIDTHS[paperWidth] || 384;
  const lines = text.split('\n');

  // Calculate total height
  let totalHeight = 0;
  for (const line of lines) {
    if (line.trim() === '') {
      totalHeight += EMPTY_LINE_HEIGHT;
    } else {
      totalHeight += CHAR_HEIGHT;
    }
  }
  // Add top/bottom padding
  totalHeight += 12; // 6px top + 6px bottom

  // Create pixel buffer (RGBA)
  const buffer = new Uint8Array(pixelWidth * totalHeight * 4);
  // Fill white
  for (let i = 0; i < buffer.length; i += 4) {
    buffer[i] = 255;     // R
    buffer[i + 1] = 255; // G
    buffer[i + 2] = 255; // B
    buffer[i + 3] = 255; // A
  }

  let y = 6; // top padding

  for (const line of lines) {
    if (line.trim() === '') {
      y += EMPTY_LINE_HEIGHT;
      continue;
    }

    // Render each character
    for (let i = 0; i < line.length; i++) {
      const charCode = line.charCodeAt(i);
      const glyphPixels = getGlyphPixels(font, charCode);
      if (!glyphPixels) continue;

      const xOffset = i * CHAR_WIDTH;
      if (xOffset >= pixelWidth) break; // line overflow protection

      // Draw glyph pixels
      for (let gy = 0; gy < glyphPixels.length && gy < CHAR_HEIGHT; gy++) {
        const row = glyphPixels[gy];
        for (let gx = 0; gx < row.length && gx < CHAR_WIDTH; gx++) {
          if (row[gx] === 1) {
            const px = xOffset + gx;
            const py = y + gy;
            if (px < pixelWidth && py < totalHeight) {
              const idx = (py * pixelWidth + px) * 4;
              buffer[idx] = 0;     // R
              buffer[idx + 1] = 0; // G
              buffer[idx + 2] = 0; // B
              // A stays 255
            }
          }
        }
      }
    }

    y += CHAR_HEIGHT;
  }

  return { imageData: buffer, width: pixelWidth, height: totalHeight };
}

// ============ Convert to Canvas (for dataUrl) ============

function bufferToCanvas(
  buffer: Uint8Array,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(width, height);
  imageData.data.set(buffer);
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// ============ Mono Bitmap for ESC/POS ============

function bufferToMonoBitmap(
  buffer: Uint8Array,
  width: number,
  height: number
): Uint8Array {
  const bytesPerRow = Math.ceil(width / 8);
  const bitmap = new Uint8Array(bytesPerRow * height);

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const idx = (row * width + col) * 4;
      // Check if pixel is black (R channel)
      if (buffer[idx] === 0) {
        const byteIndex = row * bytesPerRow + Math.floor(col / 8);
        const bitIndex = 7 - (col % 8);
        bitmap[byteIndex] |= (1 << bitIndex);
      }
    }
  }

  return bitmap;
}

// ============ Public API ============

import type { Transaction, BusinessSettings } from '@/types';
import type { StandaloneTransaction } from '@/types/standalone';
import { generateReceiptText, generateStandaloneReceiptText } from '@/lib/utils/receipt';

export async function renderTransactionReceipt(
  transaction: Transaction,
  settings: BusinessSettings,
  paperWidth: number = 58
): Promise<BitmapReceiptResult> {
  console.log('[bitmapRenderer] renderTransactionReceipt start', { paperWidth, ts: Date.now() });
  const font = await loadFont();
  const text = generateReceiptText(transaction, settings, paperWidth);
  const { imageData, width, height } = renderReceiptBitmap(text, font, paperWidth);
  const canvas = bufferToCanvas(imageData, width, height);
  const dataUrl = canvas.toDataURL('image/png');
  const monoBitmap = bufferToMonoBitmap(imageData, width, height);
  console.log('[bitmapRenderer] renderTransactionReceipt done', { width, height });

  return { width, height, dataUrl, monoBitmap };
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
  paperWidth: number = 58
): Promise<BitmapReceiptResult> {
  console.log('[bitmapRenderer] renderStandaloneReceipt start', { paperWidth, ts: Date.now() });
  const font = await loadFont();
  const text = generateStandaloneReceiptText(transaction, config, paperWidth);
  const { imageData, width, height } = renderReceiptBitmap(text, font, paperWidth);
  const canvas = bufferToCanvas(imageData, width, height);
  const dataUrl = canvas.toDataURL('image/png');
  const monoBitmap = bufferToMonoBitmap(imageData, width, height);
  console.log('[bitmapRenderer] renderStandaloneReceipt done', { width, height });

  return { width, height, dataUrl, monoBitmap };
}

export { CHARS_PER_LINE, PAPER_PIXEL_WIDTHS };
