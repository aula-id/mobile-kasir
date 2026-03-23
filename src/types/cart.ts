export interface CartItem {
  id: string;
  productId: string;
  productName: string;
  imageUrl?: string;
  originalPrice?: number;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: 'fixed' | 'percentage';
  note?: string;
  isOpenItem: boolean;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
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

export interface OpenItemData {
  name: string;
  price: number;
  quantity: number;
  note?: string;
}
