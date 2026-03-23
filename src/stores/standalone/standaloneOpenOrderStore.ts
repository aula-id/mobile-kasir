import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { StandaloneOpenOrder, StandaloneConfirmedBatch, StandaloneCartItem, StandaloneProduct, StandaloneOpenItemData } from '@/types/standalone';
import { useStandaloneConfigStore } from './standaloneConfigStore';

interface StandaloneOpenOrderState {
  orders: StandaloneOpenOrder[];
  activeOrderId: string | null;
}

interface StandaloneOpenOrderActions {
  createOrder: (tableNumber: string, customerName?: string) => string | null;
  setActiveOrder: (orderId: string | null) => void;
  getActiveOrder: () => StandaloneOpenOrder | null;
  addProduct: (product: StandaloneProduct, quantity?: number) => void;
  addOpenItem: (data: StandaloneOpenItemData) => void;
  updateUnconfirmedItem: (itemId: string, updates: Partial<StandaloneCartItem>) => void;
  removeUnconfirmedItem: (itemId: string) => void;
  confirmItems: (confirmedBy: string) => void;
  closeOrder: (orderId: string) => void;
  updateOrderMetadata: (orderId: string, metadata: { customerName?: string; tableNumber?: string }) => void;
  setOrderDiscount: (orderId: string, amount: number, type: 'fixed' | 'percentage') => void;
  setOrderNote: (orderId: string, note: string) => void;
  calculateOrderTotals: (orderId: string) => void;
  deleteOrder: (orderId: string) => void;
  addItemsToOrder: (orderId: string, items: StandaloneCartItem[]) => void;
  reset: () => void;
}

const initialState: StandaloneOpenOrderState = {
  orders: [],
  activeOrderId: null,
};

const generateId = () => Math.random().toString(36).substring(2, 11);

const calculateOrderTotalsInline = (order: StandaloneOpenOrder) => {
  const config = useStandaloneConfigStore.getState();

  const confirmedSubtotal = order.confirmedBatches.reduce(
    (sum, batch) => sum + batch.items.reduce((batchSum, item) => batchSum + item.subtotal, 0),
    0
  );
  const unconfirmedSubtotal = order.unconfirmedItems.reduce(
    (sum, item) => sum + item.subtotal,
    0
  );
  order.subtotal = confirmedSubtotal + unconfirmedSubtotal;

  const afterDiscount = order.subtotal - order.discountAmount;

  const taxRate = config.taxRate ?? 0;
  const serviceChargeRate = config.serviceChargeEnabled ? (config.serviceChargeRate ?? 0) : 0;

  order.serviceCharge = (afterDiscount * serviceChargeRate) / 100;
  order.taxAmount = ((afterDiscount + order.serviceCharge) * taxRate) / 100;
  order.total = afterDiscount + order.serviceCharge + order.taxAmount;
};

