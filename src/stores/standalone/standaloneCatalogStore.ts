import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { StandaloneProduct, StandaloneCategory, StandaloneMode } from '@/types/standalone';
import { DEFAULT_FNB_CATEGORIES, DEFAULT_RETAIL_CATEGORIES } from '@/types/standalone';
import { useStandaloneConfigStore } from './standaloneConfigStore';

interface ModeCatalog {
  products: StandaloneProduct[];
  categories: StandaloneCategory[];
}

interface StandaloneCatalogState {
  // Data stored per mode
  fnb: ModeCatalog;
  retail: ModeCatalog;

  // UI state (shared)
  selectedCategoryId: string | null;
  searchQuery: string;

  // Getters for current mode (functions)
  getProducts: () => StandaloneProduct[];
  getCategories: () => StandaloneCategory[];

  // Product actions
  addProduct: (product: Omit<StandaloneProduct, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<StandaloneProduct>) => void;
  deleteProduct: (id: string) => void;
  getProductById: (id: string) => StandaloneProduct | undefined;

  // Category actions
  addCategory: (category: Omit<StandaloneCategory, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<StandaloneCategory>) => void;
  deleteCategory: (id: string) => boolean;
  reorderCategories: (orderedIds: string[]) => void;
  initializeDefaultCategories: () => void;

  // UI actions
  setSelectedCategory: (id: string | null) => void;
  setSearchQuery: (query: string) => void;

  // Filtered products
  getFilteredProducts: () => StandaloneProduct[];
  getCategoryProducts: (categoryId: string) => StandaloneProduct[];

  // Reset
  reset: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

const emptyModeCatalog: ModeCatalog = {
  products: [],
  categories: [],
};

const initialState = {
  fnb: { ...emptyModeCatalog },
  retail: { ...emptyModeCatalog },
  selectedCategoryId: null as string | null,
  searchQuery: '',
};

// Helper to get current mode
const getCurrentMode = (): StandaloneMode => {
  return useStandaloneConfigStore.getState().mode;
};

export const useStandaloneCatalogStore = create<StandaloneCatalogState>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      // Getter functions for current mode's data
      getProducts: () => {
        const mode = getCurrentMode();
        return get()[mode].products;
      },

      getCategories: () => {
        const mode = getCurrentMode();
        return get()[mode].categories;
      },

      // Product actions
      addProduct: (product) => set((state) => {
        const mode = getCurrentMode();
        const now = new Date().toISOString();
        const newProduct: StandaloneProduct = {
          ...product,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        state[mode].products.push(newProduct);
      }),

      updateProduct: (id, updates) => set((state) => {
        const mode = getCurrentMode();
        const index = state[mode].products.findIndex((p) => p.id === id);
        if (index !== -1) {
          state[mode].products[index] = {
            ...state[mode].products[index],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
      }),

      deleteProduct: (id) => set((state) => {
        const mode = getCurrentMode();
        state[mode].products = state[mode].products.filter((p) => p.id !== id);
      }),

      getProductById: (id) => {
        const mode = getCurrentMode();
        return get()[mode].products.find((p) => p.id === id);
      },

      // Category actions
      addCategory: (category) => set((state) => {
        const mode = getCurrentMode();
        const newCategory: StandaloneCategory = {
          ...category,
          id: generateId(),
        };
        state[mode].categories.push(newCategory);
      }),

      updateCategory: (id, updates) => set((state) => {
        const mode = getCurrentMode();
        const index = state[mode].categories.findIndex((c) => c.id === id);
        if (index !== -1) {
          state[mode].categories[index] = {
            ...state[mode].categories[index],
            ...updates,
          };
        }
      }),

      deleteCategory: (id) => {
        const mode = getCurrentMode();
        const catalog = get()[mode];
        const hasProducts = catalog.products.some((p) => p.categoryId === id);
        if (hasProducts) {
          return false;
        }
        set((state) => {
          state[mode].categories = state[mode].categories.filter((c) => c.id !== id);
        });
        return true;
      },

      reorderCategories: (orderedIds) => set((state) => {
        const mode = getCurrentMode();
        orderedIds.forEach((id, index) => {
          const category = state[mode].categories.find((c) => c.id === id);
          if (category) {
            category.sortOrder = index + 1;
          }
        });
        state[mode].categories.sort((a, b) => a.sortOrder - b.sortOrder);
      }),

      initializeDefaultCategories: () => set((state) => {
        const mode = getCurrentMode();
        if (state[mode].categories.length > 0) return; // Already initialized

        const defaults = mode === 'fnb' ? DEFAULT_FNB_CATEGORIES : DEFAULT_RETAIL_CATEGORIES;

        state[mode].categories = defaults.map((cat) => ({
          ...cat,
          id: generateId(),
        }));
      }),

      // UI actions
      setSelectedCategory: (id) => set((state) => {
        state.selectedCategoryId = id;
      }),

      setSearchQuery: (query) => set((state) => {
        state.searchQuery = query;
      }),

      // Filtered products
      getFilteredProducts: () => {
        const mode = getCurrentMode();
        const state = get();
        const catalog = state[mode];
        const { selectedCategoryId, searchQuery } = state;
        let filtered = catalog.products.filter((p) => p.isActive);

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

        return filtered;
      },

      getCategoryProducts: (categoryId) => {
        const mode = getCurrentMode();
        return get()[mode].products.filter((p) => p.categoryId === categoryId);
      },

      reset: () => set(initialState),
    })),
    {
      name: 'standalone-catalog',
    }
  )
);
