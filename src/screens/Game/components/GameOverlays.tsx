import React from 'react';
import GameSettings from '../../../components/GameSettings';

/** Overlays de la partida: ajustes. */
const GameOverlays: React.FC<{
  settingsOpen: boolean;
  onCloseSettings: () => void;
  onTutorial?: () => void;
  onHandsGuide?: () => void;
  onLeave: () => void;
  context?: 'game' | 'online';
}> = ({
  settingsOpen,
  onCloseSettings,
  onTutorial,
  onHandsGuide,
  onLeave,
  context = 'game',
}) => {
  return (
    <GameSettings
      open={settingsOpen}
      context={context}
      onClose={onCloseSettings}
      onTutorial={onTutorial}
      onHandsGuide={onHandsGuide}
      onLeave={onLeave}
    />
  );
};

export default GameOverlays;
