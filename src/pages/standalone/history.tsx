import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useStandaloneTransactionStore } from '@/stores/standalone/standaloneTransactionStore';
import { useStandaloneConfigStore } from '@/stores/standalone/standaloneConfigStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';
import { formatCurrency } from '@/lib/utils/format';
import {
  Receipt,
  Clock,
  CreditCard,
  Banknote,
  QrCode,
  Wallet,
  ChevronRight,
  XCircle,
} from 'lucide-react';
import { StandaloneSubPageHeader } from '@/components/standalone/StandaloneSubPageHeader';
import type { StandaloneTransaction } from '@/types/standalone';
import { Printer } from 'lucide-react';
import { ReceiptPreview } from '@/components/shared/ReceiptPreview';
import { usePrintReceipt } from '@/hooks/usePrintReceipt';
import { usePrinterStore } from '@/stores/printerStore';
import { generateStandaloneReceiptText } from '@/lib/utils/receipt';
import { sumItemQuantity } from '@/lib/utils/itemCount';

export default function StandaloneHistoryPage() {
  const { transactions, getTodayTotal, voidTransaction } = useStandaloneTransactionStore();
  const { currency, businessName, taxRate, serviceChargeEnabled, serviceChargeRate } = useStandaloneConfigStore();
  const { appSettings } = useSettingsStore();
  const lang = appSettings.language;

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedTransaction, setSelectedTransaction] = useState<StandaloneTransaction | null>(null);
  const [voidConfirm, setVoidConfirm] = useState<string | null>(null);
  const [showReceiptPreview, setShowReceiptPreview] = useState(false);
  const { printStandaloneTransaction, renderStandalonePreview, isPrinting, isConnected: printerConnected } = usePrintReceipt();
  const storePaperWidth = usePrinterStore((s) => s.paperWidth);
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | undefined>();

  useEffect(() => {
    if (!selectedTransaction || !showReceiptPreview) {
      setReceiptImageUrl(undefined);
      return;
    }
    let cancelled = false;
    renderStandalonePreview(selectedTransaction, {
      businessName,
      currency,
      taxRate,
      serviceChargeEnabled,
      serviceChargeRate,
    }).then((url) => {
      if (!cancelled) setReceiptImageUrl(url || undefined);
    });
    return () => { cancelled = true; };
  }, [selectedTransaction, showReceiptPreview, businessName, currency, taxRate, serviceChargeEnabled, serviceChargeRate, renderStandalonePreview]);

  // Filter transactions by selected date
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txDate = new Date(tx.createdAt).toISOString().slice(0, 10);
      return txDate === selectedDate;
    });
  }, [transactions, selectedDate]);

  // Get unique dates from transactions
  const availableDates = useMemo(() => {
    const dates = new Set(transactions.map((tx) => new Date(tx.createdAt).toISOString().slice(0, 10)));
    return Array.from(dates).sort().reverse();
  }, [transactions]);

  // Calculate daily total (exclude voided)
  const dailyTotal = useMemo(() => {
    return filteredTransactions.filter((tx) => tx.status !== 'voided').reduce((sum, tx) => sum + tx.total, 0);
  }, [filteredTransactions]);

  const todayTotal = getTodayTotal();

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="w-4 h-4" />;
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      case 'qris':
        return <QrCode className="w-4 h-4" />;
      default:
        return <Wallet className="w-4 h-4" />;
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleVoid = (id: string) => {
    setVoidConfirm(id);
  };

  const handleVoidConfirm = () => {
    if (voidConfirm) {
      voidTransaction(voidConfirm);
      setVoidConfirm(null);
      setSelectedTransaction(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <StandaloneSubPageHeader title={t(lang, 'standalone.history')} />

      {/* Today's Summary */}
      <div className="p-4 bg-white border-b border-[#E8E2D9]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-[#8D8D9B]">{t(lang, 'standalone.todaySales')}</p>
            <p className="text-2xl font-bold text-[#E07A5F]">
              {formatCurrency(todayTotal, currency)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-[#8D8D9B]">{t(lang, 'standalone.transactions')}</p>
            <p className="text-xl font-semibold text-[#3D405B]">
              {transactions.filter((tx) => {
                const txDate = new Date(tx.createdAt).toISOString().slice(0, 10);
                const today = new Date().toISOString().slice(0, 10);
                return txDate === today;
              }).length}
            </p>
          </div>
        </div>
      </div>

      {/* Date selector */}
      <div className="p-4 border-b border-[#E8E2D9]">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {availableDates.length === 0 ? (
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[#E07A5F] text-white"
            >
              {formatDate(new Date().toISOString())}
            </button>
          ) : (
            availableDates.map((date) => {
              const isToday = date === new Date().toISOString().slice(0, 10);
              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedDate === date
                      ? 'bg-[#E07A5F] text-white'
                      : 'bg-white border border-[#E8E2D9] text-[#3D405B] hover:bg-[#F5F0E8]'
                  }`}
                >
                  {isToday ? t(lang, 'standalone.today') : formatDate(date)}
                </button>
              );
            })
          )}
        </div>
        {filteredTransactions.length > 0 && (
          <p className="text-sm text-[#8D8D9B] mt-2">
            {filteredTransactions.length} {t(lang, 'standalone.transactions')} - {formatCurrency(dailyTotal, currency)}
          </p>
        )}
      </div>

      {/* Transactions list */}
      <div className="flex-1 p-4">
        {filteredTransactions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-64 flex flex-col items-center justify-center text-center"
          >
            <Receipt className="w-16 h-16 text-[#E8E2D9] mb-4" />
            <h3 className="text-lg font-medium text-[#3D405B] mb-1">
              {t(lang, 'standalone.noTransactions')}
            </h3>
            <p className="text-sm text-[#8D8D9B]">
              {t(lang, 'standalone.noTransactionsHint')}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((tx) => (
              <motion.button
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedTransaction(tx)}
                className="w-full bg-white rounded-xl border border-[#E8E2D9] p-4 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  {/* Receipt icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.status === 'voided' ? 'bg-red-50' : 'bg-[#F5F0E8]'}`}>
                    {tx.status === 'voided' ? <XCircle className="w-5 h-5 text-red-400" /> : <Receipt className="w-5 h-5 text-[#8D8D9B]" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Top row: receipt number + total */}
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-medium text-[#3D405B] truncate text-sm">#{tx.receiptNumber}</h3>
                      <p className={`font-semibold shrink-0 ${tx.status === 'voided' ? 'text-red-400 line-through' : 'text-[#E07A5F]'}`}>
                        {formatCurrency(tx.total, currency)}
                      </p>
                    </div>

                    {/* Bottom row: payment + time + items + chevron */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-[#F5F0E8] rounded-full text-xs text-[#8D8D9B] shrink-0">
                        {getPaymentIcon(tx.paymentMethod)}
                        {tx.paymentMethod}
                      </span>
                      <div className="flex items-center gap-1.5 text-sm text-[#8D8D9B] min-w-0">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span className="truncate">{formatTime(tx.createdAt)}</span>
                        <span className="text-[#C9B8A8] shrink-0">|</span>
                        <span className="shrink-0">{sumItemQuantity(tx.items)} {t(lang, 'pos.items')}</span>
                      </div>
                      <div className="shrink-0 ml-auto">
                        {tx.status === 'voided' ? (
                          <span className="text-xs text-red-400">{t(lang, 'standalone.voided')}</span>
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#C9B8A8]" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      <Modal
        isOpen={!!selectedTransaction}
        onClose={() => { setSelectedTransaction(null); setShowReceiptPreview(false); }}
        title={t(lang, 'standalone.transactionDetail')}
        size="md"
      >
        {selectedTransaction && (
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center pb-4 border-b border-[#E8E2D9]">
              <p className="font-semibold text-[#3D405B]">{businessName}</p>
              <p className="text-sm text-[#8D8D9B]">#{selectedTransaction.receiptNumber}</p>
              <p className="text-sm text-[#8D8D9B]">
                {new Date(selectedTransaction.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Items */}
            <div className="space-y-2">
              {selectedTransaction.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <p className="text-[#3D405B]">{item.productName}</p>
                    <p className="text-[#8D8D9B]">
                      {item.quantity} x {formatCurrency(item.unitPrice, currency)}
                    </p>
                  </div>
                  <p className="text-[#3D405B] font-medium">
                    {formatCurrency(item.subtotal, currency)}
                  </p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="pt-4 border-t border-[#E8E2D9] space-y-2 text-sm">
              <div className="flex justify-between text-[#8D8D9B]">
                <span>{t(lang, 'pos.subtotal')}</span>
                <span>{formatCurrency(selectedTransaction.subtotal, currency)}</span>
              </div>
              {selectedTransaction.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t(lang, 'pos.discount')}</span>
                  <span>-{formatCurrency(selectedTransaction.discountAmount, currency)}</span>
                </div>
              )}
              {serviceChargeEnabled && selectedTransaction.serviceCharge > 0 && (
                <div className="flex justify-between text-[#8D8D9B]">
                  <span>{t(lang, 'pos.service')}</span>
                  <span>{formatCurrency(selectedTransaction.serviceCharge, currency)}</span>
                </div>
              )}
              {taxRate > 0 && (
                <div className="flex justify-between text-[#8D8D9B]">
                  <span>{t(lang, 'pos.tax')}</span>
                  <span>{formatCurrency(selectedTransaction.taxAmount, currency)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-lg text-[#3D405B] pt-2 border-t border-[#E8E2D9]">
                <span>{t(lang, 'pos.total')}</span>
                <span className="text-[#E07A5F]">{formatCurrency(selectedTransaction.total, currency)}</span>
              </div>
            </div>

            {/* Payment info */}
            <div className="p-4 bg-[#F5F0E8] rounded-xl space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#8D8D9B]">{t(lang, 'standalone.paymentMethod')}</span>
                <span className="text-[#3D405B] capitalize flex items-center gap-1">
                  {getPaymentIcon(selectedTransaction.paymentMethod)}
                  {selectedTransaction.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8D8D9B]">{t(lang, 'standalone.amountPaid')}</span>
                <span className="text-[#3D405B]">{formatCurrency(selectedTransaction.amountPaid, currency)}</span>
              </div>
              {selectedTransaction.changeAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#8D8D9B]">{t(lang, 'pos.change')}</span>
                  <span className="text-[#3D405B]">{formatCurrency(selectedTransaction.changeAmount, currency)}</span>
                </div>
              )}
            </div>

            {selectedTransaction.status === 'voided' && selectedTransaction.voidedAt && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                <XCircle className="w-4 h-4" />
                <span>{t(lang, 'standalone.voidedOn').replace('{date}', new Date(selectedTransaction.voidedAt).toLocaleString())}</span>
              </div>
            )}

            {selectedTransaction.status !== 'voided' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowReceiptPreview(true)}
                  className="flex-1 py-2 px-4 bg-[#3D405B] hover:bg-[#2D2F45] text-white font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  {t(lang, 'pos.printReceipt')}
                </button>
                <button
                  onClick={() => handleVoid(selectedTransaction.id)}
                  className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-sm"
                >
                  {t(lang, 'standalone.voidTransaction')}
                </button>
              </div>
            )}

            <Button variant="secondary" fullWidth onClick={() => { setSelectedTransaction(null); setShowReceiptPreview(false); }}>
              {t(lang, 'pos.close')}
            </Button>
          </div>
        )}
      </Modal>

      {/* Void Confirmation Modal */}
      <Modal
        isOpen={!!voidConfirm}
        onClose={() => setVoidConfirm(null)}
        title={t(lang, 'standalone.voidTransaction')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#3D405B]">
            {t(lang, 'standalone.voidConfirm')}
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setVoidConfirm(null)}
            >
              {t(lang, 'pos.cancel')}
            </Button>
            <button
              onClick={handleVoidConfirm}
              className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              {t(lang, 'standalone.voidTransaction')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Receipt Preview Modal */}
      {selectedTransaction && showReceiptPreview && (
        <ReceiptPreview
          receiptText={generateStandaloneReceiptText(selectedTransaction, {
            businessName,
            currency,
            taxRate,
            serviceChargeEnabled: serviceChargeEnabled,
            serviceChargeRate,
          })}
          receiptImageUrl={receiptImageUrl}
          paperWidth={storePaperWidth}
          isOpen={showReceiptPreview}
          onClose={() => setShowReceiptPreview(false)}
          onPrint={printerConnected ? () => printStandaloneTransaction(selectedTransaction, {
            businessName,
            currency,
            taxRate,
            serviceChargeEnabled,
            serviceChargeRate,
          }) : undefined}
          isPrinting={isPrinting}
          title={t(lang, 'pos.reprint')}
        />
      )}
    </div>
  );
}
