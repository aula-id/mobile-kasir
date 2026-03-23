import { useState } from 'react';
import { StandaloneSlideMenu } from './StandaloneSlideMenu';
import { useStandaloneConfigStore } from '@/stores/standalone/standaloneConfigStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { t } from '@/lib/i18n';
import { Menu, Store } from 'lucide-react';

export function StandaloneHeader() {
  const [showMenu, setShowMenu] = useState(false);
  const { businessName, mode } = useStandaloneConfigStore();
  const { appSettings } = useSettingsStore();
  const lang = appSettings.language;

  return (
    <>
      <header className="bg-white border-b border-[#E8E2D9] px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Menu and Business Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowMenu(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-[#F5F0E8] text-[#3D405B] transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#E07A5F] rounded-lg flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-[#3D405B] leading-tight">
                  {businessName || t(lang, 'standalone.myBusiness')}
                </h1>
                <p className="text-xs text-[#8D8D9B]">
                  {mode === 'fnb' ? t(lang, 'standalone.fnbMode') : t(lang, 'standalone.retailMode')}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Standalone badge */}
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-[#FDF6F4] text-[#E07A5F] text-xs font-medium rounded-full">
              {t(lang, 'standalone.standaloneMode')}
            </span>
          </div>
        </div>
      </header>

      {/* Slide Menu */}
      <StandaloneSlideMenu isOpen={showMenu} onClose={() => setShowMenu(false)} />
    </>
  );
}
