import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import type { CartItem as CartItemType } from '@/types';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';
import { formatCurrency } from '@/lib/utils/format';

interface CartItemProps {
  item: CartItemType;
  isLocked?: boolean;
  onUpdateQuantity?: (itemId: string, quantity: number) => void;
  onUpdateNote?: (itemId: string, note: string) => void;
  onRemove?: (itemId: string) => void;
}

export function CartItem({
  item,
  isLocked = false,
  onUpdateQuantity,
  onUpdateNote,
  onRemove,
}: CartItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { businessSettings, appSettings } = useSettingsStore();
  const currency = businessSettings?.currency || 'IDR';
  const lang = appSettings.language;

  const handleUpdateQuantity = (id: string, qty: number) => {
    onUpdateQuantity?.(id, qty);
  };

  const handleUpdateNote = (id: string, note: string) => {
    onUpdateNote?.(id, note);
  };

  const handleRemove = (id: string) => {
    onRemove?.(id);
  };

  const handleExpand = () => {
    if (!isLocked) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <motion.div
      layout
      className={`relative p-3 rounded-xl shadow-sm border border-[#E8E2D9] mx-2 my-2 ${
        isLocked ? 'bg-[#F8F6F3]' : 'bg-white'
      }`}
    >
      {/* Lock indicator for confirmed items */}
      {isLocked && (
        <div className="absolute top-2 right-2 z-10">
          <Lock className="w-3 h-3 text-[#8D8D9B]" />
        </div>
      )}

      <div className="flex gap-3">
        {/* Product thumbnail */}
        <div className="w-14 h-14 rounded-lg bg-[#F5F0E8] flex-shrink-0 overflow-hidden">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.productName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-6 h-6 text-[#E8E2D9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Item details */}
        <div className="flex-1 min-w-0">
          <button
            onClick={handleExpand}
            className={`w-full text-left ${isLocked ? 'cursor-default' : ''}`}
            disabled={isLocked}
          >
            <h4 className="font-medium text-[#3D405B] truncate">{item.productName}</h4>
            <span className="text-[#E07A5F] font-semibold text-lg">
              {formatCurrency(item.unitPrice, currency)}
            </span>
            {item.note && (
              <p className="text-xs text-[#8D8D9B] truncate mt-1">{t(lang, 'pos.note')}: {item.note}</p>
            )}
          </button>

          {/* Horizontal quantity controls */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => !isLocked && handleUpdateQuantity(item.id, item.quantity - 1)}
              disabled={isLocked}
              className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold transition-colors ${
                isLocked
                  ? 'bg-[#F5F0E8] text-[#3D405B] opacity-60 cursor-not-allowed'
                  : 'bg-[#F5F0E8] hover:bg-[#E8E2D9] text-[#3D405B]'
              }`}
            >
              -
            </button>
            <span className="w-8 text-center text-sm font-semibold text-[#3D405B]">
              {item.quantity}
            </span>
            <button
              onClick={() => !isLocked && handleUpdateQuantity(item.id, item.quantity + 1)}
              disabled={isLocked}
              className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold transition-colors ${
                isLocked
                  ? 'bg-[#F5F0E8] text-[#3D405B] opacity-60 cursor-not-allowed'
                  : 'bg-[#F5F0E8] hover:bg-[#E8E2D9] text-[#3D405B]'
              }`}
            >
              +
            </button>
          </div>
        </div>

        {/* Subtotal and remove */}
        <div className="flex flex-col items-end justify-between">
          <span className="font-bold text-lg text-[#3D405B]">
            {formatCurrency(item.subtotal, currency)}
          </span>
          {!isLocked && (
            <button
              onClick={() => handleRemove(item.id)}
              className="p-1.5 text-[#8D8D9B] hover:text-[#E07A5F] transition-colors rounded-lg hover:bg-[#FFF0EB]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Expanded actions - only show when not locked */}
      {isExpanded && !isLocked && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 pt-3 border-t border-[#E8E2D9]"
        >
          <input
            type="text"
            placeholder={t(lang, 'pos.addNote')}
            value={item.note || ''}
            onChange={(e) => handleUpdateNote(item.id, e.target.value)}
            className="w-full px-3 py-2 text-sm border border-[#E8E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E07A5F] bg-white text-[#3D405B] placeholder-[#8D8D9B]"
          />
        </motion.div>
      )}
    </motion.div>
  );
}
