import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { StandaloneTransaction } from '@/types/standalone';
import { useStandaloneCatalogStore } from './standaloneCatalogStore';

interface StandaloneTransactionState {
  transactions: StandaloneTransaction[];

  // Actions
  addTransaction: (transaction: Omit<StandaloneTransaction, 'id' | 'receiptNumber' | 'createdAt'>) => StandaloneTransaction;
  voidTransaction: (id: string) => void;
  getTransactionById: (id: string) => StandaloneTransaction | undefined;
  getTransactionsByDate: (date: Date) => StandaloneTransaction[];
  getTodayTransactions: () => StandaloneTransaction[];
  getTodayTotal: () => number;
  reset: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

const generateReceiptNumber = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toISOString().slice(11, 19).replace(/:/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SA${date}${time}${random}`;
};

const isSameDay = (date1: Date, date2: Date) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const useStandaloneTransactionStore = create<StandaloneTransactionState>()(
  persist(
    immer((set, get) => ({
      transactions: [],

      addTransaction: (transactionData) => {
        const now = new Date().toISOString();
        const newTransaction: StandaloneTransaction = {
          ...transactionData,
          id: generateId(),
          receiptNumber: generateReceiptNumber(),
          createdAt: now,
        };

        set((state) => {
          state.transactions.unshift(newTransaction);
        });

        const catalog = useStandaloneCatalogStore.getState();
        newTransaction.items.forEach(item => {
          if (!item.isOpenItem) {
            catalog.adjustStock(item.productId, -item.quantity, 'sale', newTransaction.id);
          }
        });

        return newTransaction;
      },

      voidTransaction: (id) => {
        set((state) => {
          const tx = state.transactions.find((t) => t.id === id);
          if (tx && tx.status !== 'voided') {
            tx.status = 'voided';
            tx.voidedAt = new Date().toISOString();

            const catalog = useStandaloneCatalogStore.getState();
            tx.items.forEach(item => {
              if (!item.isOpenItem) {
                catalog.adjustStock(item.productId, item.quantity, 'void', tx.id);
              }
            });
          }
        });
      },

      getTransactionById: (id) => {
        return get().transactions.find((t) => t.id === id);
      },

      getTransactionsByDate: (date) => {
        return get().transactions.filter((t) => isSameDay(new Date(t.createdAt), date));
      },

      getTodayTransactions: () => {
        const today = new Date();
        return get().transactions.filter((t) => isSameDay(new Date(t.createdAt), today));
      },

      getTodayTotal: () => {
        const todayTx = get().getTodayTransactions();
        return todayTx.filter((t) => t.status !== 'voided').reduce((sum, t) => sum + t.total, 0);
      },

      reset: () => set({ transactions: [] }),
    })),
    {
      name: 'standalone-transactions',
    }
  )
);
