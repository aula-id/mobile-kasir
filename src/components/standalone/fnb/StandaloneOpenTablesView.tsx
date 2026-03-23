import { useStandaloneOpenOrderStore } from '@/stores/standalone/standaloneOpenOrderStore';
import { useStandaloneConfigStore } from '@/stores/standalone/standaloneConfigStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';
import { formatCurrency } from '@/lib/utils/format';
import { Users, Clock, ChevronRight } from 'lucide-react';
import { getOrderItemCount } from '@/lib/utils/itemCount';

interface StandaloneOpenTablesViewProps {
  onSelectTable: (orderId: string) => void;
}

export function StandaloneOpenTablesView({ onSelectTable }: StandaloneOpenTablesViewProps) {
  const { appSettings } = useSettingsStore();
  const lang = appSettings.language;
  const { currency } = useStandaloneConfigStore();

  const { orders } = useStandaloneOpenOrderStore();
  const openOrders = orders.filter(o => o.status === 'open');

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (openOrders.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-[#8D8D9B] p-4">
        <Users className="w-16 h-16 mb-3" />
        <p className="text-lg font-medium">{t(lang, 'openOrders.noOpenTables')}</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#FAF7F2]">
      <div className="px-4 py-3 border-b border-[#E8E2D9]">
        <h2 className="font-semibold text-[#3D405B]">
          {t(lang, 'openOrders.viewTables')}
          <span className="ml-2 text-sm font-normal text-[#8D8D9B]">
            ({openOrders.length})
          </span>
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-2">
          {openOrders.map((order) => (
            <button
              key={order.id}
              onClick={() => onSelectTable(order.id)}
              className="w-full p-4 bg-white rounded-xl border border-[#E8E2D9] hover:border-[#E07A5F] hover:shadow-sm transition-all text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#3D405B]">
                      {order.tableNumber}
                    </span>
                    {order.customerName && (
                      <span className="px-2 py-0.5 bg-[#F5F0E8] rounded text-xs text-[#8D8D9B]">
                        {order.customerName}
                      </span>
                    )}
                    {order.unconfirmedItems.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[#E07A5F] animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-[#8D8D9B]">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{getOrderItemCount(order)} {t(lang, 'pos.items')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(order.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xl text-[#E07A5F]">
                    {formatCurrency(order.total, currency)}
                  </span>
                  <ChevronRight className="w-5 h-5 text-[#8D8D9B]" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
