import { useCallback, useState } from 'react';

/** Estado del tutorial guiado y acciones para reiniciarlo o terminarlo. */
export function useTutorialRun({
  restartGame,
  onFinish,
}: {
  restartGame: () => void;
  onFinish: () => void;
}) {
  const [tutorialRun, setTutorialRun] = useState(0);
  const [tutorialReady, setTutorialReady] = useState(false);
  const [coachPaused, setCoachPaused] = useState(false);

  const finishTutorial = useCallback(() => {
    onFinish();
  }, [onFinish]);

  const restartTutorial = useCallback(() => {
    restartGame();
    setTutorialReady(false);
    setTutorialRun(n => n + 1);
  }, [restartGame]);

  return {
    tutorialRun,
    tutorialReady,
    setTutorialReady,
    coachPaused,
    setCoachPaused,
    finishTutorial,
    restartTutorial,
  };
}
