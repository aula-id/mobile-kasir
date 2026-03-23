import { useState, useCallback, useEffect } from 'react';
import { StandaloneHeader } from '@/components/standalone/StandaloneHeader';
import { StandaloneFnbCart } from '@/components/standalone/fnb/StandaloneFnbCart';
import { StandaloneOpenOrderCart } from '@/components/standalone/fnb/StandaloneOpenOrderCart';
import { StandaloneOpenTablesView } from '@/components/standalone/fnb/StandaloneOpenTablesView';
import { StandaloneProductCard } from '@/components/standalone/StandaloneProductCard';
import { OpenItemModal } from '@/components/shared/OpenItemModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useStandaloneCatalogStore } from '@/stores/standalone/standaloneCatalogStore';
import { useStandaloneCartStore } from '@/stores/standalone/standaloneCartStore';
import { useStandaloneOpenOrderStore } from '@/stores/standalone/standaloneOpenOrderStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';
import { Search, ShoppingCart, Users } from 'lucide-react';
import { clsx } from 'clsx';
import type { StandaloneProduct, StandaloneOpenItemData } from '@/types/standalone';

type SidebarView = 'cart' | 'tables' | 'table-detail';

export default function StandaloneFnbPosPage() {
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
  const { orders, setActiveOrder } = useStandaloneOpenOrderStore();
  const { appSettings } = useSettingsStore();
  const lang = appSettings.language;

  // Sidebar view state
  const [sidebarView, setSidebarView] = useState<SidebarView>('cart');
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  // Modal states
  const [showOpenItem, setShowOpenItem] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showMobileTables, setShowMobileTables] = useState(false);

  // Initialize default categories on mount if none exist
  useEffect(() => {
    initializeDefaultCategories();
  }, [initializeDefaultCategories]);

  const filteredProducts = getFilteredProducts();
  const activeCategories = categories.filter((c) => c.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  // Filter open orders
  const openOrders = orders.filter(o => o.status === 'open');
  const hasOpenTables = openOrders.length > 0;

  // Auto-switch to cart view when there are no open tables
  useEffect(() => {
    if (!hasOpenTables && sidebarView === 'tables') {
      setSidebarView('cart');
    }
  }, [hasOpenTables, sidebarView]);

  const handleProductSelect = useCallback((product: StandaloneProduct) => {
    addToCart(product);
  }, [addToCart]);

  const handleOpenItemAdd = useCallback((data: StandaloneOpenItemData) => {
    addOpenItemToCart(data);
    setShowOpenItem(false);
  }, [addOpenItemToCart]);

  // Handle table selection from tables view
  const handleSelectTable = (orderId: string) => {
    setActiveOrder(orderId);
    setSelectedTableId(orderId);
    setSidebarView('table-detail');
  };

  // Handle back from table detail
  const handleBackToTables = () => {
    setSidebarView('tables');
    setSelectedTableId(null);
  };

  // Handle table created/updated (from AddToTableModal in Cart)
  const handleTableCreated = (orderId: string) => {
    setActiveOrder(orderId);
    setSelectedTableId(orderId);
    setSidebarView('table-detail');
  };

  // Handle checkout or charge complete
  const handleCheckoutComplete = () => {
    setShowMobileCart(false);

    if (sidebarView === 'table-detail' && selectedTableId) {
      setSelectedTableId(null);

      const remainingOrders = orders.filter(o => o.status === 'open');
      if (remainingOrders.length > 0) {
        setSidebarView('tables');
      } else {
        setSidebarView('cart');
      }
    }
  };

  // Render sidebar content based on view
  const renderSidebarContent = () => {
    switch (sidebarView) {
      case 'tables':
        return <StandaloneOpenTablesView onSelectTable={handleSelectTable} />;
      case 'table-detail':
        if (selectedTableId) {
          return (
            <StandaloneOpenOrderCart
              orderId={selectedTableId}
              onBack={handleBackToTables}
              onChargeComplete={handleCheckoutComplete}
            />
          );
        }
        return null;
      case 'cart':
      default:
        return (
          <StandaloneFnbCart
            onCheckoutComplete={handleCheckoutComplete}
            onTableCreated={handleTableCreated}
          />
        );
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#FAF7F2]">
      {/* Header */}
      <StandaloneHeader />

      {/* Main content */}
      <main className="flex-1 overflow-hidden flex">
        {/* Left: Product area */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden lg:pb-4">
          {/* Search and actions */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8D8D9B]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(lang, 'pos.searchPlaceholder')}
                className="pl-10"
              />
            </div>
            <Button
              variant="secondary"
              onClick={() => setShowOpenItem(true)}
            >
              + {t(lang, 'pos.openItem')}
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

        {/* Right: Sidebar area (hidden on mobile) */}
        <div className="hidden lg:flex lg:flex-col w-96 border-l border-[#E8E2D9]">
          {/* Tab Header - only show if there are open tables */}
          {hasOpenTables && sidebarView !== 'table-detail' && (
            <div className="px-4 py-3 border-b border-[#E8E2D9]">
              <div className="flex gap-2">
                <button
                  onClick={() => setSidebarView('cart')}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                    sidebarView === 'cart'
                      ? 'bg-[#E07A5F] text-white'
                      : 'bg-[#F5F0E8] text-[#3D405B] hover:bg-[#E8E2D9]'
                  )}
                >
                  {t(lang, 'openOrders.orders')}
                  {cartItemCount > 0 && sidebarView !== 'cart' && (
                    <span className="bg-[#E07A5F] text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                      {cartItemCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setSidebarView('tables')}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                    sidebarView === 'tables'
                      ? 'bg-[#E07A5F] text-white'
                      : 'bg-[#F5F0E8] text-[#3D405B] hover:bg-[#E8E2D9]'
                  )}
                >
                  <Users className="w-4 h-4" />
                  {t(lang, 'openOrders.viewTables')} ({openOrders.length})
                </button>
              </div>
            </div>
          )}

          {/* Sidebar Content */}
          <div className="flex-1 overflow-hidden">
            {renderSidebarContent()}
          </div>
        </div>
      </main>

      {/* Bottom bar (mobile only) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E8E2D9] px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] z-40">
        {hasOpenTables ? (
          <div className="flex gap-2">
            <button
              onClick={() => setShowMobileCart(true)}
              className="flex-1 bg-[#E07A5F] hover:bg-[#C9654B] text-white rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-semibold">{t(lang, 'pos.viewCart')}</span>
              {cartItemCount > 0 && (
                <span className="bg-white text-[#E07A5F] text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                  {cartItemCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setSelectedTableId(null);
                setShowMobileTables(true);
              }}
              className="bg-[#F5F0E8] hover:bg-[#E8E2D9] text-[#3D405B] rounded-xl py-3.5 px-4 flex items-center gap-2 transition-colors"
            >
              <Users className="w-5 h-5" />
              <span className="font-semibold">{openOrders.length}</span>
            </button>
          </div>
        ) : (
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
        )}
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
              <StandaloneFnbCart
                onCheckoutComplete={() => {
                  handleCheckoutComplete();
                  setShowMobileCart(false);
                }}
                onTableCreated={(orderId) => {
                  setShowMobileCart(false);
                  handleTableCreated(orderId);
                  setShowMobileTables(true);
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* Mobile tables panel */}
      {showMobileTables && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMobileTables(false)}
          />
          <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#FAF7F2] rounded-t-2xl shadow-2xl z-50 max-h-[85vh] flex flex-col animate-slide-up">
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 bg-[#E8E2D9] rounded-full" />
            </div>
            <button
              onClick={() => setShowMobileTables(false)}
              className="absolute top-3 right-4 p-2 text-[#8D8D9B] hover:text-[#3D405B]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="h-[calc(85vh-48px)] overflow-hidden">
              {selectedTableId ? (
                <StandaloneOpenOrderCart
                  orderId={selectedTableId}
                  onBack={() => setSelectedTableId(null)}
                  onChargeComplete={() => {
                    handleCheckoutComplete();
                    setShowMobileTables(false);
                  }}
                />
              ) : (
                <StandaloneOpenTablesView onSelectTable={handleSelectTable} />
              )}
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
