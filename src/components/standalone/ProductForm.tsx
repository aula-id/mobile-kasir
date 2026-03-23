import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProductImageCapture } from './ProductImageCapture';
import { useStandaloneCatalogStore } from '@/stores/standalone/standaloneCatalogStore';
import { useStandaloneConfigStore } from '@/stores/standalone/standaloneConfigStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';
import type { StandaloneProduct } from '@/types/standalone';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  editProduct?: StandaloneProduct;
}

export function ProductForm({ isOpen, onClose, editProduct }: ProductFormProps) {
  const { getCategories, addProduct, updateProduct } = useStandaloneCatalogStore();
  const categories = getCategories();
  const { mode } = useStandaloneConfigStore();
  const { appSettings } = useSettingsStore();
  const lang = appSettings.language;

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    price: '',
    costPrice: '',
    description: '',
    imageUrl: undefined as string | undefined,
    trackStock: true,
    stockQuantity: '0',
    lowStockThreshold: '5',
    isActive: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or editProduct changes
  useEffect(() => {
    if (isOpen) {
      if (editProduct) {
        setFormData({
          name: editProduct.name,
          sku: editProduct.sku,
          barcode: editProduct.barcode || '',
          categoryId: editProduct.categoryId,
          price: editProduct.price.toString(),
          costPrice: editProduct.costPrice?.toString() || '',
          description: editProduct.description || '',
          imageUrl: editProduct.imageUrl,
          trackStock: editProduct.trackStock,
          stockQuantity: editProduct.stockQuantity.toString(),
          lowStockThreshold: editProduct.lowStockThreshold.toString(),
          isActive: editProduct.isActive,
        });
      } else {
        setFormData({
          name: '',
          sku: '',
          barcode: '',
          categoryId: categories[0]?.id || '',
          price: '',
          costPrice: '',
          description: '',
          imageUrl: undefined,
          trackStock: true,
          stockQuantity: '0',
          lowStockThreshold: '5',
          isActive: true,
        });
      }
      setErrors({});
    }
  }, [isOpen, editProduct, categories]);

  const generateSku = () => {
    const prefix = mode === 'fnb' ? 'FNB' : 'SVC';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${random}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = t(lang, 'standalone.nameRequired');
    }
    if (!formData.price || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) < 0) {
      newErrors.price = t(lang, 'standalone.priceRequired');
    }
    if (!formData.categoryId) {
      newErrors.categoryId = t(lang, 'standalone.categoryRequired');
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const productData = {
      name: formData.name.trim(),
      sku: formData.sku || generateSku(),
      barcode: formData.barcode || undefined,
      categoryId: formData.categoryId,
      price: parseFloat(formData.price),
      costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
      description: formData.description || undefined,
      imageUrl: formData.imageUrl,
      trackStock: formData.trackStock,
      stockQuantity: formData.trackStock ? parseInt(formData.stockQuantity) || 0 : 0,
      lowStockThreshold: formData.trackStock ? parseInt(formData.lowStockThreshold) || 5 : 5,
      isActive: formData.isActive,
    };

    if (editProduct) {
      updateProduct(editProduct.id, productData);
    } else {
      addProduct(productData);
    }

    onClose();
  };

  const activeCategories = categories.filter((c) => c.isActive);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editProduct ? t(lang, 'standalone.editProduct') : t(lang, 'standalone.addProduct')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Image */}
        <div>
          <label className="block text-sm font-medium text-[#3D405B] mb-2">
            {t(lang, 'standalone.productImage')}
          </label>
          <ProductImageCapture
            value={formData.imageUrl}
            onChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url }))}
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-[#3D405B] mb-2">
            {t(lang, 'standalone.productName')} *
          </label>
          <Input
            value={formData.name}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, name: e.target.value }));
              setErrors((prev) => ({ ...prev, name: '' }));
            }}
            placeholder={t(lang, 'standalone.productNamePlaceholder')}
          />
          {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-[#3D405B] mb-2">
            {t(lang, 'standalone.price')} *
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.price}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, price: e.target.value }));
              setErrors((prev) => ({ ...prev, price: '' }));
            }}
            placeholder="0"
          />
          {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-[#3D405B] mb-2">
            {t(lang, 'standalone.category')} *
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, categoryId: e.target.value }));
              setErrors((prev) => ({ ...prev, categoryId: '' }));
            }}
            className="w-full px-4 py-3 rounded-xl border border-[#E8E2D9] bg-white text-[#3D405B] focus:outline-none focus:ring-2 focus:ring-[#E07A5F] focus:border-transparent"
          >
            <option value="">{t(lang, 'standalone.selectCategory')}</option>
            {activeCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="text-sm text-red-500 mt-1">{errors.categoryId}</p>}
        </div>

        {/* SKU and Barcode row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#3D405B] mb-2">
              {t(lang, 'standalone.sku')}
            </label>
            <Input
              value={formData.sku}
              onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
              placeholder={t(lang, 'standalone.skuPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#3D405B] mb-2">
              {t(lang, 'standalone.barcode')}
            </label>
            <Input
              value={formData.barcode}
              onChange={(e) => setFormData((prev) => ({ ...prev, barcode: e.target.value }))}
              placeholder={t(lang, 'standalone.barcodePlaceholder')}
            />
          </div>
        </div>

        {/* Cost Price */}
        <div>
          <label className="block text-sm font-medium text-[#3D405B] mb-2">
            {t(lang, 'standalone.costPrice')}
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={formData.costPrice}
            onChange={(e) => setFormData((prev) => ({ ...prev, costPrice: e.target.value }))}
            placeholder={t(lang, 'standalone.costPricePlaceholder')}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-[#3D405B] mb-2">
            {t(lang, 'standalone.description')}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder={t(lang, 'standalone.descriptionPlaceholder')}
            rows={2}
            className="w-full px-4 py-3 rounded-xl border border-[#E8E2D9] bg-white text-[#3D405B] focus:outline-none focus:ring-2 focus:ring-[#E07A5F] focus:border-transparent resize-none"
          />
        </div>

        {/* Stock tracking toggle */}
        <div className="bg-[#FAFAF8] rounded-xl border border-[#E8E2D9] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[#3D405B]">{t(lang, 'standalone.trackStock')}</p>
              <p className="text-sm text-[#8D8D9B]">{t(lang, 'standalone.trackStockDesc')}</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, trackStock: !prev.trackStock }))}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                formData.trackStock ? 'bg-[#E07A5F]' : 'bg-[#E8E2D9]'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  formData.trackStock ? 'right-1' : 'left-1'
                }`}
              />
            </button>
          </div>

          {formData.trackStock && (
            <div className="mt-4 pt-4 border-t border-[#E8E2D9] grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#3D405B] mb-2">
                  {t(lang, 'standalone.stockQuantity')}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, stockQuantity: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#3D405B] mb-2">
                  {t(lang, 'standalone.lowStockThreshold')}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lowStockThreshold: e.target.value }))}
                />
              </div>
            </div>
          )}
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between bg-[#FAFAF8] rounded-xl border border-[#E8E2D9] p-4">
          <div>
            <p className="font-medium text-[#3D405B]">{t(lang, 'standalone.active')}</p>
            <p className="text-sm text-[#8D8D9B]">{t(lang, 'standalone.activeDesc')}</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, isActive: !prev.isActive }))}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              formData.isActive ? 'bg-[#E07A5F]' : 'bg-[#E8E2D9]'
            }`}
          >
            <span
              className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                formData.isActive ? 'right-1' : 'left-1'
              }`}
            />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            {t(lang, 'pos.cancel')}
          </Button>
          <Button type="submit" fullWidth>
            {editProduct ? t(lang, 'standalone.save') : t(lang, 'standalone.addProduct')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
