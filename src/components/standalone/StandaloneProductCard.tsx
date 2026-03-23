import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Package } from 'lucide-react';
import type { StandaloneProduct } from '@/types/standalone';
import { formatCurrency } from '@/lib/utils/format';
import { useStandaloneConfigStore } from '@/stores/standalone/standaloneConfigStore';
import { useStandaloneCatalogStore } from '@/stores/standalone/standaloneCatalogStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';

interface StandaloneProductCardProps {
  product: StandaloneProduct;
  onSelect: (product: StandaloneProduct) => void;
}

export function StandaloneProductCard({ product, onSelect }: StandaloneProductCardProps) {
  const { currency } = useStandaloneConfigStore();
  const { getCategories } = useStandaloneCatalogStore();
  const categories = getCategories();
  const { appSettings } = useSettingsStore();
  const lang = appSettings.language;

  const isOutOfStock = product.trackStock && product.stockQuantity <= 0;
  const isLowStock = product.trackStock && product.stockQuantity > 0 && product.stockQuantity <= product.lowStockThreshold;

  // Get category name for badge
  const category = categories.find((c) => c.id === product.categoryId);

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={clsx(
        'relative flex flex-col h-full bg-white rounded-2xl border transition-all overflow-hidden',
        'hover:shadow-lg hover:border-[#E07A5F]',
        'border-[#E8E2D9]',
        isOutOfStock && 'opacity-60'
      )}
    >
      {/* Image area with badges */}
      <div className="relative w-full aspect-square overflow-hidden bg-[#F5F0E8]">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-[#E8E2D9]" />
          </div>
        )}

        {/* Category badge (top-left) */}
        {category && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-[#3D405B]/80 text-white text-xs font-medium rounded-lg">
            {category.name}
          </div>
        )}

        {/* Out of stock warning (top-right) */}
        {isOutOfStock && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-medium bg-red-500 text-white">
            {t(lang, 'pos.outOfStock')}
          </div>
        )}

        {/* Stock count badge (bottom-right) - always visible when tracking */}
        {product.trackStock && (
          <div
            className={clsx(
              'absolute bottom-2 right-2 min-w-[36px] h-[36px] rounded-full flex items-center justify-center text-sm font-bold shadow-lg',
              isOutOfStock
                ? 'bg-red-500 text-white'
                : isLowStock
                ? 'bg-amber-500 text-white'
                : 'bg-white/95 text-[#3D405B] border-2 border-[#E8E2D9]'
            )}
          >
            {product.stockQuantity}
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="flex-1 flex flex-col p-3">
        <h3 className="font-medium text-[#3D405B] text-base line-clamp-2 mb-1">
          {product.name}
        </h3>
        <span className="text-[#E07A5F] font-bold text-lg">
          {formatCurrency(product.price, currency)}
        </span>
      </div>

      {/* ADD ITEM button */}
      <div className="px-3 pb-3 mt-auto">
        <button
          onClick={() => onSelect(product)}
          disabled={isOutOfStock}
          className={clsx(
            'w-full py-3 rounded-xl font-semibold text-base transition-colors',
            isOutOfStock
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-[#E07A5F] hover:bg-[#C9654B] text-white'
          )}
        >
          {isOutOfStock ? t(lang, 'pos.outOfStock') : t(lang, 'pos.addItem')}
        </button>
      </div>
    </motion.div>
  );
}
