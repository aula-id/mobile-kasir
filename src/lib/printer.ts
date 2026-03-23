// Web Serial API type declarations (not in standard lib)
declare global {
  interface Navigator {
    serial: {
      requestPort(): Promise<SerialPort>;
    };
  }
  interface SerialPort {
    open(options: { baudRate: number }): Promise<void>;
    close(): Promise<void>;
    writable: WritableStream<Uint8Array> | null;
  }
}

import type { PrinterConfig, DiscoveredPrinter, PrinterStatus } from '@/types';

export interface ReceiptData {
  header: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  tax?: number;
  service?: number;
  discount?: number;
  total: number;
  footer?: string;
  timestamp: string;
  receiptNumber: string;
}

// ============ Browser API Detection ============

function isSerialSupported(): boolean {
  return 'serial' in navigator;
}

function isBluetoothSupported(): boolean {
  return 'bluetooth' in navigator;
}

// ============ ESC/POS Commands ============

const ESC = 0x1b;
const GS = 0x1d;

const ESCPOS = {
  INIT: new Uint8Array([ESC, 0x40]),
  ALIGN_CENTER: new Uint8Array([ESC, 0x61, 0x01]),
  ALIGN_LEFT: new Uint8Array([ESC, 0x61, 0x00]),
  BOLD_ON: new Uint8Array([ESC, 0x45, 0x01]),
  BOLD_OFF: new Uint8Array([ESC, 0x45, 0x00]),
  DOUBLE_HEIGHT: new Uint8Array([GS, 0x21, 0x01]),
  NORMAL_SIZE: new Uint8Array([GS, 0x21, 0x00]),
  CUT: new Uint8Array([GS, 0x56, 0x00]),
  FEED_LINES: (n: number) => new Uint8Array([ESC, 0x64, n]),
  LINE_FEED: new Uint8Array([0x0a]),
};

function buildRasterCommand(widthPx: number, heightPx: number, bitmap: Uint8Array): Uint8Array {
  // GS v 0 m xL xH yL yH d1...dk
  // m = 0 (normal mode)
  const bytesPerRow = Math.ceil(widthPx / 8);
  const xL = bytesPerRow & 0xff;
  const xH = (bytesPerRow >> 8) & 0xff;
  const yL = heightPx & 0xff;
  const yH = (heightPx >> 8) & 0xff;

  const header = new Uint8Array([GS, 0x76, 0x30, 0x00, xL, xH, yL, yH]);
  return concatBytes(header, bitmap);
}

function textToBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// ============ Connection State ============

let serialPort: SerialPort | null = null;
let serialWriter: WritableStreamDefaultWriter<Uint8Array> | null = null;
let bluetoothDevice: BluetoothDevice | null = null;
let bluetoothCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
let connectedConfig: PrinterConfig | null = null;

// Known BLE service UUIDs for ESC/POS thermal printers
const KNOWN_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Common ESC/POS
  '0000ff00-0000-1000-8000-00805f9b34fb', // Generic serial
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC (MFi)
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Various Chinese printers
  '0000ffe0-0000-1000-8000-00805f9b34fb', // Common alternative
];

// ============ Printer API ============

