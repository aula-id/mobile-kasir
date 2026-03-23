import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { PrinterConfig, DiscoveredPrinter } from '@/types';
import { printer as printerCommands } from '@/lib/printer';

interface PrinterState {
  isConnected: boolean;
  isConnecting: boolean;
  connectedPrinter: PrinterConfig | null;
  paperWidth: 42 | 48 | 58 | 60 | 80;
  availablePrinters: DiscoveredPrinter[];
  isScanning: boolean;
  lastError: string | null;
}

interface PrinterActions {
  scanPrinters: () => Promise<void>;
  connect: (printer: DiscoveredPrinter, paperWidth: 42 | 48 | 58 | 60 | 80, autoConnect: boolean) => Promise<boolean>;
  disconnect: () => Promise<void>;
  testPrint: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  clearError: () => void;
  setConnectedPrinter: (config: PrinterConfig | null) => void;
  updateSettings: (paperWidth: 42 | 48 | 58 | 60 | 80, autoConnect: boolean) => void;
}

const initialState: PrinterState = {
  isConnected: false,
  isConnecting: false,
  connectedPrinter: null,
  paperWidth: 58,
  availablePrinters: [],
  isScanning: false,
  lastError: null,
};

export const usePrinterStore = create<PrinterState & PrinterActions>()(
  persist(
    immer((set) => ({
      ...initialState,

      scanPrinters: async () => {
        set((state) => {
          state.isScanning = true;
          state.lastError = null;
        });

        try {
          const printers = await printerCommands.discover();
          set((state) => {
            state.availablePrinters = printers;
            state.isScanning = false;
          });
        } catch (error) {
          set((state) => {
            state.isScanning = false;
            state.lastError = error instanceof Error ? error.message : 'Failed to scan printers';
          });
        }
      },

      connect: async (printer, paperWidth, autoConnect) => {
        set((state) => {
          state.isConnecting = true;
          state.lastError = null;
        });

        try {
          const config: PrinterConfig = {
            type: printer.type,
            address: printer.address,
            name: printer.name,
            paperWidth,
            autoConnect,
          };

          const success = await printerCommands.connect(config);

          if (success) {
            set((state) => {
              state.isConnected = true;
              state.isConnecting = false;
              state.connectedPrinter = config;
              state.paperWidth = config.paperWidth;
            });
            return true;
          } else {
            set((state) => {
              state.isConnecting = false;
              state.lastError = 'Failed to connect to printer';
            });
            return false;
          }
        } catch (error) {
          set((state) => {
            state.isConnecting = false;
            state.lastError = error instanceof Error ? error.message : 'Connection failed';
          });
          return false;
        }
      },

      disconnect: async () => {
        try {
          await printerCommands.disconnect();
          set((state) => {
            state.isConnected = false;
            state.connectedPrinter = null;
          });
        } catch (error) {
          set((state) => {
            state.lastError = error instanceof Error ? error.message : 'Failed to disconnect';
          });
        }
      },

      testPrint: async () => {
        try {
          await printerCommands.printTest();
          return true;
        } catch (error) {
          set((state) => {
            state.lastError = error instanceof Error ? error.message : 'Test print failed';
          });
          return false;
        }
      },

      refreshStatus: async () => {
        try {
          const status = await printerCommands.status();
          set((state) => {
            state.isConnected = status.connected;
            if (!status.connected) {
              state.connectedPrinter = null;
            }
          });
        } catch (error) {
          set((state) => {
            state.isConnected = false;
          });
        }
      },

      clearError: () => {
        set((state) => {
          state.lastError = null;
        });
      },

      setConnectedPrinter: (config) => {
        set((state) => {
          state.connectedPrinter = config;
          state.isConnected = config !== null;
        });
      },

      updateSettings: (paperWidth, autoConnect) => {
        set((state) => {
          state.paperWidth = paperWidth;
          if (state.connectedPrinter) {
            state.connectedPrinter.paperWidth = paperWidth;
            state.connectedPrinter.autoConnect = autoConnect;
          }
        });
      },
    })),
    {
      name: 'printer-storage',
      partialize: (state) => ({
        connectedPrinter: state.connectedPrinter,
        paperWidth: state.paperWidth,
      }),
    }
  )
);
