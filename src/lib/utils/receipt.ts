import type { Transaction, BusinessSettings } from '@/types';
import type { StandaloneTransaction } from '@/types/standalone';
import { formatCurrency, formatDateTime } from './format';

export const PAPER_CHAR_WIDTHS: Record<number, number> = {
  42: 22,
  48: 26,
  58: 32,
  60: 32,
  80: 48,
};

function compactCurrency(amount: number, currency: string): string {
  return formatCurrency(amount, currency).replace(/^(Rp)\s+/, '$1');
}

/**
 * Generate receipt text for platform Transaction
 */
export function generateReceiptText(
  transaction: Transaction,
  settings: BusinessSettings,
  paperWidth: number = 58
): string {
  const width = PAPER_CHAR_WIDTHS[paperWidth] || 32;

  if (width <= 26) {
    return generateNarrowReceiptText(transaction, settings, width);
  }
  return generateStandardReceiptText(transaction, settings, width);
}

function generateStandardReceiptText(
  transaction: Transaction,
  settings: BusinessSettings,
  width: number
): string {
  const lines: string[] = [];

  const center = (text: string) => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  const rightAlign = (label: string, value: string) => {
    const padding = Math.max(1, width - label.length - value.length);
    return label + ' '.repeat(padding) + value;
  };

  const divider = '='.repeat(width);
  const thinDivider = '-'.repeat(width);

  // Header
  lines.push(center(settings.businessName));
  if (settings.receiptHeader) {
    lines.push(center(settings.receiptHeader));
  }
  lines.push(divider);

  // Transaction info
  lines.push(`Date: ${formatDateTime(transaction.createdAt)}`);
  lines.push(`Cashier: ${transaction.userName}`);
  lines.push(`Trx: ${transaction.localId}`);
  if (transaction.tableNumber) {
    lines.push(`Table: ${transaction.tableNumber}`);
  }
  if (transaction.customerName) {
    lines.push(`Customer: ${transaction.customerName}`);
  }
  lines.push(thinDivider);

  // Items
  for (const item of transaction.items) {
    lines.push(item.productName);
    const qty = `  ${item.quantity} x ${formatCurrency(item.unitPrice, settings.currency)}`;
    const subtotal = formatCurrency(item.subtotal, settings.currency);
    const padding = Math.max(1, width - qty.length - subtotal.length);
    lines.push(qty + ' '.repeat(padding) + subtotal);
    if (item.discount > 0) {
      lines.push(`  Disc: -${formatCurrency(item.discount, settings.currency)}`);
    }
  }

  lines.push(thinDivider);

  // Totals
  lines.push(rightAlign('Subtotal', formatCurrency(transaction.subtotal, settings.currency)));
  if (transaction.discountAmount > 0) {
    lines.push(rightAlign('Discount', '-' + formatCurrency(transaction.discountAmount, settings.currency)));
  }
  if (transaction.serviceCharge > 0) {
    lines.push(rightAlign('Service', formatCurrency(transaction.serviceCharge, settings.currency)));
  }
  if (transaction.taxAmount > 0) {
    lines.push(rightAlign('Tax', formatCurrency(transaction.taxAmount, settings.currency)));
  }

  lines.push(divider);
  lines.push(rightAlign('TOTAL', formatCurrency(transaction.total, settings.currency)));
  lines.push(divider);

  // Payments
  for (const payment of transaction.payments) {
    lines.push(rightAlign(payment.method.toUpperCase(), formatCurrency(payment.amount, settings.currency)));
  }
  if (transaction.change > 0) {
    lines.push(rightAlign('Change', formatCurrency(transaction.change, settings.currency)));
  }

  lines.push('');

  // Footer
  if (settings.receiptFooter) {
    lines.push(center(settings.receiptFooter));
  }
  lines.push(center('Thank you!'));

  return lines.join('\n');
}

