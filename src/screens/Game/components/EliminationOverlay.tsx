import React from 'react';
import Button from '../../../components/Button';
import Modal from '../../../components/Modal';
import { useI18n } from '../../../i18n';

/** Aviso de eliminación en una partida online: quedarse a mirar o volver al menú. */
export interface EliminationOverlayProps {
  open: boolean;
  onStay: () => void;
  onLeave: () => void;
}

const EliminationOverlay: React.FC<EliminationOverlayProps> = ({ open, onStay, onLeave }) => {
  const { t } = useI18n();

  return (
    <Modal
      open={open}
      onClose={onStay}
      panelClassName="max-w-[26.25rem]! items-center! px-10! py-9! text-center! gap-5!"
    >
      <div className="flex flex-col items-center gap-2">
        <div className="font-display font-bold tracking-[-0.01em] text-fs-700 text-bone">
          {t('game.overLost')}
        </div>
        <p className="font-body leading-[1.45] text-fs-300 opacity-70">
          {t('game.eliminatedSupport')}
        </p>
      </div>

      <div className="flex w-full flex-col gap-2 border-t border-bone/[0.18] pt-5">
        <Button variant="primary" block onClick={onStay}>{t('game.watchGame')}</Button>
        <Button variant="ghost" size="sm" block onClick={onLeave}>{t('game.backHome')}</Button>
      </div>
    </Modal>
  );
};

export default EliminationOverlay;
