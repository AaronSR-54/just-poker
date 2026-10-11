import React from 'react';
import GameOverOverlay from './GameOverOverlay';
import PotAward from '../../../components/PotAward';
import type { PokerState } from '../../../game/poker';
import type { GameLayoutProps } from '../layout/types';

/** Capa final de la mesa (hoja de subida, fin de partida, reparto del bote, overlays y tutorial). */
const GameTail: React.FC<{
  state: PokerState;
  gameOverModal: boolean;
  onRestart: () => void;
  onSelectDifficulty?: () => void;
  onHome: () => void;
  gameOverRestartLabel?: string;
  gameOverRestartDisabled?: boolean;
  gameOverWaitingLabel?: string;
  potAward: GameLayoutProps['potAward'];
  onPotAwardLanded: GameLayoutProps['onPotAwardLanded'];
  onPotAwardDone: GameLayoutProps['onPotAwardDone'];
  overlays: React.ReactNode;
  raiseSheet?: React.ReactNode;
  tutorialCoach?: React.ReactNode;
}> = ({
  state,
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
  raiseSheet,
  tutorialCoach,
}) => (
  <>
    {raiseSheet}

    <GameOverOverlay
      open={gameOverModal}
      state={state}
      onRestart={onRestart}
      onSelectDifficulty={onSelectDifficulty}
      onHome={onHome}
      restartLabel={gameOverRestartLabel}
      restartDisabled={gameOverRestartDisabled}
      waitingLabel={gameOverWaitingLabel}
    />

    {potAward && (
      <PotAward key={potAward.handNumber} data={potAward} onLanded={onPotAwardLanded} onDone={onPotAwardDone} />
    )}

    {overlays}

    {tutorialCoach}
  </>
);

export default GameTail;
