import { motion } from 'framer-motion';
import { formatCurrency } from '@/lib/utils/format';
import { useStandaloneConfigStore } from '@/stores/standalone/standaloneConfigStore';
import { useStandaloneCatalogStore } from '@/stores/standalone/standaloneCatalogStore';
import { Edit2, Trash2, Package } from 'lucide-react';
import type { StandaloneProduct } from '@/types/standalone';

interface ProductListItemProps {
  product: StandaloneProduct;
  onEdit: (product: StandaloneProduct) => void;
  onDelete: (product: StandaloneProduct) => void;
}

export function ProductListItem({ product, onEdit, onDelete }: ProductListItemProps) {
  const { currency } = useStandaloneConfigStore();
  const { getCategories } = useStandaloneCatalogStore();
  const categories = getCategories();

  const category = categories.find((c) => c.id === product.categoryId);
  const isLowStock = product.trackStock && product.stockQuantity <= product.lowStockThreshold;
  const isOutOfStock = product.trackStock && product.stockQuantity === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-[#E8E2D9] p-4 flex items-center gap-4"
    >
      {/* Image */}
      <div className="w-16 h-16 rounded-lg bg-[#F5F0E8] flex items-center justify-center overflow-hidden shrink-0">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="w-6 h-6 text-[#8D8D9B]" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-[#3D405B] truncate">{product.name}</h3>
          {!product.isActive && (
            <span className="px-2 py-0.5 bg-[#E8E2D9] text-[#8D8D9B] text-xs rounded-full">
              Inactive
            </span>
          )}
        </div>
        <p className="text-sm text-[#8D8D9B] truncate">
          {category?.name || 'Uncategorized'} {product.sku && `- ${product.sku}`}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className="font-semibold text-[#E07A5F]">
            {formatCurrency(product.price, currency)}
          </span>
          {product.trackStock && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                isOutOfStock
                  ? 'bg-red-100 text-red-600'
                  : isLowStock
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-green-100 text-green-600'
              }`}
            >
              {isOutOfStock ? 'Out of stock' : `Stock: ${product.stockQuantity}`}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(product)}
          className="p-2 rounded-lg hover:bg-[#F5F0E8] text-[#8D8D9B] hover:text-[#3D405B] transition-colors"
        >
          <Edit2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDelete(product)}
          className="p-2 rounded-lg hover:bg-red-50 text-[#8D8D9B] hover:text-red-500 transition-colors"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}
