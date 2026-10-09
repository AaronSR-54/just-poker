import React from 'react';
import { AnimatePresence } from 'framer-motion';
import GameSettings from '../../../components/GameSettings';

/** Overlays de la partida: ajustes. */
const GameOverlays: React.FC<{
  settingsOpen: boolean;
  onCloseSettings: () => void;
  onTutorial: () => void;
  onHandsGuide: () => void;
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
    <AnimatePresence>
      {settingsOpen && (
        <GameSettings
          context={context}
          onClose={onCloseSettings}
          onTutorial={onTutorial}
          onHandsGuide={onHandsGuide}
          onLeave={onLeave}
        />
      )}
    </AnimatePresence>
  );
};

export default GameOverlays;