export const useStandaloneOpenOrderStore = create<StandaloneOpenOrderState & StandaloneOpenOrderActions>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      createOrder: (tableNumber, customerName) => {
        // Check uniqueness: deny if table number already exists among open orders
        const currentOrders = get().orders;
        const duplicate = currentOrders.find(
          (o) => o.status === 'open' && o.tableNumber === tableNumber
        );
        if (duplicate) return null;

        const orderId = generateId();
        const now = new Date().toISOString();

        set((state) => {
          const newOrder: StandaloneOpenOrder = {
            id: orderId,
            tableNumber,
            customerName,
            confirmedBatches: [],
            unconfirmedItems: [],
            subtotal: 0,
            discountAmount: 0,
            discountType: null,
            taxAmount: 0,
            serviceCharge: 0,
            total: 0,
            status: 'open',
            createdAt: now,
            lastModifiedAt: now,
          };
          state.orders.push(newOrder);
          state.activeOrderId = orderId;
        });

        return orderId;
      },

      setActiveOrder: (orderId) => set((state) => {
        state.activeOrderId = orderId;
      }),

      getActiveOrder: () => {
        const state = get();
        if (!state.activeOrderId) return null;
        return state.orders.find((o) => o.id === state.activeOrderId) ?? null;
      },

      addProduct: (product, quantity = 1) => set((state) => {
        const order = state.orders.find((o) => o.id === state.activeOrderId);
        if (!order) return;

        const existingItem = order.unconfirmedItems.find(
          (item) => item.productId === product.id && !item.isOpenItem
        );

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
          order.unconfirmedItems.push(newItem);
        }

        order.lastModifiedAt = new Date().toISOString();
        calculateOrderTotalsInline(order);
      }),

      addOpenItem: (data) => set((state) => {
        const order = state.orders.find((o) => o.id === state.activeOrderId);
        if (!order) return;

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
        order.unconfirmedItems.push(newItem);
        order.lastModifiedAt = new Date().toISOString();
        calculateOrderTotalsInline(order);
      }),

      updateUnconfirmedItem: (itemId, updates) => set((state) => {
        const order = state.orders.find((o) => o.id === state.activeOrderId);
        if (!order) return;

        const item = order.unconfirmedItems.find((i) => i.id === itemId);
        if (!item) return;

        Object.assign(item, updates);

        if (updates.quantity !== undefined || updates.unitPrice !== undefined || updates.discount !== undefined) {
          item.subtotal = item.quantity * item.unitPrice - item.discount;
        }

        if (item.quantity <= 0) {
          order.unconfirmedItems = order.unconfirmedItems.filter((i) => i.id !== itemId);
        }

        order.lastModifiedAt = new Date().toISOString();
        calculateOrderTotalsInline(order);
      }),

      removeUnconfirmedItem: (itemId) => set((state) => {
        const order = state.orders.find((o) => o.id === state.activeOrderId);
        if (!order) return;

        order.unconfirmedItems = order.unconfirmedItems.filter((i) => i.id !== itemId);
        order.lastModifiedAt = new Date().toISOString();
        calculateOrderTotalsInline(order);
      }),

      confirmItems: (confirmedBy) => set((state) => {
        const order = state.orders.find((o) => o.id === state.activeOrderId);
        if (!order || order.unconfirmedItems.length === 0) return;

        const batch: StandaloneConfirmedBatch = {
          id: generateId(),
          items: [...order.unconfirmedItems],
          confirmedAt: new Date().toISOString(),
          confirmedBy,
        };

        order.confirmedBatches.push(batch);
        order.unconfirmedItems = [];
        order.lastModifiedAt = new Date().toISOString();
        calculateOrderTotalsInline(order);
      }),

      closeOrder: (orderId) => set((state) => {
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return;

        order.status = 'closed';
        order.lastModifiedAt = new Date().toISOString();
        state.orders = state.orders.filter((o) => o.id !== orderId);

        if (state.activeOrderId === orderId) {
          state.activeOrderId = null;
        }
      }),

      updateOrderMetadata: (orderId, metadata) => set((state) => {
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return;

        if (metadata.tableNumber !== undefined) {
          const trimmed = metadata.tableNumber.trim();
          if (!trimmed) return; // tableNumber must not be empty
          // Check uniqueness if changing tableNumber
          if (trimmed !== order.tableNumber) {
            const duplicate = state.orders.find(
              (o) => o.status === 'open' && o.id !== orderId && o.tableNumber === trimmed
            );
            if (duplicate) return;
          }
          order.tableNumber = trimmed;
        }
        if (metadata.customerName !== undefined) {
          order.customerName = metadata.customerName || undefined;
        }
        order.lastModifiedAt = new Date().toISOString();
      }),

      setOrderDiscount: (orderId, amount, type) => set((state) => {
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return;

        order.discountType = type;
        if (type === 'percentage') {
          order.discountAmount = (order.subtotal * amount) / 100;
        } else {
          order.discountAmount = amount;
        }
        order.lastModifiedAt = new Date().toISOString();
        calculateOrderTotalsInline(order);
      }),

      setOrderNote: (orderId, note) => set((state) => {
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return;

        order.note = note;
        order.lastModifiedAt = new Date().toISOString();
      }),

      calculateOrderTotals: (orderId) => set((state) => {
        const order = state.orders.find((o) => o.id === orderId);
        if (!order) return;

        calculateOrderTotalsInline(order);
      }),

      deleteOrder: (orderId) => set((state) => {
        state.orders = state.orders.filter((o) => o.id !== orderId);
        if (state.activeOrderId === orderId) {
          state.activeOrderId = null;
        }
      }),

      addItemsToOrder: (orderId, items) => set((state) => {
        const order = state.orders.find((o) => o.id === orderId);
        if (!order || items.length === 0) return;

        items.forEach((newItem) => {
          const existingItem = order.unconfirmedItems.find(
            (item) => item.productId === newItem.productId && !item.isOpenItem && !newItem.isOpenItem
          );

          if (existingItem) {
            existingItem.quantity += newItem.quantity;
            existingItem.subtotal = existingItem.quantity * existingItem.unitPrice - existingItem.discount;
          } else {
            order.unconfirmedItems.push({
              ...newItem,
              id: generateId(),
            });
          }
        });

        order.lastModifiedAt = new Date().toISOString();
        state.activeOrderId = orderId;
        calculateOrderTotalsInline(order);
      }),

      reset: () => set(initialState),
    })),
    {
      name: 'standalone-open-orders',
    }
  )
);
