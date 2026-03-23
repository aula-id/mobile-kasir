import { useState } from 'react';
import { useStandaloneOpenOrderStore } from '@/stores/standalone/standaloneOpenOrderStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';
import { Pencil, Check, X, User, MapPin } from 'lucide-react';

interface StandaloneOrderMetadataBarProps {
  orderId: string;
}

export function StandaloneOrderMetadataBar({ orderId }: StandaloneOrderMetadataBarProps) {
  const { orders, updateOrderMetadata } = useStandaloneOpenOrderStore();
  const { appSettings } = useSettingsStore();
  const lang = appSettings.language;

  const order = orders.find(o => o.id === orderId);

  const [isEditing, setIsEditing] = useState(false);
  const [editTable, setEditTable] = useState('');
  const [editName, setEditName] = useState('');

  if (!order) return null;

  const handleStartEdit = () => {
    setEditTable(order.tableNumber);
    setEditName(order.customerName || '');
    setIsEditing(true);
  };

  const handleSave = () => {
    const trimmedTable = editTable.trim();
    if (!trimmedTable) return; // Don't save if table number is empty

    updateOrderMetadata(orderId, {
      tableNumber: trimmedTable,
      customerName: editName.trim() || undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 py-2 bg-[#F5F0E8] rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <MapPin className="w-4 h-4 text-[#8D8D9B] shrink-0" />
          <input
            type="text"
            value={editTable}
            onChange={(e) => setEditTable(e.target.value)}
            className="w-full min-w-0 bg-white px-2 py-1 rounded text-sm border border-[#E8E2D9] focus:outline-none focus:border-[#E07A5F]"
            placeholder={t(lang, 'openOrders.tableNumberPlaceholder')}
            autoFocus
          />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <User className="w-4 h-4 text-[#8D8D9B] shrink-0" />
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            className="w-full min-w-0 bg-white px-2 py-1 rounded text-sm border border-[#E8E2D9] focus:outline-none focus:border-[#E07A5F]"
            placeholder={t(lang, 'openOrders.customerNamePlaceholder')}
          />
        </div>
        <button
          onClick={handleSave}
          className="p-1.5 rounded-full bg-[#81B29A] text-white hover:bg-[#6A9A83] transition-colors shrink-0"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1.5 rounded-full bg-[#8D8D9B] text-white hover:bg-[#7A7A88] transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#F5F0E8] rounded-lg">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#8D8D9B]" />
          <span className="text-sm font-medium text-[#3D405B]">
            {order.tableNumber}
          </span>
        </div>
        {order.customerName && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-[#8D8D9B]" />
            <span className="text-sm text-[#8D8D9B]">
              {order.customerName}
            </span>
          </div>
        )}
      </div>
      <button
        onClick={handleStartEdit}
        className="p-1.5 rounded-full text-[#8D8D9B] hover:text-[#E07A5F] hover:bg-white transition-colors"
      >
        <Pencil className="w-4 h-4" />
      </button>
    </div>
  );
}
