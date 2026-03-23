import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useStandaloneOpenOrderStore } from '@/stores/standalone/standaloneOpenOrderStore';
import { useStandaloneCartStore } from '@/stores/standalone/standaloneCartStore';
import { useStandaloneConfigStore } from '@/stores/standalone/standaloneConfigStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';
import { formatCurrency } from '@/lib/utils/format';
import { Users, Plus, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { getOrderItemCount } from '@/lib/utils/itemCount';

interface StandaloneAddToTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export function StandaloneAddToTableModal({ isOpen, onClose, onSuccess }: StandaloneAddToTableModalProps) {
  const { appSettings } = useSettingsStore();
  const lang = appSettings.language;
  const { currency } = useStandaloneConfigStore();

  const { orders, createOrder, addItemsToOrder, setActiveOrder } = useStandaloneOpenOrderStore();
  const { items: cartItems, clearCart } = useStandaloneCartStore();

  const openOrders = orders.filter(o => o.status === 'open');

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(openOrders.length === 0);
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [error, setError] = useState('');

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowCreateForm(false);
  };

  const handleAddToExisting = () => {
    if (!selectedOrderId) return;

    addItemsToOrder(selectedOrderId, cartItems);
    clearCart();
    onSuccess(selectedOrderId);
    resetAndClose();
  };

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedTable = tableNumber.trim();
    if (!trimmedTable) {
      setError(t(lang, 'openOrders.tableNumberRequired'));
      return;
    }

    const orderId = createOrder(
      trimmedTable,
      customerName.trim() || undefined,
    );

    if (!orderId) {
      setError(t(lang, 'openOrders.tableNumberExists'));
      return;
    }

    addItemsToOrder(orderId, cartItems);
    setActiveOrder(orderId);
    clearCart();
    onSuccess(orderId);
    resetAndClose();
  };

  const resetAndClose = () => {
    setSelectedOrderId(null);
    setShowCreateForm(openOrders.length === 0);
    setTableNumber('');
    setCustomerName('');
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title={showCreateForm ? t(lang, 'openOrders.createOrder') : t(lang, 'openOrders.addToTable')}
      size="sm"
    >
      {!showCreateForm && openOrders.length > 0 ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-[#8D8D9B] mb-2">{t(lang, 'openOrders.selectTable')}:</p>
            {openOrders.map((order) => (
              <button
                key={order.id}
                onClick={() => handleSelectOrder(order.id)}
                className={clsx(
                  'w-full p-3 rounded-lg border-2 text-left transition-colors',
                  selectedOrderId === order.id
                    ? 'border-[#E07A5F] bg-[#FFF0EB]'
                    : 'border-[#E8E2D9] hover:border-[#D4CFC5]'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={clsx(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      selectedOrderId === order.id
                        ? 'border-[#E07A5F] bg-[#E07A5F]'
                        : 'border-[#D4CFC5]'
                    )}>
                      {selectedOrderId === order.id && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div>
                      <span className="font-medium text-[#3D405B]">{order.tableNumber}</span>
                      {order.customerName && (
                        <span className="text-sm text-[#8D8D9B] ml-2">
                          - {order.customerName}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="font-semibold text-[#E07A5F]">
                    {formatCurrency(order.total, currency)}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1 ml-7 text-xs text-[#8D8D9B]">
                  <Users className="w-3 h-3" />
                  <span>{getOrderItemCount(order)} {t(lang, 'pos.items')}</span>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full p-3 rounded-lg border-2 border-dashed border-[#E8E2D9] text-[#8D8D9B] hover:border-[#E07A5F] hover:text-[#E07A5F] transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t(lang, 'openOrders.newTable')}
          </button>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={resetAndClose}
              fullWidth
            >
              {t(lang, 'pos.cancel')}
            </Button>
            <Button
              onClick={handleAddToExisting}
              disabled={!selectedOrderId}
              fullWidth
            >
              {t(lang, 'openOrders.addToTable')}
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCreateNew} className="space-y-4">
          <Input
            label={t(lang, 'openOrders.tableNumber')}
            placeholder={t(lang, 'openOrders.tableNumberPlaceholder')}
            value={tableNumber}
            onChange={(e) => {
              setTableNumber(e.target.value);
              if (error) setError('');
            }}
            error={error}
            autoFocus
          />

          <Input
            label={t(lang, 'openOrders.customerName')}
            placeholder={t(lang, 'openOrders.customerNamePlaceholder')}
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                if (openOrders.length > 0) {
                  setShowCreateForm(false);
                  setError('');
                } else {
                  resetAndClose();
                }
              }}
              fullWidth
            >
              {openOrders.length > 0 ? t(lang, 'openOrders.back') : t(lang, 'pos.cancel')}
            </Button>
            <Button type="submit" fullWidth>
              {t(lang, 'openOrders.createOrder')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
