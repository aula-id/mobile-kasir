import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { BusinessSettings, AppSettings } from '@/types';

interface SettingsState {
  businessSettings: BusinessSettings | null;
  appSettings: AppSettings;
}

interface SettingsActions {
  setBusinessSettings: (settings: BusinessSettings | null) => void;
  updateAppSettings: (updates: Partial<AppSettings>) => void;
  reset: () => void;
}

const defaultAppSettings: AppSettings = {
  apiBaseUrl: 'http://localhost:3000',
  syncIntervalMs: 60000,
  offlineMode: false,
  printerEnabled: false,
  soundEnabled: true,
  theme: 'light',
  language: 'id',
};

const initialState: SettingsState = {
  businessSettings: null,
  appSettings: defaultAppSettings,
};

export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    immer((set) => ({
      ...initialState,

      setBusinessSettings: (settings) => set((state) => {
        state.businessSettings = settings;
      }),

      updateAppSettings: (updates) => set((state) => {
        Object.assign(state.appSettings, updates);
      }),

      reset: () => set((state) => {
        state.businessSettings = null;
        state.appSettings = defaultAppSettings;
      }),
    })),
    {
      name: 'settings-storage',
    }
  )
);
