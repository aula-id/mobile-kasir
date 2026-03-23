import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Clock, Check } from 'lucide-react';
import type { StandaloneConfirmedBatch } from '@/types/standalone';
import { useStandaloneConfigStore } from '@/stores/standalone/standaloneConfigStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';
import { formatTime, formatCurrency } from '@/lib/utils/format';
import { CartItem } from '@/components/shared/CartItem';
import { sumItemQuantity, sumBatchItemQuantity } from '@/lib/utils/itemCount';

interface StandaloneConfirmedItemsSectionProps {
  batches: StandaloneConfirmedBatch[];
}

export function StandaloneConfirmedItemsSection({ batches }: StandaloneConfirmedItemsSectionProps) {
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(new Set());
  const { currency } = useStandaloneConfigStore();
  const { appSettings } = useSettingsStore();
  const lang = appSettings.language;

  if (batches.length === 0) return null;

  const toggleBatch = (batchId: string) => {
    setExpandedBatches(prev => {
      const next = new Set(prev);
      if (next.has(batchId)) {
        next.delete(batchId);
      } else {
        next.add(batchId);
      }
      return next;
    });
  };

  const getBatchTotal = (batch: StandaloneConfirmedBatch) => {
    return batch.items.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const getTotalItemCount = () => sumBatchItemQuantity(batches);

  return (
    <div className="border-b border-[#E8E2D9]">
      <div className="px-4 py-2 bg-[#F5F0E8] flex items-center gap-2">
        <Check className="w-4 h-4 text-[#81B29A]" />
        <span className="text-sm font-medium text-[#3D405B]">
          {t(lang, 'openOrders.confirmedItems')}
        </span>
        <span className="text-xs text-[#8D8D9B]">
          ({getTotalItemCount()} {getTotalItemCount() === 1 ? t(lang, 'pos.item') : t(lang, 'pos.items')})
        </span>
      </div>

      {batches.map((batch, index) => {
        const isExpanded = expandedBatches.has(batch.id);
        return (
          <div key={batch.id} className="border-b border-[#E8E2D9] last:border-b-0">
            <button
              onClick={() => toggleBatch(batch.id)}
              className="w-full px-4 py-2 flex items-center justify-between hover:bg-[#FAF7F2] transition-colors"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-[#8D8D9B]" />
                </motion.div>
                <div className="text-left">
                  <span className="text-sm font-medium text-[#3D405B]">
                    Batch {index + 1}
                  </span>
                  <span className="text-xs text-[#8D8D9B] ml-2">
                    ({sumItemQuantity(batch.items)} {sumItemQuantity(batch.items) === 1 ? t(lang, 'pos.item') : t(lang, 'pos.items')})
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-xs text-[#8D8D9B]">
                  <Clock className="w-3 h-3" />
                  {formatTime(new Date(batch.confirmedAt), {}, lang)}
                </div>
                <span className="text-lg font-medium text-[#3D405B]">
                  {formatCurrency(getBatchTotal(batch), currency)}
                </span>
              </div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden bg-[#FAF7F2]"
                >
                  <div className="py-1">
                    {batch.items.map((item) => (
                      <CartItem key={item.id} item={item} isLocked />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
