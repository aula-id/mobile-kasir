import { motion } from 'framer-motion';
import { ChefHat } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';
import { clsx } from 'clsx';

interface StandaloneConfirmItemsButtonProps {
  itemCount: number;
  onConfirm: () => void;
  disabled?: boolean;
}

export function StandaloneConfirmItemsButton({ itemCount, onConfirm, disabled }: StandaloneConfirmItemsButtonProps) {
  const { appSettings } = useSettingsStore();
  const lang = appSettings.language;

  if (itemCount === 0) return null;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onConfirm}
      disabled={disabled}
      className={clsx(
        'w-full py-3 px-4 rounded-xl font-semibold text-white transition-colors',
        'flex items-center justify-center gap-2',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81B29A]',
        disabled
          ? 'bg-[#8D8D9B] cursor-not-allowed'
          : 'bg-[#81B29A] hover:bg-[#6A9A83] active:bg-[#5A8A73]'
      )}
    >
      <ChefHat className="w-5 h-5" />
      <span>
        {t(lang, 'openOrders.confirmItems')}
        <span className="ml-1 opacity-80">
          ({itemCount} {itemCount === 1 ? t(lang, 'pos.item') : t(lang, 'pos.items')})
        </span>
      </span>
    </motion.button>
  );
}
