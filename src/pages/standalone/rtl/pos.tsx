import { useState, useCallback, useEffect } from 'react';
import { StandaloneHeader } from '@/components/standalone/StandaloneHeader';
import { StandaloneCart } from '@/components/standalone/StandaloneCart';
import { StandaloneProductCard } from '@/components/standalone/StandaloneProductCard';
import { OpenItemModal } from '@/components/shared/OpenItemModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useStandaloneCatalogStore } from '@/stores/standalone/standaloneCatalogStore';
import { useStandaloneCartStore } from '@/stores/standalone/standaloneCartStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';
import { Search, ShoppingCart } from 'lucide-react';
import type { StandaloneProduct, StandaloneOpenItemData } from '@/types/standalone';

export default function StandaloneRtlPosPage() {
  const {
    getProducts,
    getCategories,
    selectedCategoryId,
    searchQuery,
    setSelectedCategory,
    setSearchQuery,
    getFilteredProducts,
    initializeDefaultCategories,
  } = useStandaloneCatalogStore();

  const products = getProducts();
  const categories = getCategories();
  const { addProduct: addToCart, addOpenItem: addOpenItemToCart, items: cartItems } = useStandaloneCartStore();
  const { appSettings } = useSettingsStore();
  const lang = appSettings.language;

  const [showOpenItem, setShowOpenItem] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Initialize default categories on mount if none exist
  useEffect(() => {
    initializeDefaultCategories();
  }, [initializeDefaultCategories]);

  const filteredProducts = getFilteredProducts();
  const activeCategories = categories.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleProductSelect = useCallback((product: StandaloneProduct) => {
    addToCart(product);
  }, [addToCart]);

  const handleOpenItemAdd = useCallback((data: StandaloneOpenItemData) => {
    addOpenItemToCart(data);
    setShowOpenItem(false);
  }, [addOpenItemToCart]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#FAF7F2]">
      {/* Header */}
      <StandaloneHeader />

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex">
        {/* Left: Service/Product area */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden lg:pb-4">
          {/* Search and actions */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8D8D9B]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(lang, 'standalone.searchProducts')}
                className="pl-10"
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowOpenItem(true)}
            >
              + {t(lang, 'standalone.customItem')}
            </Button>
          </div>

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategoryId === null
                  ? 'bg-[#E07A5F] text-white'
                  : 'bg-white border border-[#E8E2D9] text-[#3D405B] hover:bg-[#F5F0E8]'
              }`}
            >
              {t(lang, 'pos.all')}
            </button>
            {activeCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategoryId === cat.id
                    ? 'bg-[#E07A5F] text-white'
                    : 'bg-white border border-[#E8E2D9] text-[#3D405B] hover:bg-[#F5F0E8]'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products grid */}
          <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
            {filteredProducts.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <svg className="w-16 h-16 text-[#E8E2D9] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="text-lg font-medium text-[#3D405B] mb-1">
                  {products.length === 0 ? t(lang, 'standalone.noProducts') : t(lang, 'standalone.noProductsFound')}
                </h3>
                <p className="text-sm text-[#8D8D9B]">
                  {products.length === 0 ? t(lang, 'standalone.noProductsHint') : t(lang, 'standalone.tryDifferentSearch')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-1">
                {filteredProducts.map((product) => (
                  <StandaloneProductCard
                    key={product.id}
                    product={product}
                    onSelect={handleProductSelect}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Cart (hidden on mobile) */}
        <div className="hidden lg:flex lg:flex-col w-96 border-l border-[#E8E2D9]">
          <StandaloneCart />
        </div>
      </main>

      {/* Bottom bar (mobile only) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E2D9] px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-40">
        <button
          onClick={() => setShowMobileCart(true)}
          className="w-full bg-[#E07A5F] hover:bg-[#C9654B] text-white rounded-xl py-3.5 px-4 flex items-center justify-between transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-[#E07A5F] text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </div>
            <span className="font-semibold">{t(lang, 'pos.viewCart')}</span>
          </div>
          <span className="font-bold">{cartItemCount} {t(lang, 'pos.items')}</span>
        </button>
      </div>

      {/* Mobile cart panel */}
      {showMobileCart && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMobileCart(false)}
          />
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#FAF7F2] rounded-t-2xl shadow-2xl z-50 max-h-[85vh] flex flex-col animate-slide-up">
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 bg-[#E8E2D9] rounded-full" />
            </div>
            <button
              onClick={() => setShowMobileCart(false)}
              className="absolute top-3 right-4 p-2 text-[#8D8D9B] hover:text-[#3D405B]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="h-[calc(85vh-48px)] overflow-hidden">
              <StandaloneCart onCheckoutComplete={() => setShowMobileCart(false)} />
            </div>
          </div>
        </>
      )}

      {/* Open Item Modal */}
      <OpenItemModal
        isOpen={showOpenItem}
        onClose={() => setShowOpenItem(false)}
        onAdd={handleOpenItemAdd}
      />
    </div>
  );
}
