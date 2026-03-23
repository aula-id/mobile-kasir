import { useState } from 'react';
import { useStandaloneCartStore } from '@/stores/standalone/standaloneCartStore';
import { useStandaloneConfigStore } from '@/stores/standalone/standaloneConfigStore';
import { useStandaloneTransactionStore } from '@/stores/standalone/standaloneTransactionStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';
import { formatCurrency } from '@/lib/utils/format';
import { useStandaloneCatalogStore } from '@/stores/standalone/standaloneCatalogStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { motion } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingCart, CreditCard, Banknote, QrCode, Wallet, Printer, ChevronDown } from 'lucide-react';
import { usePrintReceipt } from '@/hooks/usePrintReceipt';
import { generateStandaloneReceiptText } from '@/lib/utils/receipt';

interface StandaloneCartProps {
  onCheckoutComplete?: () => void;
}

type PaymentMethod = 'cash' | 'card' | 'qris' | 'other';

export function StandaloneCart({ onCheckoutComplete }: StandaloneCartProps) {
  const {
    items,
    subtotal,
    discountAmount,
    taxAmount,
    serviceCharge,
    total,
    isProcessing,
    updateItemQuantity,
    removeItem,
    setIsProcessing,
    clearCart,
  } = useStandaloneCartStore();
  const { currency, taxRate, serviceChargeEnabled, serviceChargeRate, businessName } = useStandaloneConfigStore();
  const { addTransaction } = useStandaloneTransactionStore();
  const { appSettings } = useSettingsStore();
  const lang = appSettings.language;
  const { getProductById } = useStandaloneCatalogStore();
  const { printStandaloneTransaction, isPrinting, isConnected: printerConnected } = usePrintReceipt();

  const [showPayment, setShowPayment] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<{
    receiptNumber: string;
    changeAmount: number;
    transaction: import('@/types/standalone').StandaloneTransaction;
  } | null>(null);
  const [showReceiptText, setShowReceiptText] = useState(false);

  const isEmpty = items.length === 0;

  const paymentMethods: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { value: 'cash', label: t(lang, 'standalone.cash'), icon: <Banknote className="w-5 h-5" /> },
    { value: 'card', label: t(lang, 'standalone.card'), icon: <CreditCard className="w-5 h-5" /> },
    { value: 'qris', label: 'QRIS', icon: <QrCode className="w-5 h-5" /> },
    { value: 'other', label: t(lang, 'standalone.other'), icon: <Wallet className="w-5 h-5" /> },
  ];

  const handleCheckout = () => {
    if (isEmpty) return;
    setShowPayment(true);
    setCashReceived('');
  };

  const handlePaymentConfirm = () => {
    setIsProcessing(true);

    const amountPaid = selectedPayment === 'cash' ? parseFloat(cashReceived) || total : total;
    const changeAmount = Math.max(0, amountPaid - total);

    // Create transaction
    const transaction = addTransaction({
      items: [...items],
      subtotal,
      discountAmount,
      taxAmount,
      serviceCharge,
      total,
      paymentMethod: selectedPayment,
      amountPaid,
      changeAmount,
    });

    // Auto-print if printer connected
    if (printerConnected) {
      printStandaloneTransaction(transaction, {
        businessName: useStandaloneConfigStore.getState().businessName,
        currency,
        taxRate,
        serviceChargeEnabled,
        serviceChargeRate,
      });
    }

    // Show receipt
    setCompletedTransaction({
      receiptNumber: transaction.receiptNumber,
      changeAmount,
      transaction,
    });
    setShowPayment(false);
    setShowReceiptText(false);
    setShowReceipt(true);
    setIsProcessing(false);
  };

  const handleReceiptClose = () => {
    setShowReceipt(false);
    setCompletedTransaction(null);
    clearCart();
    onCheckoutComplete?.();
  };

  const quickCashAmounts = [
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
    Math.ceil(total / 100000) * 100000,
  ].filter((amt, idx, arr) => arr.indexOf(amt) === idx && amt >= total);

  const canConfirmPayment = selectedPayment === 'cash'
    ? (parseFloat(cashReceived) || 0) >= total
    : true;

  return (
    <div className="h-full flex flex-col bg-[#FAF7F2]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#E8E2D9]">
        <h2 className="font-semibold text-[#3D405B]">
          {t(lang, 'pos.currentOrder')}
          {items.length > 0 && (
            <span className="ml-2 text-sm font-normal text-[#8D8D9B]">
              ({items.length} {items.length === 1 ? t(lang, 'pos.item') : t(lang, 'pos.items')})
            </span>
          )}
        </h2>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-[#8D8D9B] p-4">
            <ShoppingCart className="w-16 h-16 mb-3 text-[#E8E2D9]" />
            <p className="text-lg font-medium">{t(lang, 'pos.cartEmpty')}</p>
            <p className="text-sm">{t(lang, 'pos.cartEmptyHint')}</p>
          </div>
        ) : (
          <div className="divide-y divide-[#E8E2D9]">
            {items.map((item) => (
              <div key={item.id} className="p-4 bg-white">
                <div className="flex gap-3">
                  {/* Image */}
                  <div className="w-12 h-12 rounded-lg bg-[#F5F0E8] flex items-center justify-center overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingCart className="w-5 h-5 text-[#C9B8A8]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[#3D405B] truncate">{item.productName}</h4>
                    <p className="text-sm text-[#8D8D9B]">
                      {formatCurrency(item.unitPrice, currency)}
                    </p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg bg-[#F5F0E8] flex items-center justify-center text-[#8D8D9B] hover:bg-[#E8E2D9] transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex flex-col items-center">
                      <span className="w-8 text-center font-medium text-[#3D405B]">{item.quantity}</span>
                      {/* Show remaining stock */}
                      {!item.isOpenItem && (() => {
                        const product = getProductById(item.productId);
                        if (product?.trackStock) {
                          const remaining = product.stockQuantity - item.quantity;
                          return (
                            <span className={`text-xs ${remaining <= 0 ? 'text-red-500' : 'text-[#8D8D9B]'}`}>
                              / {product.stockQuantity}
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    {/* + button with stock protection */}
                    {(() => {
                      const product = !item.isOpenItem ? getProductById(item.productId) : null;
                      const isAtLimit = product?.trackStock && item.quantity >= product.stockQuantity;
                      return (
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          disabled={isAtLimit}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                            isAtLimit
                              ? 'bg-[#E8E2D9] text-[#C9B8A8] cursor-not-allowed'
                              : 'bg-[#F5F0E8] text-[#8D8D9B] hover:bg-[#E8E2D9]'
                          }`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      );
                    })()}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-[#8D8D9B] hover:bg-red-50 hover:text-red-500 transition-colors ml-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtotal */}
                <div className="text-right mt-2">
                  <span className="font-semibold text-[#E07A5F]">
                    {formatCurrency(item.subtotal, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals and Checkout */}
      {!isEmpty && (
        <div className="border-t border-[#E8E2D9] bg-white">
          {/* Totals */}
          <div className="p-4 space-y-2 text-sm">
            <div className="flex justify-between text-[#8D8D9B]">
              <span>{t(lang, 'pos.subtotal')}</span>
              <span>{formatCurrency(subtotal, currency)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>{t(lang, 'pos.discount')}</span>
                <span>-{formatCurrency(discountAmount, currency)}</span>
              </div>
            )}
            {serviceChargeEnabled && serviceCharge > 0 && (
              <div className="flex justify-between text-[#8D8D9B]">
                <span>{t(lang, 'pos.service')} ({serviceChargeRate}%)</span>
                <span>{formatCurrency(serviceCharge, currency)}</span>
              </div>
            )}
            {taxRate > 0 && (
              <div className="flex justify-between text-[#8D8D9B]">
                <span>{t(lang, 'pos.tax')} ({taxRate}%)</span>
                <span>{formatCurrency(taxAmount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-lg text-[#3D405B] pt-2 border-t border-[#E8E2D9]">
              <span>{t(lang, 'pos.total')}</span>
              <span className="text-[#E07A5F]">{formatCurrency(total, currency)}</span>
            </div>
          </div>

          {/* Checkout button */}
          <div className="p-4 pt-0">
            <motion.div whileTap={{ scale: 0.98 }}>
              <Button
                size="lg"
                fullWidth
                disabled={isEmpty}
                isLoading={isProcessing}
                onClick={handleCheckout}
                className="h-14"
              >
                {t(lang, 'pos.charge')} {formatCurrency(total, currency)}
              </Button>
            </motion.div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <Modal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        title={t(lang, 'standalone.selectPayment')}
        size="md"
      >
        <div className="space-y-6">
          {/* Payment methods */}
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => (
              <button
                key={method.value}
                onClick={() => setSelectedPayment(method.value)}
                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-colors ${
                  selectedPayment === method.value
                    ? 'border-[#E07A5F] bg-[#FDF6F4] text-[#E07A5F]'
                    : 'border-[#E8E2D9] hover:border-[#C9B8A8] text-[#3D405B]'
                }`}
              >
                {method.icon}
                <span className="font-medium text-sm">{method.label}</span>
              </button>
            ))}
          </div>

          {/* Cash input */}
          {selectedPayment === 'cash' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-[#3D405B] mb-2">
                  {t(lang, 'pos.cashReceived')}
                </label>
                <Input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder={formatCurrency(total, currency)}
                  className="text-lg font-semibold"
                  autoFocus
                />
              </div>

              {/* Quick amounts */}
              {quickCashAmounts.length > 0 && (
                <div className="flex gap-2">
                  {quickCashAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setCashReceived(amount.toString())}
                      className="flex-1 py-2 px-3 rounded-lg bg-[#F5F0E8] text-[#3D405B] text-sm font-medium hover:bg-[#E8E2D9] transition-colors"
                    >
                      {formatCurrency(amount, currency)}
                    </button>
                  ))}
                </div>
              )}

              {/* Change display */}
              {(parseFloat(cashReceived) || 0) >= total && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex justify-between items-center">
                    <span className="text-green-700">{t(lang, 'pos.change')}</span>
                    <span className="text-xl font-bold text-green-700">
                      {formatCurrency(parseFloat(cashReceived) - total, currency)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Amount due display for non-cash */}
          {selectedPayment !== 'cash' && (
            <div className="p-4 bg-[#F5F0E8] rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-[#8D8D9B]">{t(lang, 'pos.amountDue')}</span>
                <span className="text-xl font-bold text-[#E07A5F]">
                  {formatCurrency(total, currency)}
                </span>
              </div>
            </div>
          )}

          {/* Confirm button */}
          <Button
            size="lg"
            fullWidth
            disabled={!canConfirmPayment}
            isLoading={isProcessing}
            onClick={handlePaymentConfirm}
            className="h-14"
          >
            {t(lang, 'pos.confirm')}
          </Button>
        </div>
      </Modal>

      {/* Receipt Modal */}
      {completedTransaction && (
        <>
          <Modal
            isOpen={showReceipt}
            onClose={handleReceiptClose}
            title={t(lang, 'pos.receipt')}
            size="sm"
          >
            <div className="space-y-4">
              {/* Success indicator */}
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-[#3D405B]">{t(lang, 'standalone.paymentSuccess')}</h3>
              </div>

              {/* Change display */}
              {completedTransaction.changeAmount > 0 && (
                <div className="p-4 bg-green-50 rounded-xl text-center">
                  <p className="text-sm text-green-700">{t(lang, 'pos.change')}</p>
                  <p className="text-2xl font-bold text-green-700">
                    {formatCurrency(completedTransaction.changeAmount, currency)}
                  </p>
                </div>
              )}

              {/* Receipt preview accordion */}
              <div className="rounded-lg overflow-hidden border border-[#E8E2D9]">
                <button
                  onClick={() => setShowReceiptText(!showReceiptText)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-[#F5F0E8] text-sm font-medium text-[#3D405B]"
                >
                  <span>{t(lang, 'openOrders.viewReceipt')}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showReceiptText ? 'rotate-180' : ''}`} />
                </button>
                {showReceiptText && (
                  <div className="bg-[#1a1a2e] p-4 max-h-[300px] overflow-y-auto overflow-x-auto">
                    <pre className="font-mono text-xs leading-relaxed text-[#E8E2D9] whitespace-pre">
                      <code>
                        {generateStandaloneReceiptText(completedTransaction.transaction, {
                          businessName,
                          currency,
                          taxRate,
                          serviceChargeEnabled,
                          serviceChargeRate,
                        })}
                      </code>
                    </pre>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {printerConnected && (
                  <Button
                    variant="secondary"
                    onClick={() => printStandaloneTransaction(completedTransaction.transaction, {
                      businessName,
                      currency,
                      taxRate,
                      serviceChargeEnabled,
                      serviceChargeRate,
                    })}
                    disabled={isPrinting}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Printer className="w-6 h-6" />
                    {isPrinting ? t(lang, 'pos.printing') : t(lang, 'pos.reprint')}
                  </Button>
                )}
                <Button fullWidth onClick={handleReceiptClose}>
                  {t(lang, 'standalone.done')}
                </Button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
}
