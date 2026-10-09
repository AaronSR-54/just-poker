import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { t as motionT } from '../animations/motion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  role?: 'dialog' | 'alertdialog';
  /** `id` del título para `aria-labelledby`. */
  labelId?: string;
  /** `id` de la descripción para `aria-describedby`. */
  describedById?: string;
  /** Clases extra del panel. */
  panelClassName?: string;
  children: React.ReactNode;
}

/**
 * Diálogo modal base: fondo oscurecido, panel centrado (hoja inferior en móvil),
 * cierre con `Escape` y foco semántico (`role`, `aria-modal`). Lo usan
 * `ConfirmDialog` y `QrDialog`.
 */
const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  role = 'dialog',
  labelId,
  describedById,
  panelClassName,
  children,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[440] flex items-end justify-center bg-ink-900/85 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={motionT(0.2)}
          onClick={onClose}
        >
          <motion.div
            className={[
              'flex w-full max-w-[26rem] flex-col gap-6 rounded-t-[14px] border border-bone/[0.18] bg-ink px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 sm:rounded-[14px] sm:px-7 sm:py-7',
              panelClassName ?? '',
            ].join(' ')}
            initial={{ y: '6%', scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: '4%', scale: 0.98, opacity: 0 }}
            transition={motionT(0.3)}
            onClick={(e) => e.stopPropagation()}
            role={role}
            aria-modal="true"
            aria-labelledby={labelId}
            aria-describedby={describedById}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
