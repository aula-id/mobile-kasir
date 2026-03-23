import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Menu, Home } from 'lucide-react';
import { StandaloneSlideMenu } from './StandaloneSlideMenu';
import { useStandaloneConfigStore } from '@/stores/standalone/standaloneConfigStore';

interface StandaloneSubPageHeaderProps {
  title: string;
  rightAction?: React.ReactNode;
}

export function StandaloneSubPageHeader({ title, rightAction }: StandaloneSubPageHeaderProps) {
  const navigate = useNavigate();
  const { mode } = useStandaloneConfigStore();
  const [showMenu, setShowMenu] = useState(false);

  const basePath = mode === 'fnb' ? '/fnb' : '/rtl';

  const handleHome = () => {
    navigate({ to: `${basePath}/pos` });
  };

  return (
    <>
      <div className="p-4 border-b border-[#E8E2D9] bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          {/* Menu button */}
          <button
            onClick={() => setShowMenu(true)}
            className="p-2 -ml-2 text-[#3D405B] hover:bg-[#F5F0E8] rounded-lg transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Home button */}
          <button
            onClick={handleHome}
            className="p-2 text-[#8D8D9B] hover:text-[#3D405B] hover:bg-[#F5F0E8] rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
          </button>

          {/* Title */}
          <h1 className="text-xl font-semibold text-[#3D405B] flex-1">
            {title}
          </h1>

          {rightAction}
        </div>
      </div>

      {/* Slide Menu */}
      <StandaloneSlideMenu isOpen={showMenu} onClose={() => setShowMenu(false)} />
    </>
  );
}
