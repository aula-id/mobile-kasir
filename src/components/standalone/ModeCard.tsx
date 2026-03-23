import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface ModeCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
  badge?: string;
  onClick: () => void;
}

export function ModeCard({ title, description, icon, selected, disabled, badge, onClick }: ModeCardProps) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.98 }}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={clsx(
        'w-full p-6 rounded-2xl border-2 text-left transition-colors',
        disabled
          ? 'border-[#E8E2D9] bg-[#F5F5F5] opacity-50 cursor-not-allowed'
          : selected
            ? 'border-[#E07A5F] bg-[#FDF6F4]'
            : 'border-[#E8E2D9] bg-white hover:border-[#C9B8A8]'
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={clsx(
            'w-14 h-14 rounded-xl flex items-center justify-center shrink-0',
            disabled
              ? 'bg-[#E8E2D9] text-[#B0B0B0]'
              : selected
                ? 'bg-[#E07A5F] text-white'
                : 'bg-[#F5F0E8] text-[#8D8D9B]'
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={clsx(
                'text-lg font-semibold',
                disabled
                  ? 'text-[#B0B0B0]'
                  : selected
                    ? 'text-[#E07A5F]'
                    : 'text-[#3D405B]'
              )}
            >
              {title}
            </h3>
            {badge && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
                {badge}
              </span>
            )}
          </div>
          <p className={clsx(
            'text-sm leading-relaxed',
            disabled ? 'text-[#B0B0B0]' : 'text-[#8D8D9B]'
          )}>
            {description}
          </p>
        </div>
        {selected && !disabled && (
          <div className="w-6 h-6 rounded-full bg-[#E07A5F] flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    </motion.button>
  );
}
