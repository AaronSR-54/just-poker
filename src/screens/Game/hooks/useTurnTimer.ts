import { useCallback } from 'react';
import type { PokerGame } from '../../../game/poker';
import { useTurnCountdown } from './useTurnCountdown';

/**
 * Temporizador del turno humano (partida local): cuenta atrás con avisos y, al
 * agotarse, resuelve el turno (check o fold) sobre el motor.
 */
export function useTurnTimer({
  gameRef,
  commitState,
  setShowRaise,
  isTutorial,
  settingsOpen,
  currentPlayerIdx,
  isHandOver,
  currentPhase,
  isStreetPending,
  turnDurationMs,
  initialSeconds,
}: {
  gameRef: { current: PokerGame | null };
  commitState: () => void;
  setShowRaise: (open: boolean) => void;
  isTutorial: boolean;
  settingsOpen: boolean;
  currentPlayerIdx: number | undefined;
  isHandOver: boolean | undefined;
  currentPhase: string | undefined;
  isStreetPending: boolean | undefined;
  turnDurationMs: number;
  initialSeconds: number;
}) {
  const active = !isTutorial && currentPlayerIdx === 0 && !isHandOver && !isStreetPending;

  const onExpire = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    const s = g.getState();
    if (s.currentPlayer !== 0 || s.handOver || s.streetPending) return;
    if (g.canCheck(0)) g.check(0);
    else g.fold(0);
    commitState();
    setShowRaise(false);
  }, [gameRef, commitState, setShowRaise]);

  const { timerSeconds } = useTurnCountdown({
    active,
    settingsOpen,
    turnDurationMs,
    initialSeconds,
    turnKey: `${currentPhase}`,
    onExpire,
  });

  return { timerSeconds };
}