function generateNarrowReceiptText(
  transaction: Transaction,
  settings: BusinessSettings,
  width: number
): string {
  const lines: string[] = [];
  const cur = (amount: number) => compactCurrency(amount, settings.currency);

  const center = (text: string) => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  const rightAlign = (label: string, value: string) => {
    const padding = Math.max(1, width - label.length - value.length);
    return label + ' '.repeat(padding) + value;
  };

  const rightJustify = (text: string) => {
    const padding = Math.max(0, width - text.length);
    return ' '.repeat(padding) + text;
  };

  const divider = '='.repeat(width);
  const thinDivider = '-'.repeat(width);

  // Header
  lines.push(center(settings.businessName));
  if (settings.receiptHeader) {
    lines.push(center(settings.receiptHeader));
  }
  lines.push(divider);

  // Transaction info - compact format
  const dateStr = formatDateTime(transaction.createdAt);
  // formatDateTime returns something like "5 Mar 2026, 21.24" - split on comma
  const commaIdx = dateStr.lastIndexOf(',');
  if (commaIdx !== -1) {
    const datePart = dateStr.substring(0, commaIdx).trim();
    const timePart = dateStr.substring(commaIdx + 1).trim();
    lines.push(rightAlign(datePart, timePart));
  } else {
    lines.push(dateStr);
  }
  lines.push(transaction.userName);
  lines.push(`Trx: ${transaction.localId}`);
  if (transaction.tableNumber) {
    lines.push(`Table: ${transaction.tableNumber}`);
  }
  if (transaction.customerName) {
    lines.push(transaction.customerName);
  }
  lines.push(thinDivider);

  // Items - stacked layout
  for (const item of transaction.items) {
    lines.push(item.productName);
    const qtyLine = ` ${item.quantity} x ${cur(item.unitPrice)}`;
    const subtotal = cur(item.subtotal);
    // Try to fit qty and subtotal on same line
    if (qtyLine.length + 1 + subtotal.length <= width) {
      const padding = Math.max(1, width - qtyLine.length - subtotal.length);
      lines.push(qtyLine + ' '.repeat(padding) + subtotal);
    } else {
      // qty on one line, subtotal right-aligned on next
      lines.push(qtyLine);
      lines.push(rightJustify(subtotal));
    }
    if (item.discount > 0) {
      lines.push(` Disc: -${cur(item.discount)}`);
    }
  }

  lines.push(thinDivider);

  // Totals
  lines.push(rightAlign('Subtotal', cur(transaction.subtotal)));
  if (transaction.discountAmount > 0) {
    lines.push(rightAlign('Discount', '-' + cur(transaction.discountAmount)));
  }
  if (transaction.serviceCharge > 0) {
    lines.push(rightAlign('Service', cur(transaction.serviceCharge)));
  }
  if (transaction.taxAmount > 0) {
    lines.push(rightAlign('Tax', cur(transaction.taxAmount)));
  }

  lines.push(divider);
  lines.push(rightAlign('TOTAL', cur(transaction.total)));
  lines.push(divider);

  // Payments
  for (const payment of transaction.payments) {
    lines.push(rightAlign(payment.method.toUpperCase(), cur(payment.amount)));
  }
  if (transaction.change > 0) {
    lines.push(rightAlign('Change', cur(transaction.change)));
  }

  lines.push('');

  // Footer
  if (settings.receiptFooter) {
    lines.push(center(settings.receiptFooter));
  }
  lines.push(center('Thank you!'));

  return lines.join('\n');
}

/**
 * Generate receipt text for StandaloneTransaction
 */
export function generateStandaloneReceiptText(
  transaction: StandaloneTransaction,
  config: {
    businessName: string;
    currency: string;
    taxRate: number;
    serviceChargeEnabled: boolean;
    serviceChargeRate: number;
  },
  paperWidth: number = 58
): string {
  const width = PAPER_CHAR_WIDTHS[paperWidth] || 32;

  if (width <= 26) {
    return generateNarrowStandaloneReceiptText(transaction, config, width);
  }
  return generateStandardStandaloneReceiptText(transaction, config, width);
}

function generateStandardStandaloneReceiptText(
  transaction: StandaloneTransaction,
  config: {
    businessName: string;
    currency: string;
    taxRate: number;
    serviceChargeEnabled: boolean;
    serviceChargeRate: number;
  },
  width: number
): string {
  const lines: string[] = [];

  const center = (text: string) => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  const rightAlign = (label: string, value: string) => {
    const padding = Math.max(1, width - label.length - value.length);
    return label + ' '.repeat(padding) + value;
  };

  const divider = '='.repeat(width);
  const thinDivider = '-'.repeat(width);

  // Header
  lines.push(center(config.businessName));
  lines.push(divider);

  // Transaction info
  lines.push(`Date: ${formatDateTime(transaction.createdAt)}`);
  lines.push(`Receipt: #${transaction.receiptNumber}`);
  if (transaction.tableNumber) {
    lines.push(`Table: ${transaction.tableNumber}`);
  }
  if (transaction.customerName) {
    lines.push(`Customer: ${transaction.customerName}`);
  }
  lines.push(thinDivider);

  // Items
  for (const item of transaction.items) {
    lines.push(item.productName);
    const qty = `  ${item.quantity} x ${formatCurrency(item.unitPrice, config.currency)}`;
    const subtotal = formatCurrency(item.subtotal, config.currency);
    const padding = Math.max(1, width - qty.length - subtotal.length);
    lines.push(qty + ' '.repeat(padding) + subtotal);
    if (item.discount > 0) {
      lines.push(`  Disc: -${formatCurrency(item.discount, config.currency)}`);
    }
  }

  lines.push(thinDivider);

  // Totals
  lines.push(rightAlign('Subtotal', formatCurrency(transaction.subtotal, config.currency)));
  if (transaction.discountAmount > 0) {
    lines.push(rightAlign('Discount', '-' + formatCurrency(transaction.discountAmount, config.currency)));
  }
  if (config.serviceChargeEnabled && transaction.serviceCharge > 0) {
    lines.push(rightAlign(`Service (${config.serviceChargeRate}%)`, formatCurrency(transaction.serviceCharge, config.currency)));
  }
  if (config.taxRate > 0 && transaction.taxAmount > 0) {
    lines.push(rightAlign(`Tax (${config.taxRate}%)`, formatCurrency(transaction.taxAmount, config.currency)));
  }

  lines.push(divider);
  lines.push(rightAlign('TOTAL', formatCurrency(transaction.total, config.currency)));
  lines.push(divider);

  // Payment
  lines.push(rightAlign(transaction.paymentMethod.toUpperCase(), formatCurrency(transaction.amountPaid, config.currency)));
  if (transaction.changeAmount > 0) {
    lines.push(rightAlign('Change', formatCurrency(transaction.changeAmount, config.currency)));
  }

  lines.push('');
  lines.push(center('Thank you!'));

  return lines.join('\n');
}

