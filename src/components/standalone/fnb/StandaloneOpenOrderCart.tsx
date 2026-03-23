import { useState } from 'react';
import { useStandaloneOpenOrder } from '@/hooks/useStandaloneOpenOrder';
import { useStandaloneConfigStore } from '@/stores/standalone/standaloneConfigStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';
import { formatCurrency } from '@/lib/utils/format';
import { StandaloneOrderMetadataBar } from './StandaloneOrderMetadataBar';
import { StandaloneConfirmedItemsSection } from './StandaloneConfirmedItemsSection';
import { StandaloneConfirmItemsButton } from './StandaloneConfirmItemsButton';
import { CartItem } from '@/components/shared/CartItem';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ShoppingBag, AlertCircle, ArrowLeft, Banknote, CreditCard, QrCode, Wallet, ChevronDown } from 'lucide-react';
import { Printer } from 'lucide-react';
import { usePrintReceipt } from '@/hooks/usePrintReceipt';
import { useStandaloneTransactionStore } from '@/stores/standalone/standaloneTransactionStore';
import { generateStandaloneReceiptText } from '@/lib/utils/receipt';
import { sumItemQuantity } from '@/lib/utils/itemCount';

type PaymentMethod = 'cash' | 'card' | 'qris' | 'other';

interface StandaloneOpenOrderCartProps {
  orderId: string;
  onBack: () => void;
  onChargeComplete?: () => void;
}

