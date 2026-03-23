import { useCallback } from 'react';
import { useStandaloneOpenOrderStore } from '@/stores/standalone/standaloneOpenOrderStore';
import { useStandaloneConfigStore } from '@/stores/standalone/standaloneConfigStore';
import { useStandaloneTransactionStore } from '@/stores/standalone/standaloneTransactionStore';
import type { StandaloneTransaction } from '@/types/standalone';
import { sumItemQuantity } from '@/lib/utils/itemCount';

export function useStandaloneOpenOrder() {
  const {
    orders,
    activeOrderId,
    createOrder,
    setActiveOrder,
    getActiveOrder,
    addProduct,
    addOpenItem,
    updateUnconfirmedItem,
    removeUnconfirmedItem,
    confirmItems,
    closeOrder,
    updateOrderMetadata,
    setOrderDiscount,
    setOrderNote,
    deleteOrder,
  } = useStandaloneOpenOrderStore();

  const { businessName } = useStandaloneConfigStore();
  const { addTransaction } = useStandaloneTransactionStore();

  const activeOrder = getActiveOrder();

  const handleCreateOrder = useCallback((tableNumber: string, customerName?: string): string | null => {
    return createOrder(tableNumber, customerName);
  }, [createOrder]);

  const handleConfirmItems = useCallback(() => {
    confirmItems(businessName || 'standalone');
  }, [confirmItems, businessName]);

  const handleCompleteOrder = useCallback((
    paymentMethod: 'cash' | 'card' | 'qris' | 'other',
    amountPaid: number,
  ): StandaloneTransaction | null => {
    if (!activeOrder) return null;

    const allConfirmedItems = activeOrder.confirmedBatches.flatMap((batch) => batch.items);
    if (allConfirmedItems.length === 0) return null;

    if (amountPaid < activeOrder.total) return null;

    const changeAmount = Math.max(0, amountPaid - activeOrder.total);

    const transaction = addTransaction({
      items: [...allConfirmedItems, ...activeOrder.unconfirmedItems],
      subtotal: activeOrder.subtotal,
      discountAmount: activeOrder.discountAmount,
      taxAmount: activeOrder.taxAmount,
      serviceCharge: activeOrder.serviceCharge,
      total: activeOrder.total,
      paymentMethod,
      amountPaid,
      changeAmount,
      note: activeOrder.note,
      tableNumber: activeOrder.tableNumber || undefined,
      customerName: activeOrder.customerName || undefined,
    });

    closeOrder(activeOrder.id);

    return transaction;
  }, [activeOrder, addTransaction, closeOrder]);

  const confirmedItems = activeOrder?.confirmedBatches.flatMap((batch) => batch.items) ?? [];

  return {
    orders: orders.filter((o) => o.status === 'open'),
    activeOrderId,

    activeOrder,
    tableNumber: activeOrder?.tableNumber ?? '',
    customerName: activeOrder?.customerName,
    confirmedBatches: activeOrder?.confirmedBatches ?? [],
    unconfirmedItems: activeOrder?.unconfirmedItems ?? [],
    subtotal: activeOrder?.subtotal ?? 0,
    discountAmount: activeOrder?.discountAmount ?? 0,
    discountType: activeOrder?.discountType ?? null,
    taxAmount: activeOrder?.taxAmount ?? 0,
    serviceCharge: activeOrder?.serviceCharge ?? 0,
    total: activeOrder?.total ?? 0,
    note: activeOrder?.note,
    status: activeOrder?.status ?? null,

    hasUnconfirmedItems: (activeOrder?.unconfirmedItems.length ?? 0) > 0,
    hasConfirmedItems: confirmedItems.length > 0,
    confirmedItemCount: sumItemQuantity(confirmedItems),
    unconfirmedItemCount: sumItemQuantity(activeOrder?.unconfirmedItems ?? []),
    totalItemCount: sumItemQuantity(confirmedItems) + sumItemQuantity(activeOrder?.unconfirmedItems ?? []),

    createOrder: handleCreateOrder,
    setActiveOrder,
    deleteOrder,

    addProduct,
    addOpenItem,
    updateUnconfirmedItem,
    removeUnconfirmedItem,

    confirmItems: handleConfirmItems,

    updateMetadata: (metadata: { customerName?: string; tableNumber?: string }) => {
      if (activeOrder) {
        updateOrderMetadata(activeOrder.id, metadata);
      }
    },
    setDiscount: (amount: number, type: 'fixed' | 'percentage') => {
      if (activeOrder) {
        setOrderDiscount(activeOrder.id, amount, type);
      }
    },
    setNote: (note: string) => {
      if (activeOrder) {
        setOrderNote(activeOrder.id, note);
      }
    },

    completeOrder: handleCompleteOrder,
  };
}
