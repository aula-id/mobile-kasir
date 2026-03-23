import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ProductListItem } from '@/components/standalone/ProductListItem';
import { ProductForm } from '@/components/standalone/ProductForm';
import { useStandaloneCatalogStore } from '@/stores/standalone/standaloneCatalogStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';
import { Plus, Search, Package } from 'lucide-react';
import { StandaloneSubPageHeader } from '@/components/standalone/StandaloneSubPageHeader';
import type { StandaloneProduct } from '@/types/standalone';

export default function StandaloneProductsPage() {
  const { getProducts, getCategories, deleteProduct } = useStandaloneCatalogStore();
  const products = getProducts();
  const categories = getCategories();
  const { appSettings } = useSettingsStore();
  const lang = appSettings.language;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<StandaloneProduct | undefined>();
  const [deleteConfirm, setDeleteConfirm] = useState<StandaloneProduct | null>(null);

  // Filtered products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (selectedCategoryId) {
      filtered = filtered.filter((p) => p.categoryId === selectedCategoryId);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          (p.barcode && p.barcode.toLowerCase().includes(query))
      );
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [products, selectedCategoryId, searchQuery]);

  const handleEdit = (product: StandaloneProduct) => {
    setEditProduct(product);
    setShowForm(true);
  };

  const handleDelete = (product: StandaloneProduct) => {
    setDeleteConfirm(product);
  };

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteProduct(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditProduct(undefined);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col">
      <StandaloneSubPageHeader
        title={t(lang, 'standalone.products')}
        rightAction={
          <button
            onClick={() => setShowForm(true)}
            className="p-2 bg-[#E07A5F] hover:bg-[#C86A50] text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        }
      />

      {/* Search and Filter */}
      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8D8D9B]" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(lang, 'standalone.searchProducts')}
            className="pl-10"
          />
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategoryId === null
                ? 'bg-[#E07A5F] text-white'
                : 'bg-white border border-[#E8E2D9] text-[#3D405B] hover:bg-[#F5F0E8]'
            }`}
          >
            {t(lang, 'pos.all')} ({products.length})
          </button>
          {categories
            .filter((c) => c.isActive)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((cat) => {
              const count = products.filter((p) => p.categoryId === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategoryId === cat.id
                      ? 'bg-[#E07A5F] text-white'
                      : 'bg-white border border-[#E8E2D9] text-[#3D405B] hover:bg-[#F5F0E8]'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
        </div>
      </div>

      {/* Product list */}
      <div className="flex-1 p-4 pt-0">
        {filteredProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-64 flex flex-col items-center justify-center text-center"
          >
            <Package className="w-16 h-16 text-[#E8E2D9] mb-4" />
            <h3 className="text-lg font-medium text-[#3D405B] mb-1">
              {t(lang, 'standalone.noProducts')}
            </h3>
            <p className="text-sm text-[#8D8D9B] mb-4">
              {t(lang, 'standalone.noProductsHint')}
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              {t(lang, 'standalone.addProduct')}
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <ProductListItem
                key={product.id}
                product={product}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product form modal */}
      <ProductForm
        isOpen={showForm}
        onClose={handleFormClose}
        editProduct={editProduct}
      />

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t(lang, 'standalone.deleteProduct')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-[#8D8D9B]">
            {t(lang, 'standalone.deleteProductConfirm', { name: deleteConfirm?.name || '' })}
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setDeleteConfirm(null)}>
              {t(lang, 'pos.cancel')}
            </Button>
            <Button
              fullWidth
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              {t(lang, 'standalone.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
