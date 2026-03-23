import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';
import { Printer } from 'lucide-react';
import { ReceiptTextView } from './ReceiptTextView';

interface ReceiptPreviewProps {
  receiptText: string;
  receiptImageUrl?: string;
  paperWidth?: number;
  isOpen: boolean;
  onClose: () => void;
  onPrint?: () => void;
  isPrinting?: boolean;
  title?: string;
}

export function ReceiptPreview({
  receiptText,
  paperWidth = 58,
  isOpen,
  onClose,
  onPrint,
  isPrinting,
  title,
}: ReceiptPreviewProps) {
  const { appSettings } = useSettingsStore();
  const lang = appSettings.language;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || t(lang, 'pos.receipt')} size="sm">
      <div className="space-y-4">
        <div className="text-center text-xs text-slate-400">
          {paperWidth}mm
        </div>

        <ReceiptTextView receiptText={receiptText} paperWidth={paperWidth} />

        <div className="flex gap-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            {t(lang, 'pos.close')}
          </Button>
          {onPrint && (
            <Button
              onClick={onPrint}
              disabled={isPrinting}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              {isPrinting ? t(lang, 'pos.printing') : t(lang, 'pos.printReceipt')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
