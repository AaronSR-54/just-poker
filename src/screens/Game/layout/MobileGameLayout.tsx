import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t as motionT } from '../../../animations/motion';
import ActionLog from '../components/ActionLog';
import SettingsButton from '../../../components/SettingsButton';
import RivalSlot from '../components/RivalSlot';
import ShowdownCards from '../components/ShowdownCards';
import HandLabel from '../components/HandLabel';
import CommunityRow from '../components/CommunityRow';
import HumanSeat from '../components/HumanSeat';
import ActionButtons from '../components/ActionButtons';
import TimerBar from '../components/TimerBar';
import GameOverOverlay from '../components/GameOverOverlay';
import { RaiseSheet } from '../components/RaiseControls';
import PotAward from '../../../components/PotAward';
import TutorialCoach from '../../../components/TutorialCoach';
import type { GameLayoutProps } from './types';

/** Mesa en vertical para pantallas estrechas (<768px). */
const MobileGameLayout: React.FC<GameLayoutProps> = ({
  state,
  view,
  rivalTurn,
  humanCards,
  humanSeatProps,
  actionButtonProps,
  isTutorial,
  gameSpeed,
  settingsOpen,
  turnDurationMs,
  raise,
  onOpenSettings,
  gameOverModal,
  onRestart,
  onSelectDifficulty,
  onHome,
  gameOverRestartLabel,
  gameOverRestartDisabled,
  gameOverWaitingLabel,
  potAward,
  onPotAwardLanded,
  onPotAwardDone,
  overlays,
  tutorial,
}) => {
  const { phase, activePlayer, winner, showdown, handOver, streetPending, visibleRivals, avatarTone, avatarRing, blindRoleFor, handNameFor, isDimmed, winnerLog, displayedChips, displayedPot, potEmpty, potAwarded } = view;

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
      <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto_1fr] overflow-y-auto px-[0.875rem]">
        <div className="flex flex-col self-start pt-[calc(0.75rem+env(safe-area-inset-top))] [@media(max-height:700px)]:pt-[calc(0.375rem+env(safe-area-inset-top))]">
          <div className="flex items-start justify-between gap-3 pb-1">
            <div className="pointer-events-none min-w-0 flex-1">
              <ActionLog compact state={state} winnerName={winnerLog?.name} winnerHand={winnerLog?.hand} winnerIsHuman={winnerLog?.isHuman} />
            </div>
            <SettingsButton onClick={onOpenSettings} inline />
          </div>

          <div data-tour="rivals" className="flex flex-wrap justify-center gap-2 pt-2">
          <AnimatePresence initial={false}>
          {visibleRivals.map((r, i) => (
            <motion.div
              key={r.id}
              layout="position"
              exit={{ opacity: 0, scale: 0.85, transition: motionT(0.25) }}
              className="flex flex-col items-center gap-1.5"
            >
              <RivalSlot
                compact
                enterDelay={i * 0.08}
                name={r.name}
                folded={r.folded}
                eliminated={r.eliminated}
                isActive={activePlayer === r.id}
                isWinner={winner !== null && winner.includes(r.id)}
                chips={displayedChips(r.id, r.chips)}
                blindRole={blindRoleFor(r.id)} dataTour={`rival-${r.id}`}
                delta={handOver ? (winner !== null && winner.includes(r.id) ? state.winAmounts[r.id] - state.committed[r.id] : 0) : -r.bet}
                isAllIn={r.isAllIn}
                handOver={handOver}
                avatarTone={avatarTone.tone}
                avatarImgClassName={avatarTone.imgClassName}
                avatarRing={avatarRing}
                timerDuration={rivalTurn?.playerIndex === r.id ? rivalTurn.duration : undefined}
                timerKey={`${state.handNumber}-${phase}-${r.id}`}
              />
              <div className="flex min-h-[5.5rem] flex-col items-center gap-1.5">
                {showdown && !r.folded && r.cards.length > 0 && (
                  <>
                    <ShowdownCards cards={r.cards} size="sm" isDimmed={isDimmed} />
                    <HandLabel name={handNameFor(r.cards)} winner={winner !== null && winner.includes(r.id)} />
                  </>
                )}
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
          </div>
        </div>

        <div className="py-3 [@media(max-height:700px)]:py-1">
          <CommunityRow
            phase={phase}
            community={state.community}
            pot={displayedPot}
            potAwarded={potEmpty}
            potLocked={potAwarded}
            cardSize="md"
            isDimmed={isDimmed}
          />
        </div>

        <div className="flex flex-col items-center gap-3 self-end pb-[calc(2.5rem+env(safe-area-inset-bottom))] [@media(max-height:700px)]:gap-1.5 [@media(max-height:700px)]:pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex justify-start">{humanCards}</div>
            <div className="flex items-center justify-end self-end"><HumanSeat {...humanSeatProps} /></div>
          </div>

          <div data-tour="actions" className="w-full">
            <ActionButtons {...actionButtonProps} fill />
          </div>

          <div className="h-[3px] w-full">
            {!isTutorial && activePlayer === 0 && !handOver && !streetPending && (
              <TimerBar key={`${state.handNumber}-${phase}-${gameSpeed}`} duration={turnDurationMs} className="mx-2" paused={settingsOpen} />
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {raise.show && activePlayer === 0 && !handOver && (
          <RaiseSheet
            raiseAmount={raise.amount}
            onRaiseChange={raise.onChange}
            onRaise={raise.onRaise}
            onClose={raise.onClose}
            minRaise={raise.minRaise}
            maxRaise={raise.maxRaise}
            potSize={raise.potSize}
            playerChips={raise.playerChips}
            callAmount={raise.callAmount}
            confirmDisabled={raise.confirmDisabled}
            hideAllIn={raise.hideAllIn}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gameOverModal && (
          <GameOverOverlay
            state={state}
            onRestart={onRestart}
            onSelectDifficulty={onSelectDifficulty}
            onHome={onHome}
            restartLabel={gameOverRestartLabel}
            restartDisabled={gameOverRestartDisabled}
            waitingLabel={gameOverWaitingLabel}
          />
        )}
      </AnimatePresence>

      {potAward && (
        <PotAward key={potAward.handNumber} data={potAward} onLanded={onPotAwardLanded} onDone={onPotAwardDone} />
      )}

      {overlays}

      {isTutorial && (
        <TutorialCoach
          key={tutorial.run}
          state={state}
          onFinish={tutorial.onFinish}
          onRestart={tutorial.onRestart} onResume={tutorial.onResume} onRaisePanel={tutorial.onRaisePanel} onExpectedAction={tutorial.onExpectedAction} raiseOpen={raise.show} onPause={tutorial.onPause}
        />
      )}
    </div>
  );
};

export default MobileGameLayout;
