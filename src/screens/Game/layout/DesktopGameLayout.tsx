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
import TutorialCoach from '../../../components/TutorialCoach';
import type { GameLayoutProps } from './types';

/** Mesa horizontal para tablet y escritorio (>=768px). */
const DesktopGameLayout: React.FC<GameLayoutProps> = ({
  state,
  view,
  rivalTurn,
  humanCards,
  humanSeatProps,
  actionButtonProps,
  isShort,
  isTablet,
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
      <div className="pointer-events-none fixed left-12 top-[max(1.25rem,env(safe-area-inset-top))] z-40 hidden max-w-[16rem] xl:block">
        <ActionLog state={state} winnerName={view.winnerLog?.name} winnerHand={view.winnerLog?.hand} winnerIsHuman={view.winnerLog?.isHuman} />
      </div>

      <div className="hidden xl:block">
        <SettingsButton onClick={onOpenSettings} />
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto_1fr] px-6 lg:px-12">
        <div className={`flex flex-col self-start ${isShort ? 'pt-1' : 'pt-4'}`}>
          <div className="flex shrink-0 items-start justify-between gap-3 xl:hidden">
            <div className="pointer-events-none min-w-0 flex-1">
              <ActionLog compact state={state} winnerName={view.winnerLog?.name} winnerHand={view.winnerLog?.hand} winnerIsHuman={view.winnerLog?.isHuman} />
            </div>
            <SettingsButton onClick={onOpenSettings} inline />
          </div>

          <RivalList
            state={state}
            view={view}
            rivalTurn={rivalTurn}
            settingsOpen={settingsOpen}
            compact={isShort}
            containerClassName={`flex justify-center ${isShort ? 'mt-1 gap-2' : 'mt-3 gap-3 lg:mt-4 lg:gap-4'}`}
            itemGapClassName="gap-2"
            showdownClassName={`flex flex-col items-center gap-2 ${isShort ? 'min-h-[3.75rem]' : 'min-h-[7.1875rem]'}`}
            showdownSize={isShort ? 'sm' : 'md'}
          />
        </div>

        <div className={isShort ? 'py-1' : 'py-4 lg:py-6'}>
          <CommunityRow
            phase={phase}
            community={state.community}
            pot={displayedPot}
            potAwarded={potEmpty}
            potLocked={potAwarded}
            cardSize={isShort ? 'md' : 'xxl'}
            isDimmed={view.isDimmed}
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

export default DesktopGameLayout;
