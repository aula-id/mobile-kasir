export interface BusinessSettings {
  tenantId: string;
  businessName: string;
  businessType: 'restaurant' | 'retail' | 'fnb' | 'service';
  currency: string;
  currencySymbol: string;
  taxRate: number;
  taxInclusive: boolean;
  serviceChargeRate: number;
  serviceChargeEnabled: boolean;
  receiptHeader?: string;
  receiptFooter?: string;
  logoUrl?: string;
}

export interface PrinterConfig {
  type: 'bluetooth' | 'usb' | 'network' | 'none';
  address: string;      // MAC address, USB path, or IP:port
  name: string;         // Display name
  paperWidth: 42 | 48 | 58 | 60 | 80;  // mm
  autoConnect: boolean;
}

export interface DiscoveredPrinter {
  id: string;
  name: string;
  type: 'bluetooth' | 'usb' | 'network';
  address: string;
  paired?: boolean;     // For bluetooth
}

export interface PrinterStatus {
  connected: boolean;
  printerName?: string;
  paperWidth?: 42 | 48 | 58 | 60 | 80;
}

export interface AppSettings {
  apiBaseUrl: string;
  syncIntervalMs: number;
  offlineMode: boolean;
  printerEnabled: boolean;
  printerConfig?: PrinterConfig;
  soundEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'id' | 'jv' | 'su' | 'ban';
}