function generateNarrowStandaloneReceiptText(
  transaction: StandaloneTransaction,
  config: {
    businessName: string;
    currency: string;
    taxRate: number;
    serviceChargeEnabled: boolean;
    serviceChargeRate: number;
  },
  width: number
): string {
  const lines: string[] = [];
  const cur = (amount: number) => compactCurrency(amount, config.currency);

  const center = (text: string) => {
    const padding = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(padding) + text;
  };

  const rightAlign = (label: string, value: string) => {
    const padding = Math.max(1, width - label.length - value.length);
    return label + ' '.repeat(padding) + value;
  };

  const rightJustify = (text: string) => {
    const padding = Math.max(0, width - text.length);
    return ' '.repeat(padding) + text;
  };

  const divider = '='.repeat(width);
  const thinDivider = '-'.repeat(width);

  // Header
  lines.push(center(config.businessName));
  lines.push(divider);

  // Transaction info - compact
  const dateStr = formatDateTime(transaction.createdAt);
  const commaIdx = dateStr.lastIndexOf(',');
  if (commaIdx !== -1) {
    const datePart = dateStr.substring(0, commaIdx).trim();
    const timePart = dateStr.substring(commaIdx + 1).trim();
    lines.push(rightAlign(datePart, timePart));
  } else {
    lines.push(dateStr);
  }
  lines.push(`#${transaction.receiptNumber}`);
  if (transaction.tableNumber) {
    lines.push(`Table: ${transaction.tableNumber}`);
  }
  if (transaction.customerName) {
    lines.push(transaction.customerName);
  }
  lines.push(thinDivider);

  // Items - stacked layout
  for (const item of transaction.items) {
    lines.push(item.productName);
    const qtyLine = ` ${item.quantity} x ${cur(item.unitPrice)}`;
    const subtotal = cur(item.subtotal);
    if (qtyLine.length + 1 + subtotal.length <= width) {
      const padding = Math.max(1, width - qtyLine.length - subtotal.length);
      lines.push(qtyLine + ' '.repeat(padding) + subtotal);
    } else {
      lines.push(qtyLine);
      lines.push(rightJustify(subtotal));
    }
    if (item.discount > 0) {
      lines.push(` Disc: -${cur(item.discount)}`);
    }
  }

  lines.push(thinDivider);

  // Totals
  lines.push(rightAlign('Subtotal', cur(transaction.subtotal)));
  if (transaction.discountAmount > 0) {
    lines.push(rightAlign('Discount', '-' + cur(transaction.discountAmount)));
  }
  if (config.serviceChargeEnabled && transaction.serviceCharge > 0) {
    const svcLabel = `Svc (${config.serviceChargeRate}%)`;
    lines.push(rightAlign(svcLabel, cur(transaction.serviceCharge)));
  }
  if (config.taxRate > 0 && transaction.taxAmount > 0) {
    const taxLabel = `Tax (${config.taxRate}%)`;
    lines.push(rightAlign(taxLabel, cur(transaction.taxAmount)));
  }

  lines.push(divider);
  lines.push(rightAlign('TOTAL', cur(transaction.total)));
  lines.push(divider);

  // Payment
  lines.push(rightAlign(transaction.paymentMethod.toUpperCase(), cur(transaction.amountPaid)));
  if (transaction.changeAmount > 0) {
    lines.push(rightAlign('Change', cur(transaction.changeAmount)));
  }

  lines.push('');
  lines.push(center('Thank you!'));

  return lines.join('\n');
}
