import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { motionT } from '../../../animations/motion';
import RivalSlot from './RivalSlot';
import ShowdownCards from './ShowdownCards';
import HandLabel from './HandLabel';
import type { PokerState } from '../../../game/poker';
import type { GameView } from '../gameView';
import type { GameLayoutProps } from '../layout/types';

/** Lista de rivales de la mesa, compartida por los layouts móvil y desktop. */
const RivalList: React.FC<{
  state: PokerState;
  view: GameView;
  rivalTurn: GameLayoutProps['rivalTurn'];
  settingsOpen: boolean;
  compact: boolean;
  containerClassName: string;
  itemGapClassName: string;
  showdownClassName: string;
  showdownSize: 'sm' | 'md';
}> = ({
  state,
  view,
  rivalTurn,
  settingsOpen,
  compact,
  containerClassName,
  itemGapClassName,
  showdownClassName,
  showdownSize,
}) => {
  const {
    phase,
    activePlayer,
    winner,
    showdown,
    handOver,
    visibleRivals,
    avatarTone,
    avatarRing,
    blindRoleFor,
    handNameFor,
    isDimmed,
    displayedChips,
  } = view;

  return (
    <div data-tour="rivals" className={containerClassName}>
      <AnimatePresence initial={false}>
        {visibleRivals.map((r, i) => (
          <motion.div
            key={r.id}
            layout="position"
            exit={{ opacity: 0, scale: 0.85, transition: motionT(0.25) }}
            className={`flex flex-col items-center ${itemGapClassName}`}
          >
            <RivalSlot
              compact={compact}
              enterDelay={i * 0.08}
              name={r.name}
              folded={r.folded}
              eliminated={r.eliminated}
              isActive={activePlayer === r.id}
              isWinner={winner !== null && winner.includes(r.id)}
              chips={displayedChips(r.id, r.chips)}
              blindRole={blindRoleFor(r.id)}
              dataTour={`rival-${r.id}`}
              delta={handOver ? (winner !== null && winner.includes(r.id) ? state.winAmounts[r.id] - state.committed[r.id] : 0) : -r.bet}
              isAllIn={r.isAllIn}
              handOver={handOver}
              avatarTone={avatarTone.tone}
              avatarImgClassName={avatarTone.imgClassName}
              avatarRing={avatarRing}
              timerDuration={rivalTurn?.playerIndex === r.id ? rivalTurn.duration : undefined}
              timerRemainingMs={rivalTurn?.playerIndex === r.id ? rivalTurn.remainingMs : undefined}
              timerPaused={settingsOpen}
              timerKey={`${state.handNumber}-${phase}-${r.id}`}
            />
            <div className={showdownClassName}>
              {showdown && !r.folded && r.cards.length > 0 && (
                <>
                  <ShowdownCards cards={r.cards} size={showdownSize} isDimmed={isDimmed} />
                  <HandLabel name={handNameFor(r.cards)} winner={winner !== null && winner.includes(r.id)} />
                </>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default RivalList;
