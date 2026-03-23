/** Sum of item.quantity across an array of items */
export function sumItemQuantity(items: { quantity: number }[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Total quantity across all batches */
export function sumBatchItemQuantity(batches: { items: { quantity: number }[] }[]): number {
  return batches.reduce((sum, batch) => sum + sumItemQuantity(batch.items), 0);
}

/** Total quantity for an order (confirmed + unconfirmed) */
export function getOrderItemCount(order: {
  confirmedBatches: { items: { quantity: number }[] }[];
  unconfirmedItems: { quantity: number }[];
}): number {
  return sumBatchItemQuantity(order.confirmedBatches) + sumItemQuantity(order.unconfirmedItems);
}
