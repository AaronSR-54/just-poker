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
}> = ({
  settingsOpen,
  onCloseSettings,
  onTutorial,
  onHandsGuide,
  onLeave,
}) => {
  return (
    <AnimatePresence>
      {settingsOpen && (
        <GameSettings
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
