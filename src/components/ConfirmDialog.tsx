import React, { useId } from 'react';
import Button from './Button';
import Modal from './Modal';
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

  return (
    <Modal open={open} onClose={onCancel} role="alertdialog" labelId={titleId} describedById={messageId}>
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
    </Modal>
  );
};

export default ConfirmDialog;
