// Standalone Mode Types
// Completely isolated from online mode

export type StandaloneMode = 'fnb' | 'retail';

export interface StandaloneConfig {
  mode: StandaloneMode;
  businessName: string;
  currency: string;
  taxRate: number;
  serviceChargeEnabled: boolean;
  serviceChargeRate: number;
  setupCompletedAt: string | null;
  isExitedAndKeepData: boolean;
}

export interface StandaloneProduct {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  price: number;
  costPrice?: number;
  imageUrl?: string;       // Base64 data URL
  description?: string;
  isActive: boolean;
  trackStock: boolean;
  stockQuantity: number;
  lowStockThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface StandaloneCategory {
  id: string;
  name: string;
  sortOrder: number;
  icon?: string;
  isActive: boolean;
}

export interface StandaloneCartItem {
  id: string;
  productId: string;
  productName: string;
  imageUrl?: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: 'fixed' | 'percentage';
  note?: string;
  isOpenItem: boolean;
  subtotal: number;
}

export interface StandaloneCart {
  items: StandaloneCartItem[];
  subtotal: number;
  discountAmount: number;
  discountType: 'fixed' | 'percentage' | null;
  taxRate: number;
  taxAmount: number;
  serviceCharge: number;
  serviceChargeRate: number;
  total: number;
  note?: string;
}

export interface StandaloneTransaction {
  id: string;
  receiptNumber: string;
  items: StandaloneCartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  serviceCharge: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'qris' | 'other';
  amountPaid: number;
  changeAmount: number;
  note?: string;
  tableNumber?: string;
  customerName?: string;
  status?: 'completed' | 'voided';
  voidedAt?: string;
  createdAt: string;
}

export interface StandaloneOpenItemData {
  name: string;
  price: number;
  quantity: number;
  note?: string;
}

export interface StandaloneConfirmedBatch {
  id: string;
  items: StandaloneCartItem[];
  confirmedAt: string;
  confirmedBy: string;
}

export interface StandaloneOpenOrder {
  id: string;
  tableNumber: string;
  customerName?: string;
  confirmedBatches: StandaloneConfirmedBatch[];
  unconfirmedItems: StandaloneCartItem[];
  subtotal: number;
  discountAmount: number;
  discountType: 'fixed' | 'percentage' | null;
  taxAmount: number;
  serviceCharge: number;
  total: number;
  note?: string;
  status: 'open' | 'closed';
  createdAt: string;
  lastModifiedAt: string;
}

// Default categories for new standalone setup
export const DEFAULT_FNB_CATEGORIES: Omit<StandaloneCategory, 'id'>[] = [
  { name: 'Food', sortOrder: 1, isActive: true },
  { name: 'Drinks', sortOrder: 2, isActive: true },
  { name: 'Snacks', sortOrder: 3, isActive: true },
  { name: 'Desserts', sortOrder: 4, isActive: true },
];

export const DEFAULT_RETAIL_CATEGORIES: Omit<StandaloneCategory, 'id'>[] = [
  { name: 'Products', sortOrder: 1, isActive: true },
  { name: 'Accessories', sortOrder: 2, isActive: true },
  { name: 'Services', sortOrder: 3, isActive: true },
];
