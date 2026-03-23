import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

const typeStyles: Record<ToastType, string> = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  warning: 'bg-amber-500 text-white',
  info: 'bg-blue-600 text-white',
};

const icons: Record<ToastType, ReactElement> = {
  success: <Check className="w-5 h-5" />,
  error: <X className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, toast.duration || 3000);

    return () => clearTimeout(timer);
  }, [toast.duration, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-72',
        typeStyles[toast.type]
      )}
    >
      {icons[toast.type]}
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={onRemove}
        className="p-1 rounded hover:bg-white/20 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return createPortal(
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={() => onRemove(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  );
}

// Toast hook for easy usage
let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function updateToasts(newToasts: Toast[]) {
  toasts = newToasts;
  toastListeners.forEach((listener) => listener(toasts));
}

export const toast = {
  show: (message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substring(2);
    updateToasts([...toasts, { id, message, type, duration }]);
  },
  success: (message: string, duration?: number) => toast.show(message, 'success', duration),
  error: (message: string, duration?: number) => toast.show(message, 'error', duration),
  warning: (message: string, duration?: number) => toast.show(message, 'warning', duration),
  info: (message: string, duration?: number) => toast.show(message, 'info', duration),
  remove: (id: string) => {
    updateToasts(toasts.filter((t) => t.id !== id));
  },
};

export function useToast() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>(toasts);

  useEffect(() => {
    toastListeners.push(setCurrentToasts);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== setCurrentToasts);
    };
  }, []);

  return {
    toasts: currentToasts,
    show: toast.show,
    success: toast.success,
    error: toast.error,
    warning: toast.warning,
    info: toast.info,
    remove: toast.remove,
  };
}
