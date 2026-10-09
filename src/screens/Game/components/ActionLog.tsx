import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t as motionT } from '../../../animations/motion';
import { useI18n } from '../../../i18n';
import type { PokerState } from '../../../game/poker';

const ACTION_VERB_KEYS: Record<string, { third: string; second: string }> = {
  fold: { third: 'game.log.foldThird', second: 'game.log.foldSecond' },
  check: { third: 'game.log.checkThird', second: 'game.log.checkSecond' },
  call: { third: 'game.log.callThird', second: 'game.log.callSecond' },
  raise: { third: 'game.log.raiseThird', second: 'game.log.raiseSecond' },
  blind: { third: 'game.log.blindThird', second: 'game.log.blindSecond' },
};

const ActionLog: React.FC<{ state: PokerState; winnerName?: string; winnerHand?: string; winnerIsHuman?: boolean; compact?: boolean }> = ({
  state,
  winnerName = '',
  winnerHand = '',
  winnerIsHuman = false,
  compact = false,
}) => {
  const { t } = useI18n();
  const entries = state.actions.slice(-4).map(a => {
    const p = state.players[a.playerIndex];
    const verb = ACTION_VERB_KEYS[a.type];
    const isHuman = a.playerIndex === 0;
    const text = `${verb ? t(isHuman ? verb.second : verb.third) : a.type}${a.amount ? ` ${a.amount}` : ''}`;
    return { name: isHuman ? t('common.you') : p?.name ?? '?', text };
  });
  if (winnerName) {
    if (winnerIsHuman) {
      entries.push({ name: t('common.you'), text: winnerHand ? t('game.log.wonYouWith', { hand: winnerHand }) : t('game.log.wonYou') });
    } else {
      entries.push({ name: winnerName, text: winnerHand ? t('game.log.wonWith', { hand: winnerHand }) : t('game.log.won') });
    }
  }

  // En móvil solo se muestra la última entrada, pero el alto queda reservado
  // siempre (fila fija) para que la mesa no se desplace al aparecer/desaparecer.
  if (compact) {
    const line = entries[entries.length - 1];
    return (
      <div className="flex flex-col items-start gap-0.5 text-left">
        <div className="font-body text-fs-100 tracking-[0.04em] opacity-50">{t('game.handNumber', { n: state.handNumber })}</div>
        <div className="flex h-4 w-full items-center">
          <AnimatePresence mode="wait">
            {line && (
              <motion.span
                key={`${line.name}-${line.text}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={motionT(0.2)}
                className="min-w-0 truncate whitespace-nowrap font-body text-fs-100 text-bone"
              >
                {line.name ? <><strong>{line.name}</strong> {line.text}</> : line.text}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (entries.length === 0) return null;
  const lines = entries.slice(-4);
  return (
    <div className="flex flex-col items-start gap-0.5 text-left">
      <div className="mb-0.5 font-body text-fs-100 tracking-[0.04em] opacity-50">{t('game.handNumber', { n: state.handNumber })}</div>
      {lines.map((line, i) => (
        <motion.div
          key={`${line.name}-${line.text}-${i}`}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 0.35 + (0.65 * (i + 1)) / lines.length, x: 0 }}
          transition={motionT(0.24)}
          className="font-body text-fs-100 text-bone"
        >
          {line.name ? <><strong>{line.name}</strong> {line.text}</> : line.text}
        </motion.div>
      ))}
    </div>
  );
};

export default ActionLog;
