import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { motion, type HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  fullWidth?: boolean;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[#E07A5F] text-white hover:bg-[#C9654B] active:bg-[#B85A42]',
  secondary: 'bg-[#F5F0E8] text-[#3D405B] hover:bg-[#E8E2D9] active:bg-[#DDD6CA]',
  danger: 'bg-[#E07A5F] text-white hover:bg-[#C9654B] active:bg-[#B85A42]',
  ghost: 'bg-transparent text-[#3D405B] hover:bg-[#F5F0E8] active:bg-[#E8E2D9]',
  outline: 'bg-transparent border-2 border-[#E8E2D9] text-[#3D405B] hover:border-[#E07A5F] hover:bg-[#FFF0EB]',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
  xl: 'px-8 py-4 text-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        disabled={disabled || isLoading}
        className={clsx(
          'inline-flex items-center justify-center font-medium rounded-lg transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-[#E07A5F] focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...(props as HTMLMotionProps<'button'>)}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Loading...
          </span>
        ) : (
          children
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
