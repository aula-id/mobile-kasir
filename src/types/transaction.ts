import type { CartItem } from './cart';

export type PaymentMethod = 'cash' | 'card' | 'qris' | 'transfer' | 'other';

export interface PaymentDetail {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export interface Transaction {
  id: string;
  localId: string;
  receiptNumber?: string;
  branchId: string;
  userId: string;
  userName: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  serviceCharge: number;
  total: number;
  payments: PaymentDetail[];
  amountPaid: number;
  change: number;
  status: 'completed' | 'voided' | 'pending';
  note?: string;
  tableNumber?: string;
  customerName?: string;
  createdAt: string;
  syncedAt?: string;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalSales: number;
  totalDiscount: number;
  totalTax: number;
  totalCash: number;
  totalCard: number;
  totalQris: number;
}
