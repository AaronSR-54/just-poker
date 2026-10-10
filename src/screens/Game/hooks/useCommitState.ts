import { useCallback, useEffect, useRef } from 'react';
import type { PokerGame, PokerState } from '../../../game/poker';
import { useSettingsStore, speedFactor } from '../../../store/settingsStore';
import { STREET_DELAY } from '../gameConfig';
import { scheduleStreetResolve } from './streetDelay';

/**
 * Sincroniza el estado de la partida con la UI. Si la ronda acaba de cerrarse
 * (streetPending), mantiene las apuestas en la mesa durante una breve pausa
 * antes de repartir la siguiente calle.
 */
export function useCommitState({
  gameRef,
  setGameState,
}: {
  gameRef: { current: PokerGame | null };
  setGameState: (state: PokerState) => void;
}) {
  const streetTimerRef = useRef<number | null>(null);

  const commitState = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    const s = g.getState();
    setGameState(s);
    if (streetTimerRef.current) {
      window.clearTimeout(streetTimerRef.current);
      streetTimerRef.current = null;
    }
    streetTimerRef.current = scheduleStreetResolve(
      gameRef,
      () => {
        streetTimerRef.current = null;
        const current = gameRef.current;
        if (!current) return;
        setGameState(current.getState());
      },
      STREET_DELAY * speedFactor(useSettingsStore.getState().gameSpeed),
    );
  }, [gameRef, setGameState]);

  useEffect(() => () => {
    if (streetTimerRef.current) window.clearTimeout(streetTimerRef.current);
  }, []);

  return { commitState, streetTimerRef };
}
