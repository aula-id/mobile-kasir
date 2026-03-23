import { motion } from 'framer-motion';
import { useStandaloneCatalogStore } from '@/stores/standalone/standaloneCatalogStore';
import { Edit2, Trash2, Folder } from 'lucide-react';
import type { StandaloneCategory } from '@/types/standalone';

interface CategoryListItemProps {
  category: StandaloneCategory;
  onEdit: (category: StandaloneCategory) => void;
  onDelete: (category: StandaloneCategory) => void;
}

export function CategoryListItem({
  category,
  onEdit,
  onDelete,
}: CategoryListItemProps) {
  const { getCategoryProducts } = useStandaloneCatalogStore();
  const productCount = getCategoryProducts(category.id).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl border border-[#E8E2D9] p-4 flex items-center gap-4"
    >
      {/* Icon */}
      <div className="w-12 h-12 rounded-lg bg-[#F5F0E8] flex items-center justify-center shrink-0">
        <Folder className="w-5 h-5 text-[#8D8D9B]" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-[#3D405B] truncate">{category.name}</h3>
          {!category.isActive && (
            <span className="px-2 py-0.5 bg-[#E8E2D9] text-[#8D8D9B] text-xs rounded-full">
              Inactive
            </span>
          )}
        </div>
        <p className="text-sm text-[#8D8D9B]">
          {productCount} {productCount === 1 ? 'product' : 'products'}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEdit(category)}
          className="p-2 rounded-lg hover:bg-[#F5F0E8] text-[#8D8D9B] hover:text-[#3D405B] transition-colors"
        >
          <Edit2 className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDelete(category)}
          disabled={productCount > 0}
          className={`p-2 rounded-lg transition-colors ${
            productCount > 0
              ? 'text-[#E8E2D9] cursor-not-allowed'
              : 'hover:bg-red-50 text-[#8D8D9B] hover:text-red-500'
          }`}
          title={productCount > 0 ? 'Cannot delete category with products' : undefined}
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}
