import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';
import { formatCurrency } from '@/lib/utils/format';
import type { OpenItemData } from '@/types';

interface OpenItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd?: (data: OpenItemData) => void;
}

export function OpenItemModal({ isOpen, onClose, onAdd }: OpenItemModalProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const { businessSettings, appSettings } = useSettingsStore();
  const currency = businessSettings?.currency || 'IDR';
  const lang = appSettings.language;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numericPrice = parseFloat(price);
    const numericQuantity = parseInt(quantity, 10);

    if (!name.trim()) {
      setError(t(lang, 'pos.enterName'));
      return;
    }

    if (isNaN(numericPrice) || numericPrice <= 0) {
      setError(t(lang, 'pos.enterValidPrice'));
      return;
    }

    if (isNaN(numericQuantity) || numericQuantity <= 0) {
      setError(t(lang, 'pos.enterValidQuantity'));
      return;
    }

    const openItem: OpenItemData = {
      name: name.trim(),
      price: numericPrice,
      quantity: numericQuantity,
      note: note.trim() || undefined,
    };

    if (onAdd) {
      onAdd(openItem);
    }
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setPrice('');
    setQuantity('1');
    setNote('');
    setError('');
    onClose();
  };

  const numericPrice = parseFloat(price) || 0;
  const numericQuantity = parseInt(quantity, 10) || 0;
  const subtotal = numericPrice * numericQuantity;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t(lang, 'pos.addOpenItem')} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t(lang, 'pos.itemName')}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t(lang, 'pos.itemNamePlaceholder')}
          autoComplete="off"
          autoFocus
        />

        <Input
          label={t(lang, 'pos.price')}
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0"
          min="0"
          step="100"
          autoComplete="off"
        />

        <Input
          label={t(lang, 'pos.quantity')}
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="1"
          min="1"
          autoComplete="off"
        />

        <Input
          label={t(lang, 'pos.noteOptional')}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t(lang, 'pos.addNotePlaceholder')}
          autoComplete="off"
        />

        {subtotal > 0 && (
          <div className="p-3 bg-slate-50 rounded-lg text-center">
            <p className="text-sm text-slate-500">{t(lang, 'pos.subtotal')}</p>
            <p className="text-xl font-bold text-slate-900">
              {formatCurrency(subtotal, currency)}
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}

        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            {t(lang, 'pos.cancel')}
          </Button>
          <Button type="submit" className="flex-1">
            {t(lang, 'pos.addToCart')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
