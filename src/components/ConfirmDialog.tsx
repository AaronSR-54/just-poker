import React, { useEffect, useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from './Button';
import { t as motionT } from '../animations/motion';
import { useI18n } from '../i18n';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Marca la acción como destructiva (botón de confirmar en rojo). */
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  onConfirm,
  onCancel,
}) => {
  const { t } = useI18n();
  const confirmText = confirmLabel ?? t('common.confirm');
  const cancelText = cancelLabel ?? t('common.cancel');
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[440] flex items-end justify-center bg-ink-900/85 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={motionT(0.2)}
          onClick={onCancel}
        >
          <motion.div
            className="flex w-full max-w-[26rem] flex-col gap-6 rounded-t-[14px] border border-bone/[0.18] bg-ink px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-6 sm:rounded-[14px] sm:px-7 sm:py-7"
            initial={{ y: '6%', scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: '4%', scale: 0.98, opacity: 0 }}
            transition={motionT(0.3)}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={messageId}
          >
            <div className="flex flex-col gap-2">
              <div id={titleId} className="font-display font-bold leading-none tracking-[-0.01em] text-fs-600">
                {title}
              </div>
              <p id={messageId} className="font-body leading-[1.45] text-fs-300 opacity-70">
                {message}
              </p>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={onCancel}>
                {cancelText}
              </Button>
              <Button
                variant={danger ? 'outline' : 'primary'}
                onClick={onConfirm}
                className={danger ? 'border-danger! bg-danger! text-ink! enabled:hover:border-danger! enabled:hover:brightness-[1.08]!' : ''}
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
