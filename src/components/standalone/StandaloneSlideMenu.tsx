import { useNavigate, useLocation } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useStandaloneConfigStore } from '@/stores/standalone/standaloneConfigStore';
import { useStandaloneCatalogStore } from '@/stores/standalone/standaloneCatalogStore';
import { useStandaloneCartStore } from '@/stores/standalone/standaloneCartStore';
import { useStandaloneTransactionStore } from '@/stores/standalone/standaloneTransactionStore';
import { useStandaloneOpenOrderStore } from '@/stores/standalone/standaloneOpenOrderStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';
import { useState } from 'react';
import {
  X,
  ShoppingBag,
  Package,
  Folder,
  Receipt,
  Printer,
  LogOut,
  Store,
  ChevronRight,
} from 'lucide-react';

interface StandaloneSlideMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  active?: boolean;
}

export function StandaloneSlideMenu({ isOpen, onClose }: StandaloneSlideMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { businessName, mode, reset: resetConfig, setExitedAndKeepData } = useStandaloneConfigStore();
  const { reset: resetCatalog } = useStandaloneCatalogStore();
  const { clearCart } = useStandaloneCartStore();
  const { reset: resetTransactions } = useStandaloneTransactionStore();
  const { reset: resetOpenOrders } = useStandaloneOpenOrderStore();
  const { appSettings, updateAppSettings } = useSettingsStore();
  const lang = appSettings.language;

  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const LANGUAGES: { code: Language; label: string }[] = [
    { code: 'id', label: 'ID' },
    { code: 'en', label: 'EN' },
    { code: 'jv', label: 'JV' },
    { code: 'su', label: 'SU' },
    { code: 'ban', label: 'BAN' },
  ];

  const handleLanguageChange = (newLang: Language) => {
    updateAppSettings({ language: newLang });
  };

  const basePath = mode === 'fnb' ? '/fnb' : '/rtl';

  const menuItems: MenuItem[] = [
    {
      icon: <ShoppingBag className="w-5 h-5" />,
      label: t(lang, 'standalone.pos'),
      path: `${basePath}/pos`,
    },
    {
      icon: <Package className="w-5 h-5" />,
      label: t(lang, 'standalone.products'),
      path: `${basePath}/products`,
    },
    {
      icon: <Folder className="w-5 h-5" />,
      label: t(lang, 'standalone.categories'),
      path: `${basePath}/categories`,
    },
    {
      icon: <Receipt className="w-5 h-5" />,
      label: t(lang, 'standalone.history'),
      path: `${basePath}/history`,
    },
    {
      icon: <Printer className="w-5 h-5" />,
      label: t(lang, 'standalone.printer'),
      path: `${basePath}/printer`,
    },
  ];

  const handleNavigate = (path: string) => {
    navigate({ to: path });
    onClose();
  };

  const handleExitStandalone = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = (clearData: boolean) => {
    if (clearData) {
      resetConfig();
      resetCatalog();
      resetTransactions();
      resetOpenOrders();
    } else {
      setExitedAndKeepData(true);
    }
    clearCart();
    setShowExitConfirm(false);
    onClose();
    navigate({ to: '/setup' });
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* Menu panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-[#E8E2D9]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#E07A5F] rounded-xl flex items-center justify-center">
                      <Store className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-[#3D405B]">
                        {businessName || t(lang, 'standalone.myBusiness')}
                      </h2>
                      <p className="text-sm text-[#8D8D9B]">
                        {mode === 'fnb' ? t(lang, 'standalone.fnbMode') : t(lang, 'standalone.retailMode')}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-[#F5F0E8] text-[#8D8D9B] hover:text-[#3D405B] transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Language Selector */}
              <div className="px-6 py-4 border-b border-[#E8E2D9]">
                <div className="text-sm font-medium text-[#3D405B] mb-3">
                  {t(lang, 'layout.language')}
                </div>
                <div className="flex gap-2">
                  {LANGUAGES.map((langOption) => (
                    <button
                      key={langOption.code}
                      onClick={() => handleLanguageChange(langOption.code)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        appSettings.language === langOption.code
                          ? 'bg-[#E07A5F] text-white'
                          : 'bg-[#F5F0E8] text-[#3D405B] hover:bg-[#E8E2D9]'
                      }`}
                    >
                      {langOption.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Menu Items */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => handleNavigate(item.path)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                          isActive
                            ? 'bg-[#FDF6F4] text-[#E07A5F]'
                            : 'text-[#3D405B] hover:bg-[#F5F0E8]'
                        }`}
                      >
                        {item.icon}
                        <span className="flex-1 text-left font-medium">{item.label}</span>
                        <ChevronRight className={`w-4 h-4 ${isActive ? 'text-[#E07A5F]' : 'text-[#C9B8A8]'}`} />
                      </button>
                    );
                  })}
                </div>
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-[#E8E2D9]">
                <button
                  onClick={handleExitStandalone}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">{t(lang, 'standalone.exitStandalone')}</span>
                </button>
                <p className="text-xs text-[#8D8D9B] text-center mt-4">
                  {t(lang, 'layout.version')}
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Exit confirmation modal */}
      <Modal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        title={t(lang, 'standalone.exitStandalone')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-[#8D8D9B]">
            {t(lang, 'standalone.exitConfirmMessage')}
          </p>
          <div className="space-y-2">
            <Button
              fullWidth
              variant="secondary"
              onClick={() => confirmExit(false)}
            >
              {t(lang, 'standalone.exitKeepData')}
            </Button>
            <Button
              fullWidth
              onClick={() => confirmExit(true)}
              className="bg-red-500 hover:bg-red-600"
            >
              {t(lang, 'standalone.exitClearData')}
            </Button>
            <Button
              fullWidth
              variant="secondary"
              onClick={() => setShowExitConfirm(false)}
            >
              {t(lang, 'pos.cancel')}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
