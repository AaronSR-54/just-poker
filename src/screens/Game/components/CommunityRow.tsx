import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PokerCard from '../../../components/PokerCard';
import ChipIcon from '../../../components/ChipIcon';
import { PHASE_LABEL_KEYS } from '../../../game/gameState';
import { t as motionT } from '../../../animations/motion';
import { useI18n } from '../../../i18n';
import type { GamePhase, CardRank, Suit } from '../../../types';

const COMMUNITY_SLOT: Record<'md' | 'xxl', { w: string; h: string; gap: string }> = {
  md: { w: 'w-[min(4rem,16vw)]', h: 'h-[min(5.625rem,22.4vw)]', gap: 'gap-1.5' },
  xxl: { w: 'w-[min(8.125rem,15vw)]', h: 'h-[min(11.375rem,21vw)]', gap: 'gap-3' },
};

const CommunityRow: React.FC<{
  phase: GamePhase;
  community: { rank: CardRank; suit: Suit }[];
  pot: number;
  /** El bote se ha agotado (0): se desvanece tras terminar de repartirse. */
  potAwarded?: boolean;
  /** La mano ha terminado: el bote se resta sin rebotar en cada tick. */
  potLocked?: boolean;
  cardSize?: 'md' | 'xxl';
  isDimmed?: (card: { rank: CardRank; suit: Suit }) => boolean;
}> = ({ phase, community, pot, potAwarded = false, potLocked = false, cardSize = 'xxl', isDimmed }) => {
  const { t } = useI18n();
  const visibleCount = phase === 'pre-flop' ? 0 : phase === 'flop' ? 3 : phase === 'turn' ? 4 : 5;
  const slot = COMMUNITY_SLOT[cardSize];
  // Índice de la primera carta de la calle actual: el escalonado solo reparte
  // retardo entre las cartas recién descubiertas (las 3 del flop).
  const streetStart = phase === 'flop' ? 0 : phase === 'turn' ? 3 : 4;

  return (
    <div data-tour="board" className="flex flex-col items-center gap-3">
      <div data-tour="phase" className="flex h-7 items-center gap-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={phase}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={motionT(0.24)}
            className="inline-flex rounded-pill border border-bone/[0.18] bg-ink px-[0.875rem] py-1 font-display font-bold text-fs-100 tracking-[0.14em] uppercase max-md:px-2.5 max-md:py-0.5"
          >
            {t(PHASE_LABEL_KEYS[phase]) || phase}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className={`flex justify-center ${slot.gap}`}>
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < visibleCount && community[i]) {
            const card = community[i];
            return (
              <motion.div
                key={`${card.rank}${card.suit}`}
                initial={{ opacity: 0, scale: 0.85, rotateY: 60 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={motionT(0.35, (i - streetStart) * 0.1)}
              >
                <PokerCard
                  size={cardSize}
                  rank={card.rank}
                  suit={card.suit}
                  dimmed={isDimmed?.(card)}
                />
              </motion.div>
            );
          }
          return <div key={i} className={`rounded-[0.625rem] border-[1.5px] border-dashed border-bone/[0.14] bg-ink/40 ${slot.w} ${slot.h}`} />;
        })}
      </div>

      <motion.div
        data-tour="pot"
        className="flex items-center gap-1.5 font-display font-bold text-fs-200 tracking-[0.06em]"
        key={potLocked ? 'pot' : pot}
        initial={{ scale: 1.1 }}
        animate={{ scale: potAwarded ? 0.9 : 1, opacity: potAwarded ? 0 : 1 }}
        transition={motionT(0.3)}
      >
        <span className="opacity-50">{t('game.pot')}</span>
        <span data-chips className="inline-flex">
          <ChipIcon className="size-5 text-bone" />
        </span>
        <span>{pot}</span>
      </motion.div>
    </div>
  );
};

export default CommunityRow;
