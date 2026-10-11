import { useCallback, useEffect, useRef } from 'react';
import type { PokerGame, PokerState } from '../../../game/poker';
import { useSettingsStore, speedFactor } from '../../../store/settingsStore';
import { STREET_DELAY } from '../gameConfig';

/**
 * Sincroniza el estado de la partida con la UI. Si la ronda acaba de cerrarse
 * (streetPending), mantiene las apuestas en la mesa durante una breve pausa
 * antes de repartir la siguiente calle.
 *
 * La espera se guarda como instante objetivo: si cambia la velocidad de juego
 * a mitad, se reprograma el tiempo restante en lugar de reiniciarla.
 */
export function useCommitState({
  gameRef,
  setGameState,
}: {
  gameRef: { current: PokerGame | null };
  setGameState: (state: PokerState) => void;
}) {
  const streetTimerRef = useRef<number | null>(null);
  /** Instante (timestamp) en que debe resolverse la calle; `null` si no hay espera. */
  const streetEndsAtRef = useRef<number | null>(null);

  const speed = useSettingsStore((s) => s.gameSpeed);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const cancelStreet = useCallback(() => {
    if (streetTimerRef.current) {
      window.clearTimeout(streetTimerRef.current);
      streetTimerRef.current = null;
    }
    streetEndsAtRef.current = null;
  }, []);

  const scheduleStreet = useCallback((delayMs: number) => {
    streetEndsAtRef.current = Date.now() + delayMs;
    streetTimerRef.current = window.setTimeout(() => {
      streetTimerRef.current = null;
      streetEndsAtRef.current = null;
      const current = gameRef.current;
      if (!current) return;
      current.resolveStreet();
      setGameState(current.getState());
    }, delayMs);
  }, [gameRef, setGameState]);

  const commitState = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    const s = g.getState();
    setGameState(s);
    cancelStreet();
    if (s.streetPending) {
      scheduleStreet(STREET_DELAY * speedFactor(speedRef.current));
    }
  }, [gameRef, setGameState, cancelStreet, scheduleStreet]);

  // Reajusta una espera de calle pendiente cuando cambia la velocidad, sin
  // reiniciarla desde el principio.
  useEffect(() => {
    if (streetEndsAtRef.current === null) return;
    const remaining = streetEndsAtRef.current - Date.now();
    if (streetTimerRef.current) {
      window.clearTimeout(streetTimerRef.current);
      streetTimerRef.current = null;
    }
    if (remaining <= 0) {
      streetEndsAtRef.current = null;
      const current = gameRef.current;
      if (current && current.getState().streetPending) {
        current.resolveStreet();
        setGameState(current.getState());
      }
      return;
    }
    scheduleStreet(remaining);
  }, [speed, gameRef, setGameState, scheduleStreet]);

  useEffect(() => () => {
    if (streetTimerRef.current) window.clearTimeout(streetTimerRef.current);
  }, []);

  return { commitState, streetTimerRef, cancelStreet };
}
