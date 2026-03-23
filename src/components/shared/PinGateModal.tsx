import { useState } from 'react';
import { X, Delete } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';

interface PinGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
  title?: string;
  externalError?: string;
}

export function PinGateModal({ isOpen, onClose, onSuccess, title, externalError }: PinGateModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { appSettings } = useSettingsStore();
  const lang = appSettings.language;
  const displayError = error || externalError || '';

  const handleNumberClick = (num: string) => {
    if (pin.length < 6) {
      setPin(pin + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  const handleSubmit = () => {
    if (pin.length < 4) {
      setError(t(lang, 'standalone.pinMinDigits'));
      return;
    }
    onSuccess(pin);
    setPin('');
  };

  const handleClose = () => {
    setPin('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl p-6 w-80 max-w-[90vw]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">
              {title || t(lang, 'stock.enterPin')}
            </h3>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* PIN Display */}
          <div className="flex justify-center gap-2 mb-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full ${
                  i < pin.length ? 'bg-blue-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>

          {displayError && (
            <p className="text-red-500 text-sm text-center mb-3">{displayError}</p>
          )}

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num)}
                className="h-14 text-xl font-medium rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="h-14 text-sm font-medium rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors text-slate-600"
            >
              {t(lang, 'auth.clear')}
            </button>
            <button
              onClick={() => handleNumberClick('0')}
              className="h-14 text-xl font-medium rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="h-14 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center"
            >
              <Delete className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={pin.length < 4}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-xl transition-colors"
          >
            {t(lang, 'pos.confirm')}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
