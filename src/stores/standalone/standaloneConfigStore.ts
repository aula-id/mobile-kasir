import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { StandaloneConfig, StandaloneMode } from '@/types/standalone';

interface StandaloneConfigState extends StandaloneConfig {
  // Actions
  setMode: (mode: StandaloneMode) => void;
  setBusinessName: (name: string) => void;
  setCurrency: (currency: string) => void;
  setTaxRate: (rate: number) => void;
  setServiceChargeEnabled: (enabled: boolean) => void;
  setServiceChargeRate: (rate: number) => void;
  setExitedAndKeepData: (value: boolean) => void;
  completeSetup: () => void;
  reset: () => void;
  isSetupComplete: () => boolean;
}

const initialState: StandaloneConfig = {
  mode: 'fnb',
  businessName: '',
  currency: 'IDR',
  taxRate: 10,
  serviceChargeEnabled: false,
  serviceChargeRate: 5,
  setupCompletedAt: null,
  isExitedAndKeepData: false,
};

export const useStandaloneConfigStore = create<StandaloneConfigState>()(
  persist(
    immer((set, get) => ({
      ...initialState,

      setMode: (mode) => set((state) => {
        state.mode = mode;
      }),

      setBusinessName: (name) => set((state) => {
        state.businessName = name;
      }),

      setCurrency: (currency) => set((state) => {
        state.currency = currency;
      }),

      setTaxRate: (rate) => set((state) => {
        state.taxRate = rate;
      }),

      setServiceChargeEnabled: (enabled) => set((state) => {
        state.serviceChargeEnabled = enabled;
      }),

      setServiceChargeRate: (rate) => set((state) => {
        state.serviceChargeRate = rate;
      }),

      completeSetup: () => set((state) => {
        state.setupCompletedAt = new Date().toISOString();
      }),

      setExitedAndKeepData: (value) => set((state) => {
        state.isExitedAndKeepData = value;
      }),

      reset: () => set(initialState),

      isSetupComplete: () => {
        return get().setupCompletedAt !== null;
      },
    })),
    {
      name: 'standalone-config',
    }
  )
);
