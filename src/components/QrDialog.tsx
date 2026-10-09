import React, { useId } from 'react';
import Button from './Button';
import Modal from './Modal';
import QrCode from './QrCode';

interface QrDialogProps {
  open: boolean;
  title: string;
  /** Contenido a codificar (enlace de invitación). */
  value: string;
  hint?: string;
  closeLabel: string;
  onClose: () => void;
}

/** Muestra el QR de la invitación en grande, reutilizando `QrCode`. */
const QrDialog: React.FC<QrDialogProps> = ({ open, title, value, hint, closeLabel, onClose }) => {
  const titleId = useId();
  return (
    <Modal
      open={open}
      onClose={onClose}
      labelId={titleId}
      panelClassName="items-center text-center sm:max-w-[20rem]"
    >
      <div id={titleId} className="font-display font-bold leading-none tracking-[-0.01em] text-fs-600">
        {title}
      </div>
      <div className="mx-auto rounded-[14px] bg-bone p-3">
        <QrCode value={value} size={240} label={title} />
      </div>
      {hint && <p className="font-body text-fs-200 leading-[1.45] opacity-70">{hint}</p>}
      <Button variant="outline" block onClick={onClose}>
        {closeLabel}
      </Button>
    </Modal>
  );
};

export default QrDialog;
