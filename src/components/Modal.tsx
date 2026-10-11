import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { motionT } from '../animations/motion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  role?: 'dialog' | 'alertdialog';
  /** `id` del título para `aria-labelledby`. */
  labelId?: string;
  /** `id` de la descripción para `aria-describedby`. */
  describedById?: string;
  /** `center` (por defecto) o `sheet` (hoja inferior anclada abajo). */
  variant?: 'center' | 'sheet';
  /** Clases extra del panel. */
  panelClassName?: string;
  children: React.ReactNode;
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Diálogo modal base: fondo oscurecido, panel centrado (o hoja inferior),
 * cierre con `Escape`, foco inicial y atrapado dentro del panel, restauración
 * del foco al cerrar y bloqueo del scroll de fondo. Lo usan `ConfirmDialog`,
 * `QrDialog`, Ajustes, la hoja de subida y el fin de partida.
 */
const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  role = 'dialog',
  labelId,
  describedById,
  variant = 'center',
  panelClassName,
  children,
}) => {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const getFocusables = () =>
      Array.from(panel?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement,
      );

    (getFocusables()[0] ?? panel)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = getFocusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  const isSheet = variant === 'sheet';
  const containerClassName = isSheet
    ? 'fixed inset-0 z-[440] flex items-end justify-center bg-ink-900/85'
    : 'fixed inset-0 z-[440] flex items-end justify-center bg-ink-900/85 sm:items-center sm:p-4';
  const basePanelClassName = isSheet
    ? 'flex w-full max-w-[25rem] flex-col gap-4 rounded-t-[14px] border border-b-0 border-bone/[0.18] bg-ink px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-6'
    : 'flex w-full max-w-[26rem] flex-col gap-6 rounded-t-[14px] border border-bone/[0.18] bg-ink px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 sm:rounded-[14px] sm:px-7 sm:py-7';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={containerClassName}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={motionT(0.2)}
          onClick={onClose}
        >
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            className={[basePanelClassName, 'outline-none', panelClassName ?? ''].join(' ')}
            initial={isSheet ? { y: '100%' } : { y: '6%', scale: 0.98, opacity: 0 }}
            animate={isSheet ? { y: 0 } : { y: 0, scale: 1, opacity: 1 }}
            exit={isSheet ? { y: '100%' } : { y: '4%', scale: 0.98, opacity: 0 }}
            transition={motionT(isSheet ? 0.32 : 0.3)}
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
