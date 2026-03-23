import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { StandaloneCart, StandaloneCartItem, StandaloneProduct, StandaloneOpenItemData } from '@/types/standalone';
import { useStandaloneConfigStore } from './standaloneConfigStore';
import { useStandaloneCatalogStore } from './standaloneCatalogStore';

interface StandaloneCartState extends StandaloneCart {
  isProcessing: boolean;

  // Actions
  addProduct: (product: StandaloneProduct, quantity?: number) => void;
  addOpenItem: (data: StandaloneOpenItemData) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  updateItemDiscount: (itemId: string, discount: number, type: 'fixed' | 'percentage') => void;
  updateItemNote: (itemId: string, note: string) => void;
  removeItem: (itemId: string) => void;
  setCartDiscount: (amount: number, type: 'fixed' | 'percentage') => void;
  setCartNote: (note: string) => void;
  setIsProcessing: (value: boolean) => void;
  calculateTotals: () => void;
  clearCart: () => void;
}

const initialState: StandaloneCart & { isProcessing: boolean } = {
  items: [],
  subtotal: 0,
  discountAmount: 0,
  discountType: null,
  taxRate: 0,
  taxAmount: 0,
  serviceCharge: 0,
  serviceChargeRate: 0,
  total: 0,
  note: undefined,
  isProcessing: false,
};

const generateId = () => Math.random().toString(36).substring(2, 11);

// Helper function to calculate cart totals inline
const calculateCartTotalsInline = (state: StandaloneCart & { isProcessing: boolean }) => {
  const config = useStandaloneConfigStore.getState();

  state.subtotal = state.items.reduce((sum, item) => sum + item.subtotal, 0);

  const afterDiscount = state.subtotal - state.discountAmount;

  state.taxRate = config.taxRate;
  state.serviceChargeRate = config.serviceChargeEnabled ? config.serviceChargeRate : 0;

  state.serviceCharge = (afterDiscount * state.serviceChargeRate) / 100;
  state.taxAmount = ((afterDiscount + state.serviceCharge) * state.taxRate) / 100;

  state.total = afterDiscount + state.serviceCharge + state.taxAmount;
};

export const useStandaloneCartStore = create<StandaloneCartState>()(
  immer((set) => ({
    ...initialState,

    addProduct: (product, quantity = 1) => set((state) => {
      const existingItem = state.items.find(
        (item) => item.productId === product.id && !item.isOpenItem
      );

      // Stock protection: check if product tracks stock
      if (product.trackStock) {
        const currentQtyInCart = existingItem ? existingItem.quantity : 0;
        const availableStock = product.stockQuantity - currentQtyInCart;

        if (availableStock <= 0) {
          // No stock available, don't add
          console.warn(`Stock exhausted for ${product.name}`);
          return;
        }

        // Cap quantity to available stock
        quantity = Math.min(quantity, availableStock);
      }

      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.subtotal = existingItem.quantity * existingItem.unitPrice - existingItem.discount;
      } else {
        const newItem: StandaloneCartItem = {
          id: generateId(),
          productId: product.id,
          productName: product.name,
          imageUrl: product.imageUrl,
          sku: product.sku,
          quantity,
          unitPrice: product.price,
          discount: 0,
          discountType: 'fixed',
          isOpenItem: false,
          subtotal: product.price * quantity,
        };
        state.items.push(newItem);
      }

      calculateCartTotalsInline(state);
    }),

    addOpenItem: (data) => set((state) => {
      const newItem: StandaloneCartItem = {
        id: generateId(),
        productId: `open-${generateId()}`,
        productName: data.name,
        sku: 'OPEN',
        quantity: data.quantity,
        unitPrice: data.price,
        discount: 0,
        discountType: 'fixed',
        note: data.note,
        isOpenItem: true,
        subtotal: data.price * data.quantity,
      };
      state.items.push(newItem);
      calculateCartTotalsInline(state);
    }),

    updateItemQuantity: (itemId, quantity) => set((state) => {
      const item = state.items.find((i) => i.id === itemId);
      if (item) {
        let finalQuantity = Math.max(0, quantity);

        // Stock protection: cap at available stock for non-open items
        if (!item.isOpenItem) {
          const product = useStandaloneCatalogStore.getState().getProductById(item.productId);
          if (product && product.trackStock) {
            finalQuantity = Math.min(finalQuantity, product.stockQuantity);
          }
        }

        item.quantity = finalQuantity;
        item.subtotal = item.quantity * item.unitPrice - item.discount;
        if (item.quantity === 0) {
          state.items = state.items.filter((i) => i.id !== itemId);
        }
      }
      calculateCartTotalsInline(state);
    }),

    updateItemDiscount: (itemId, discount, type) => set((state) => {
      const item = state.items.find((i) => i.id === itemId);
      if (item) {
        item.discountType = type;
        if (type === 'percentage') {
          item.discount = (item.unitPrice * item.quantity * discount) / 100;
        } else {
          item.discount = discount;
        }
        item.subtotal = item.quantity * item.unitPrice - item.discount;
      }
      calculateCartTotalsInline(state);
    }),

    updateItemNote: (itemId, note) => set((state) => {
      const item = state.items.find((i) => i.id === itemId);
      if (item) {
        item.note = note;
      }
    }),

    removeItem: (itemId) => set((state) => {
      state.items = state.items.filter((i) => i.id !== itemId);
      calculateCartTotalsInline(state);
    }),

    setCartDiscount: (amount, type) => set((state) => {
      state.discountType = type;
      if (type === 'percentage') {
        state.discountAmount = (state.subtotal * amount) / 100;
      } else {
        state.discountAmount = amount;
      }
      calculateCartTotalsInline(state);
    }),

    setCartNote: (note) => set((state) => {
      state.note = note;
    }),

    setIsProcessing: (value) => set((state) => {
      state.isProcessing = value;
    }),

    calculateTotals: () => set((state) => {
      calculateCartTotalsInline(state);
    }),

    clearCart: () => set(initialState),
  }))
);