export function StandaloneOpenOrderCart({ orderId, onBack, onChargeComplete }: StandaloneOpenOrderCartProps) {
  const { appSettings } = useSettingsStore();
  const lang = appSettings.language;
  const { currency, taxRate, serviceChargeEnabled, serviceChargeRate, businessName } = useStandaloneConfigStore();
  const { printStandaloneTransaction, isPrinting, isConnected: printerConnected } = usePrintReceipt();

  const {
    activeOrder,
    updateUnconfirmedItem,
    removeUnconfirmedItem,
    confirmItems,
    hasUnconfirmedItems,
    hasConfirmedItems,
    completeOrder,
  } = useStandaloneOpenOrder();

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

  if (!activeOrder || activeOrder.id !== orderId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#8D8D9B] p-4">
        <AlertCircle className="w-12 h-12 mb-3" />
        <p className="text-sm">Order not found</p>
      </div>
    );
  }

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeUnconfirmedItem(itemId);
    } else {
      updateUnconfirmedItem(itemId, { quantity });
    }
  };

  const handleConfirm = () => {
    confirmItems();
  };

  const isEmpty = !hasConfirmedItems && !hasUnconfirmedItems;

  const paymentMethods: { value: PaymentMethod; label: string; icon: React.ReactNode }[] = [
    { value: 'cash', label: t(lang, 'standalone.cash'), icon: <Banknote className="w-5 h-5" /> },
    { value: 'card', label: t(lang, 'standalone.card'), icon: <CreditCard className="w-5 h-5" /> },
    { value: 'qris', label: 'QRIS', icon: <QrCode className="w-5 h-5" /> },
    { value: 'other', label: t(lang, 'standalone.other'), icon: <Wallet className="w-5 h-5" /> },
  ];

  const total = activeOrder.total;

  const quickCashAmounts = [
    Math.ceil(total / 10000) * 10000,
    Math.ceil(total / 50000) * 50000,
    Math.ceil(total / 100000) * 100000,
  ].filter((amt, idx, arr) => arr.indexOf(amt) === idx && amt >= total);

  const canConfirmPayment = selectedPayment === 'cash'
    ? (parseFloat(cashReceived) || 0) >= total
    : true;

  const handleChargeOrder = () => {
    setShowPayment(true);
    setCashReceived('');
    setSelectedPayment('cash');
  };

  const handlePaymentConfirm = () => {
    const amountPaid = selectedPayment === 'cash' ? parseFloat(cashReceived) || total : total;
    const result = completeOrder(selectedPayment, amountPaid);

    if (result) {
      // Find the transaction that was just created
      const { transactions: txns } = useStandaloneTransactionStore.getState();
      const fullTransaction = txns.find(tx => tx.receiptNumber === result.receiptNumber);

      if (fullTransaction) {
        // Auto-print if printer connected
        if (printerConnected) {
          printStandaloneTransaction(fullTransaction, {
            businessName,
            currency,
            taxRate,
            serviceChargeEnabled,
            serviceChargeRate,
          });
        }

        setCompletedTransaction({
          receiptNumber: result.receiptNumber,
          changeAmount: result.changeAmount,
          transaction: fullTransaction,
        });
      } else {
        setCompletedTransaction({
          receiptNumber: result.receiptNumber,
          changeAmount: result.changeAmount,
          transaction: null as any,
        });
      }
      setShowReceiptText(false);
      setShowPayment(false);
      setShowReceipt(true);
    }
  };

  const handleReceiptClose = () => {
    setShowReceipt(false);
    setCompletedTransaction(null);
    onChargeComplete?.();
  };

  return (
    <div className="h-full flex flex-col bg-[#FAF7F2]">
      {/* Header with Back Button */}
      <div className="px-4 py-3 border-b border-[#E8E2D9]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-[#E8E2D9] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#3D405B]" />
          </button>
          <div className="flex-1">
            <StandaloneOrderMetadataBar orderId={orderId} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center text-[#8D8D9B] p-4">
            <ShoppingBag className="w-16 h-16 mb-3" />
            <p className="text-lg font-medium">{t(lang, 'pos.cartEmpty')}</p>
            <p className="text-sm">{t(lang, 'pos.cartEmptyHint')}</p>
          </div>
        ) : (
          <>
            {hasConfirmedItems && (
              <StandaloneConfirmedItemsSection batches={activeOrder.confirmedBatches} />
            )}

            {hasUnconfirmedItems && (
              <div>
                <div className="px-4 py-2 bg-[#FFF0EB] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#E07A5F] animate-pulse" />
                  <span className="text-sm font-medium text-[#E07A5F]">
                    {t(lang, 'openOrders.pendingItems')}
                  </span>
                  <span className="text-xs text-[#E07A5F] opacity-70">
                    ({sumItemQuantity(activeOrder.unconfirmedItems)} {sumItemQuantity(activeOrder.unconfirmedItems) === 1 ? t(lang, 'pos.item') : t(lang, 'pos.items')})
                  </span>
                </div>
                <div className="py-1">
                  {activeOrder.unconfirmedItems.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onUpdateQuantity={handleUpdateQuantity}
                      onRemove={removeUnconfirmedItem}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom Section: Totals and Actions */}
      {!isEmpty && (
        <div className="border-t border-[#E8E2D9]">
          <div className="px-4 py-3 space-y-1">
            <div className="flex justify-between text-base">
              <span className="text-[#8D8D9B]">{t(lang, 'pos.subtotal')}</span>
              <span className="text-[#3D405B]">{formatCurrency(activeOrder.subtotal, currency)}</span>
            </div>
            {activeOrder.discountAmount > 0 && (
              <div className="flex justify-between text-base">
                <span className="text-[#8D8D9B]">{t(lang, 'pos.discount')}</span>
                <span className="text-[#E07A5F]">-{formatCurrency(activeOrder.discountAmount, currency)}</span>
              </div>
            )}
            {activeOrder.serviceCharge > 0 && (
              <div className="flex justify-between text-base">
                <span className="text-[#8D8D9B]">{t(lang, 'pos.service')}</span>
                <span className="text-[#3D405B]">{formatCurrency(activeOrder.serviceCharge, currency)}</span>
              </div>
            )}
            {activeOrder.taxAmount > 0 && (
              <div className="flex justify-between text-base">
                <span className="text-[#8D8D9B]">{t(lang, 'pos.tax')}</span>
                <span className="text-[#3D405B]">{formatCurrency(activeOrder.taxAmount, currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold pt-2 border-t border-[#E8E2D9]">
              <span className="text-[#3D405B]">{t(lang, 'pos.total')}</span>
              <span className="text-[#E07A5F]">{formatCurrency(activeOrder.total, currency)}</span>
            </div>
          </div>

          <div className="px-4 pb-4 space-y-2">
            {hasUnconfirmedItems && (
              <StandaloneConfirmItemsButton
                itemCount={sumItemQuantity(activeOrder.unconfirmedItems)}
                onConfirm={handleConfirm}
              />
            )}

            <Button
              variant={hasUnconfirmedItems ? 'secondary' : 'primary'}
              fullWidth
              onClick={handleChargeOrder}
              disabled={isEmpty}
            >
              {t(lang, 'openOrders.chargeTable')} {formatCurrency(activeOrder.total, currency)}
              {hasUnconfirmedItems && (
                <span className="ml-1 text-xs opacity-70">
                  ({t(lang, 'openOrders.confirmItemsFirst')})
                </span>
              )}
            </Button>
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

          <Button
            size="lg"
            fullWidth
            disabled={!canConfirmPayment}
            onClick={handlePaymentConfirm}
            className="h-14"
          >
            {t(lang, 'pos.confirm')}
          </Button>
        </div>
      </Modal>

      {/* Receipt Modal */}
      {completedTransaction && (
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

            {/* Receipt preview */}
            {completedTransaction.transaction && (
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
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {printerConnected && completedTransaction.transaction && (
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
      )}
    </div>
  );
}
