import React from 'react';
import Screen from '../../../components/Screen';
import ActionLog from '../components/ActionLog';
import SettingsButton from '../../../components/SettingsButton';
import CommunityRow from '../components/CommunityRow';
import HumanSeat from '../components/HumanSeat';
import ActionButtons from '../components/ActionButtons';
import TimerBar from '../components/TimerBar';
import RivalList from '../components/RivalList';
import GameTail from '../components/GameTail';
import { RaiseSheet } from '../components/RaiseControls';
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
  settingsOpen,
  turnDurationMs,
  turnRemainingMs,
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
  const { phase, activePlayer, handOver, streetPending, displayedPot, potEmpty, potAwarded } = view;

  return (
    <Screen>
      <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto_1fr] overflow-y-auto px-[0.875rem]">
        <div className="flex flex-col self-start pt-[calc(0.75rem+env(safe-area-inset-top))] [@media(max-height:700px)]:pt-[calc(0.375rem+env(safe-area-inset-top))]">
          <div className="flex items-start justify-between gap-3 pb-1">
            <div className="pointer-events-none min-w-0 flex-1">
              <ActionLog compact state={state} winnerName={view.winnerLog?.name} winnerHand={view.winnerLog?.hand} winnerIsHuman={view.winnerLog?.isHuman} />
            </div>
            <SettingsButton onClick={onOpenSettings} inline />
          </div>

          <div className="pt-2">
            <RivalList
              state={state}
              view={view}
              rivalTurn={rivalTurn}
              settingsOpen={settingsOpen}
              compact
              containerClassName="flex flex-wrap justify-center gap-2"
              itemGapClassName="gap-1.5"
              showdownClassName="flex min-h-[5.5rem] flex-col items-center gap-1.5"
              showdownSize="sm"
            />
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
            isDimmed={view.isDimmed}
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
              <TimerBar key={`${state.handNumber}-${phase}`} remainingMs={turnRemainingMs} durationMs={turnDurationMs} className="mx-2" paused={settingsOpen} />
            )}
          </div>
        </div>
      </div>

      <GameTail
        state={state}
        gameOverModal={gameOverModal}
        onRestart={onRestart}
        onSelectDifficulty={onSelectDifficulty}
        onHome={onHome}
        gameOverRestartLabel={gameOverRestartLabel}
        gameOverRestartDisabled={gameOverRestartDisabled}
        gameOverWaitingLabel={gameOverWaitingLabel}
        potAward={potAward}
        onPotAwardLanded={onPotAwardLanded}
        onPotAwardDone={onPotAwardDone}
        overlays={overlays}
        raiseSheet={
          <RaiseSheet
            open={raise.show && activePlayer === 0 && !handOver}
            onClose={raise.onClose}
            raiseAmount={raise.amount}
            onRaiseChange={raise.onChange}
            onRaise={raise.onRaise}
            minRaise={raise.minRaise}
            maxRaise={raise.maxRaise}
            potSize={raise.potSize}
            playerChips={raise.playerChips}
            callAmount={raise.callAmount}
            confirmDisabled={raise.confirmDisabled}
            hideAllIn={raise.hideAllIn}
          />
        }
        tutorialCoach={isTutorial ? (
          <TutorialCoach
            key={tutorial.run}
            state={state}
            onFinish={tutorial.onFinish}
            onRestart={tutorial.onRestart}
            onResume={tutorial.onResume}
            onRaisePanel={tutorial.onRaisePanel}
            onExpectedAction={tutorial.onExpectedAction}
            raiseOpen={raise.show}
            onPause={tutorial.onPause}
          />
        ) : undefined}
      />
    </Screen>
  );
};

export default MobileGameLayout;
