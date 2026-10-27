import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, Loader2, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useUI } from '../store/ui';

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return <Loader2 className={`animate-spin text-brand-300 ${className}`} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
      {icon ? <div className="text-brand-300/80">{icon}</div> : null}
      <p className="font-display text-lg font-semibold text-white">{title}</p>
      {description ? <p className="max-w-md text-sm text-white/50">{description}</p> : null}
      {action}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-void-950/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className={`relative w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} rounded-t-3xl border border-white/10 bg-void-900/95 p-5 shadow-2xl sm:rounded-3xl`}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
              <button className="btn-icon h-8 w-8" onClick={onClose} aria-label="Cerrar">
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function Toasts() {
  const { toasts, dismiss } = useUI();
  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[120] flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-white/10 bg-void-800/95 px-4 py-3 text-sm text-white shadow-xl backdrop-blur-xl"
          >
            {t.kind === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-neon-lime" />
            ) : t.kind === 'error' ? (
              <AlertCircle className="h-4 w-4 shrink-0 text-neon-rose" />
            ) : (
              <Info className="h-4 w-4 shrink-0 text-brand-300" />
            )}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => dismiss(t.id)} className="text-white/40 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-white/45">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
