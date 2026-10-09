import React from 'react';
import { motion } from 'framer-motion';
import Button from '../../../components/Button';
import ChipIcon from '../../../components/ChipIcon';
import { container, fadeUp, t as motionT } from '../../../animations/motion';
import { useI18n } from '../../../i18n';
import type { PokerState } from '../../../game/poker';

const GameOverOverlay: React.FC<{
  state: PokerState;
  onRestart: () => void;
  onSelectDifficulty: () => void;
  onHome: () => void;
}> = ({ state, onRestart, onSelectDifficulty, onHome }) => {
  const { t } = useI18n();
  const standings = [...state.players]
    .sort((a, b) => {
      if (a.id === state.gameWinner) return -1;
      if (b.id === state.gameWinner) return 1;
      return b.chips - a.chips;
    });
  const humanWon = state.gameWinner === 0;

  return (
    <motion.div
      className="fixed inset-0 z-300 flex items-center justify-center bg-ink-900/85"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: motionT(0.2) }}
      transition={motionT(0.35)}
    >
      <motion.div
        className="flex w-[calc(100%-3rem)] max-w-[26.25rem] flex-col items-center gap-5 rounded-[14px] border border-bone/[0.18] bg-ink px-10 py-9 text-center"
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 12, transition: motionT(0.2) }}
        transition={motionT(0.42, 0.1)}
      >
        <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">{t('game.overEyebrow', { n: state.handNumber })}</div>
        <div className="font-display font-bold leading-none tracking-[-0.01em] text-fs-700">
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
              <div className="flex items-center gap-2">
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
            <Button variant="primary" block onClick={onRestart}>{t('game.newGame')}</Button>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Button variant="outline" block onClick={onSelectDifficulty}>{t('game.selectDifficulty')}</Button>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Button variant="ghost" size="sm" block onClick={onHome}>{t('game.backHome')}</Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default GameOverOverlay;