export const printer = {
  discover: async (): Promise<DiscoveredPrinter[]> => {
    const printers: DiscoveredPrinter[] = [];

    if (isSerialSupported()) {
      printers.push({
        id: 'usb-serial',
        name: 'USB Printer (Serial)',
        type: 'usb',
        address: 'serial',
      });
    }

    if (isBluetoothSupported()) {
      printers.push({
        id: 'bluetooth-escpos',
        name: 'Bluetooth Printer',
        type: 'bluetooth',
        address: 'bluetooth',
      });
    }

    if (printers.length === 0) {
      throw new Error('No printing APIs available. Use a Chromium-based browser.');
    }

    return printers;
  },

  connect: async (config: PrinterConfig): Promise<boolean> => {
    try {
      if (config.type === 'usb' && isSerialSupported()) {
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });
        serialPort = port;
        if (port.writable) {
          serialWriter = port.writable.getWriter();
        }
        connectedConfig = config;
        return true;
      }

      if (config.type === 'bluetooth' && isBluetoothSupported()) {
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: KNOWN_PRINTER_SERVICES,
        });

        const server = await device.gatt!.connect();

        // Dynamically discover writable characteristic
        const services = await server.getPrimaryServices();
        let foundChar: BluetoothRemoteGATTCharacteristic | null = null;
        for (const service of services) {
          try {
            const chars = await service.getCharacteristics();
            for (const char of chars) {
              if (char.properties.write || char.properties.writeWithoutResponse) {
                foundChar = char;
                break;
              }
            }
            if (foundChar) break;
          } catch {
            // Service may not be accessible, skip
          }
        }

        if (!foundChar) {
          server.disconnect();
          throw new Error('No writable characteristic found on this device. It may not be a supported BLE printer.');
        }

        bluetoothDevice = device;
        bluetoothCharacteristic = foundChar;
        connectedConfig = config;
        return true;
      }

      throw new Error(`Printer type "${config.type}" is not supported in this browser.`);
    } catch (error) {
      console.error('Failed to connect printer:', error);
      // Translate common browser errors to user-friendly messages
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('cancelled') || message.includes('canceled')) {
        throw new Error('Pemilihan perangkat dibatalkan.');
      }
      if (message.includes('No writable characteristic')) {
        throw new Error('Perangkat ini bukan printer BLE yang didukung. Coba gunakan koneksi USB.');
      }
      if (message.includes('GATT') || message.includes('connect')) {
        throw new Error('Gagal terhubung ke printer. Pastikan printer menyala dan dalam jangkauan.');
      }
      throw new Error('Koneksi gagal: ' + message);
    }
  },

  disconnect: async (): Promise<void> => {
    try {
      if (serialWriter) {
        serialWriter.releaseLock();
        serialWriter = null;
      }
      if (serialPort) {
        await serialPort.close();
        serialPort = null;
      }
      if (bluetoothDevice?.gatt?.connected) {
        bluetoothDevice.gatt.disconnect();
      }
      bluetoothDevice = null;
      bluetoothCharacteristic = null;
      connectedConfig = null;
    } catch (error) {
      console.error('Failed to disconnect printer:', error);
      throw error;
    }
  },

  status: async (): Promise<PrinterStatus> => {
    const connected = !!(serialPort || bluetoothDevice?.gatt?.connected);
    return {
      connected,
      printerName: connectedConfig?.name,
      paperWidth: connectedConfig?.paperWidth,
    };
  },

  printTest: async (): Promise<void> => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const pw = connectedConfig?.paperWidth ?? 58;
    const connType = connectedConfig?.type ?? 'unknown';

    const data = concatBytes(
      ESCPOS.INIT,
      ESCPOS.ALIGN_CENTER,
      ESCPOS.BOLD_ON,
      ESCPOS.DOUBLE_HEIGHT,
      textToBytes('TEST PRINT'),
      ESCPOS.LINE_FEED,
      ESCPOS.NORMAL_SIZE,
      ESCPOS.BOLD_OFF,
      textToBytes('--------------------'),
      ESCPOS.LINE_FEED,
      ESCPOS.LINE_FEED,
      ESCPOS.ALIGN_LEFT,
      textToBytes(`Tanggal : ${dateStr}`),
      ESCPOS.LINE_FEED,
      textToBytes(`Waktu   : ${timeStr}`),
      ESCPOS.LINE_FEED,
      textToBytes(`Kertas  : ${pw}mm`),
      ESCPOS.LINE_FEED,
      textToBytes(`Koneksi : ${connType.toUpperCase()}`),
      ESCPOS.LINE_FEED,
      ESCPOS.LINE_FEED,
      ESCPOS.ALIGN_CENTER,
      textToBytes('--------------------'),
      ESCPOS.LINE_FEED,
      textToBytes('Printer terhubung.'),
      ESCPOS.LINE_FEED,
      ESCPOS.FEED_LINES(3),
      ESCPOS.CUT,
    );
    await sendToPrinter(data);
  },

  printReceipt: async (data: ReceiptData): Promise<void> => {
    const PAPER_CHAR_WIDTHS: Record<number, number> = { 42: 24, 48: 28, 58: 32, 60: 33, 80: 48 };
    const width = PAPER_CHAR_WIDTHS[connectedConfig?.paperWidth ?? 58] || 32;

    const center = (text: string): string => {
      const padding = Math.max(0, Math.floor((width - text.length) / 2));
      return ' '.repeat(padding) + text;
    };

    const divider = '='.repeat(width);
    const thinDivider = '-'.repeat(width);

    const lines: Uint8Array[] = [
      ESCPOS.INIT,
      ESCPOS.ALIGN_CENTER,
      ESCPOS.BOLD_ON,
      textToBytes(data.header),
      ESCPOS.LINE_FEED,
      ESCPOS.BOLD_OFF,
      ESCPOS.ALIGN_LEFT,
      textToBytes(divider),
      ESCPOS.LINE_FEED,
      textToBytes(`Receipt: ${data.receiptNumber}`),
      ESCPOS.LINE_FEED,
      textToBytes(`Date: ${data.timestamp}`),
      ESCPOS.LINE_FEED,
      textToBytes(thinDivider),
      ESCPOS.LINE_FEED,
    ];

    for (const item of data.items) {
      lines.push(
        textToBytes(item.name),
        ESCPOS.LINE_FEED,
        textToBytes(`  ${item.quantity} x ${item.price.toFixed(0)}  = ${item.total.toFixed(0)}`),
        ESCPOS.LINE_FEED,
      );
    }

    lines.push(textToBytes(thinDivider), ESCPOS.LINE_FEED);
    lines.push(textToBytes(`Subtotal: ${data.subtotal.toFixed(0)}`), ESCPOS.LINE_FEED);

    if (data.discount && data.discount > 0) {
      lines.push(textToBytes(`Discount: -${data.discount.toFixed(0)}`), ESCPOS.LINE_FEED);
    }
    if (data.service && data.service > 0) {
      lines.push(textToBytes(`Service: ${data.service.toFixed(0)}`), ESCPOS.LINE_FEED);
    }
    if (data.tax && data.tax > 0) {
      lines.push(textToBytes(`Tax: ${data.tax.toFixed(0)}`), ESCPOS.LINE_FEED);
    }

    lines.push(
      textToBytes(divider),
      ESCPOS.LINE_FEED,
      ESCPOS.BOLD_ON,
      ESCPOS.DOUBLE_HEIGHT,
      textToBytes(`TOTAL: ${data.total.toFixed(0)}`),
      ESCPOS.LINE_FEED,
      ESCPOS.NORMAL_SIZE,
      ESCPOS.BOLD_OFF,
      textToBytes(divider),
      ESCPOS.LINE_FEED,
    );

    if (data.footer) {
      lines.push(
        ESCPOS.ALIGN_CENTER,
        textToBytes(data.footer),
        ESCPOS.LINE_FEED,
      );
    }

    lines.push(
      ESCPOS.ALIGN_CENTER,
      textToBytes(center('Thank you!')),
      ESCPOS.LINE_FEED,
      ESCPOS.FEED_LINES(3),
      ESCPOS.CUT,
    );

    await sendToPrinter(concatBytes(...lines));
  },

  printRawText: async (text: string): Promise<void> => {
    const lines = text.split('\n');
    const parts: Uint8Array[] = [ESCPOS.INIT, ESCPOS.ALIGN_LEFT];

    for (const line of lines) {
      parts.push(textToBytes(line), ESCPOS.LINE_FEED);
    }

    parts.push(ESCPOS.FEED_LINES(3), ESCPOS.CUT);
    await sendToPrinter(concatBytes(...parts));
  },

  printRasterImage: async (widthPx: number, heightPx: number, monoBitmap: Uint8Array): Promise<void> => {
    // Send in strips of 256 rows to avoid printer buffer overflow
    const STRIP_HEIGHT = 256;
    const bytesPerRow = Math.ceil(widthPx / 8);

    // Init
    await sendToPrinter(ESCPOS.INIT);

    for (let startRow = 0; startRow < heightPx; startRow += STRIP_HEIGHT) {
      const endRow = Math.min(startRow + STRIP_HEIGHT, heightPx);
      const stripHeight = endRow - startRow;
      const stripData = monoBitmap.slice(
        startRow * bytesPerRow,
        endRow * bytesPerRow
      );

      const cmd = buildRasterCommand(widthPx, stripHeight, stripData);
      await sendToPrinter(cmd);
    }

    // Feed and cut
    await sendToPrinter(concatBytes(ESCPOS.FEED_LINES(3), ESCPOS.CUT));
  },
};

// ============ Internal Send ============

async function sendToPrinter(data: Uint8Array): Promise<void> {
  if (serialWriter) {
    await serialWriter.write(data);
    return;
  }

  if (bluetoothCharacteristic) {
    // BLE has a max payload of ~512 bytes, chunk if needed
    const chunkSize = 512;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await bluetoothCharacteristic.writeValueWithResponse(chunk);
    }
    return;
  }

  throw new Error('No printer connected. Connect a printer first.');
}
