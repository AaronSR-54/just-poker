import React from 'react';
import { motion } from 'framer-motion';
import Button from '../../../components/Button';
import ChipIcon from '../../../components/ChipIcon';
import Modal from '../../../components/Modal';
import { container, fadeUp } from '../../../animations/motion';
import { useI18n } from '../../../i18n';
import type { PokerState } from '../../../game/poker';

const GameOverOverlay: React.FC<{
  open: boolean;
  state: PokerState;
  onRestart: () => void;
  onSelectDifficulty?: () => void;
  onHome: () => void;
  restartLabel?: string;
  restartDisabled?: boolean;
  waitingLabel?: string;
}> = ({ open, state, onRestart, onSelectDifficulty, onHome, restartLabel, restartDisabled = false, waitingLabel }) => {
  const { t } = useI18n();
  const standings = [...state.players]
    .sort((a, b) => {
      if (a.id === state.gameWinner) return -1;
      if (b.id === state.gameWinner) return 1;
      return b.chips - a.chips;
    });
  const humanWon = state.gameWinner === 0;

  return (
    <Modal
      open={open}
      onClose={() => {}}
      panelClassName="max-w-[26.25rem]! items-center! px-10! py-9! text-center! gap-5!"
    >
      <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">{t('game.overEyebrow', { n: state.handNumber })}</div>
      <div className="font-display font-bold tracking-[-0.01em] text-fs-700">
        {humanWon ? t('game.overWon') : t('game.overLost')}
      </div>

      <motion.div
        variants={container(0.08, 0.25)}
        initial="hidden"
        animate="visible"
        className="flex w-full flex-col gap-2"
      >
        {standings.map((p, i) => (
          <motion.div
            key={p.id}
            variants={fadeUp}
            className={`flex w-full items-center justify-between rounded-[0.625rem] border border-bone/[0.18] px-[0.875rem] py-[0.625rem] ${
              p.id === 0 ? 'border-bone bg-bone text-ink' : ''
            }`}
          >
            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase">{t('game.place', { n: i + 1 })}</span>
              <span className={`font-body leading-[1.45] text-fs-300${p.id === 0 ? ' font-bold' : ''}`}>{p.id === 0 ? t('common.you') : p.name}</span>
            </div>
            <span className="inline-flex items-center gap-1 font-display font-bold text-fs-100 tracking-[0.14em] uppercase">
              <ChipIcon className={`size-5 ${p.id === 0 ? 'text-ink' : 'text-bone'}`} /> {p.chips}
            </span>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        variants={container(0.06, 0.5)}
        initial="hidden"
        animate="visible"
        className="flex w-full flex-col gap-2 border-t border-bone/[0.18] pt-5"
      >
        <motion.div variants={fadeUp}>
          {restartDisabled ? (
            <span className="font-body text-fs-100 tracking-[0.04em] opacity-70">{waitingLabel ?? t('game.waitingHost')}</span>
          ) : (
            <Button variant="primary" block onClick={onRestart}>{restartLabel ?? t('game.newGame')}</Button>
          )}
        </motion.div>
        {onSelectDifficulty && (
          <motion.div variants={fadeUp}>
            <Button variant="outline" block onClick={onSelectDifficulty}>{t('game.selectDifficulty')}</Button>
          </motion.div>
        )}
        <motion.div variants={fadeUp}>
          <Button variant="ghost" size="sm" block onClick={onHome}>{t('game.backHome')}</Button>
        </motion.div>
      </motion.div>
    </Modal>
  );
};

export default GameOverOverlay;
