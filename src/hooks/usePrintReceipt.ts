import { useState, useCallback } from 'react';
import { usePrinterStore } from '@/stores/printerStore';
import { printer as printerCommands } from '@/lib/printer';
import { generateReceiptText, generateStandaloneReceiptText } from '@/lib/utils/receipt';
import { renderTransactionReceipt, renderStandaloneReceipt } from '@/lib/bitmapReceiptRenderer';
import type { Transaction, BusinessSettings } from '@/types';
import type { StandaloneTransaction } from '@/types/standalone';

interface StandaloneConfig {
  businessName: string;
  currency: string;
  taxRate: number;
  serviceChargeEnabled: boolean;
  serviceChargeRate: number;
}

export function usePrintReceipt() {
  const { isConnected, connectedPrinter, paperWidth: storePaperWidth } = usePrinterStore();
  const [isPrinting, setIsPrinting] = useState(false);

  const printReceiptText = useCallback(async (receiptText: string): Promise<boolean> => {
    if (!isConnected || !connectedPrinter) return false;

    setIsPrinting(true);
    try {
      await printerCommands.printRawText(receiptText);
      return true;
    } catch (error) {
      console.error('Failed to print receipt:', error);
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [isConnected, connectedPrinter]);

  const printTransaction = useCallback(async (
    transaction: Transaction,
    settings: BusinessSettings
  ): Promise<boolean> => {
    if (!isConnected || !connectedPrinter) return false;

    setIsPrinting(true);
    try {
      const result = await renderTransactionReceipt(transaction, settings, storePaperWidth);
      await printerCommands.printRasterImage(result.width, result.height, result.monoBitmap);
      return true;
    } catch (error) {
      console.error('Raster print failed, falling back to text:', error);
      try {
        const text = generateReceiptText(transaction, settings, storePaperWidth);
        await printerCommands.printRawText(text);
        return true;
      } catch (fallbackError) {
        console.error('Text print also failed:', fallbackError);
        return false;
      }
    } finally {
      setIsPrinting(false);
    }
  }, [isConnected, connectedPrinter, storePaperWidth]);

  const printStandaloneTransaction = useCallback(async (
    transaction: StandaloneTransaction,
    config: StandaloneConfig
  ): Promise<boolean> => {
    if (!isConnected || !connectedPrinter) return false;

    setIsPrinting(true);
    try {
      const result = await renderStandaloneReceipt(transaction, config, storePaperWidth);
      await printerCommands.printRasterImage(result.width, result.height, result.monoBitmap);
      return true;
    } catch (error) {
      console.error('Raster print failed, falling back to text:', error);
      try {
        const text = generateStandaloneReceiptText(transaction, config, storePaperWidth);
        await printerCommands.printRawText(text);
        return true;
      } catch (fallbackError) {
        console.error('Text print also failed:', fallbackError);
        return false;
      }
    } finally {
      setIsPrinting(false);
    }
  }, [isConnected, connectedPrinter, storePaperWidth]);

  const renderTransactionPreview = useCallback(async (
    transaction: Transaction,
    settings: BusinessSettings
  ): Promise<string | null> => {
    try {
      const result = await renderTransactionReceipt(transaction, settings, storePaperWidth);
      return result.dataUrl;
    } catch (error) {
      console.error('Failed to render transaction preview:', error);
      return null;
    }
  }, [storePaperWidth]);

  const renderStandalonePreview = useCallback(async (
    transaction: StandaloneTransaction,
    config: StandaloneConfig
  ): Promise<string | null> => {
    try {
      const result = await renderStandaloneReceipt(transaction, config, storePaperWidth);
      return result.dataUrl;
    } catch (error) {
      console.error('Failed to render standalone preview:', error);
      return null;
    }
  }, [storePaperWidth]);

  return {
    printTransaction,
    printStandaloneTransaction,
    printReceiptText,
    renderTransactionPreview,
    renderStandalonePreview,
    isPrinting,
    isConnected,
    connectedPrinter,
  };
}
