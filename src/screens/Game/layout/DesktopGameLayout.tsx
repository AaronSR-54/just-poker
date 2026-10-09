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
import PotAward from '../../../components/PotAward';
import TutorialCoach from '../../../components/TutorialCoach';
import type { GameLayoutProps } from './types';

/** Mesa horizontal para tablet y escritorio (>=768px). */
const DesktopGameLayout: React.FC<GameLayoutProps> = ({
  state,
  view,
  aiTurn,
  humanCards,
  humanSeatProps,
  actionButtonProps,
  isShort,
  isTablet,
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
  potAward,
  onPotAwardLanded,
  onPotAwardDone,
  overlays,
  tutorial,
}) => {
  const { phase, activePlayer, winner, showdown, handOver, streetPending, visibleRivals, avatarTone, avatarRing, blindRoleFor, handNameFor, isDimmed, winnerLog, displayedChips, displayedPot, potEmpty, potAwarded } = view;

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
      <div className="pointer-events-none fixed left-12 top-[max(1.25rem,env(safe-area-inset-top))] z-40 hidden max-w-[16rem] xl:block">
        <ActionLog state={state} winnerName={winnerLog?.name} winnerHand={winnerLog?.hand} winnerIsHuman={winnerLog?.isHuman} />
      </div>

      <div className="hidden xl:block">
        <SettingsButton onClick={onOpenSettings} />
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto_1fr] px-6 lg:px-12">
        <div className={`flex flex-col self-start ${isShort ? 'pt-1' : 'pt-4'}`}>
          <div className="flex shrink-0 items-start justify-between gap-3 xl:hidden">
            <div className="pointer-events-none min-w-0 flex-1">
              <ActionLog compact state={state} winnerName={winnerLog?.name} winnerHand={winnerLog?.hand} winnerIsHuman={winnerLog?.isHuman} />
            </div>
            <SettingsButton onClick={onOpenSettings} inline />
          </div>

          <div data-tour="rivals" className={`flex justify-center ${isShort ? 'mt-1 gap-2' : 'mt-3 gap-3 lg:mt-4 lg:gap-4'}`}>
          <AnimatePresence initial={false}>
          {visibleRivals.map((r, i) => (
            <motion.div
              key={r.id}
              layout="position"
              exit={{ opacity: 0, scale: 0.85, transition: motionT(0.25) }}
              className="flex flex-col items-center gap-2"
            >
              <RivalSlot
                compact={isShort}
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
                timerDuration={aiTurn?.playerIndex === r.id ? aiTurn.duration : undefined}
                timerKey={`${state.handNumber}-${phase}-${r.id}`}
              />
              <div className={`flex flex-col items-center gap-2 ${isShort ? 'min-h-[3.75rem]' : 'min-h-[7.1875rem]'}`}>
                {showdown && !r.folded && r.cards.length > 0 && (
                  <>
                    <ShowdownCards cards={r.cards} size={isShort ? 'sm' : 'md'} isDimmed={isDimmed} />
                    <HandLabel name={handNameFor(r.cards)} winner={winner !== null && winner.includes(r.id)} />
                  </>
                )}
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
          </div>
        </div>

        <div className={isShort ? 'py-1' : 'py-4 lg:py-6'}>
          <CommunityRow
            phase={phase}
            community={state.community}
            pot={displayedPot}
            potAwarded={potEmpty}
            potLocked={potAwarded}
            cardSize={isShort ? 'md' : 'xxl'}
            isDimmed={isDimmed}
          />
        </div>

        <div className={`flex flex-col self-end ${isShort ? 'gap-2 pb-2' : 'gap-4 pb-6'}`}>
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
            <div className="justify-self-start"><HumanSeat {...humanSeatProps} /></div>

            <div className="flex flex-col items-center gap-1">{humanCards}</div>

            <div data-tour="actions" className="flex flex-col items-end gap-2 justify-self-end">
              <ActionButtons {...actionButtonProps} stack={!handOver && isTablet} />
            </div>
          </div>

          <div className="h-[3px] w-full">
            {!isTutorial && activePlayer === 0 && !handOver && !streetPending && (
              <TimerBar key={`${state.handNumber}-${phase}-${gameSpeed}`} duration={turnDurationMs} className="mx-2" paused={settingsOpen} />
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {gameOverModal && (
          <GameOverOverlay
            state={state}
            onRestart={onRestart}
            onSelectDifficulty={onSelectDifficulty}
            onHome={onHome}
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

export default DesktopGameLayout;
