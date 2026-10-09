import { useCallback, useEffect, useRef, useState } from 'react';
import { playSfx } from '../../../audio/sfx';
import type { PokerGame } from '../../../game/poker';

/**
 * Temporizador del turno humano: inicia/detiene la cuenta atrás, emite los
 * avisos sonoros y resuelve el turno (check o fold) al agotarse.
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
  const [timerSeconds, setTimerSeconds] = useState(initialSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Segundos restantes del turno, fuera de React para evitar lecturas obsoletas. */
  const timerSecondsRef = useRef(initialSeconds);
  /** Ms restantes del turno en curso (para reanudar tras una pausa en Ajustes). */
  const remainingMsRef = useRef(turnDurationMs);
  /** Ms restantes capturados al abrir Ajustes; `null` si no hay pausa pendiente. */
  const pausedRemainingRef = useRef<number | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback((fromMs?: number) => {
    stopTimer();
    const totalMs = Math.max(0, fromMs ?? turnDurationMs);
    const startedAt = Date.now();
    remainingMsRef.current = totalMs;
    const totalSeconds = Math.ceil(totalMs / 1000);
    timerSecondsRef.current = totalSeconds;
    setTimerSeconds(totalSeconds);
    timerRef.current = setInterval(() => {
      const remainingMs = Math.max(0, totalMs - (Date.now() - startedAt));
      remainingMsRef.current = remainingMs;
      const seconds = Math.ceil(remainingMs / 1000);
      timerSecondsRef.current = seconds;
      setTimerSeconds(seconds);
      if (remainingMs > 0) return;

      // Al agotarse el tiempo, se resuelve el turno del humano aquí mismo. Así
      // no depende de un render posterior (que podía leer un 0 obsoleto y
      // retirar al jugador nada más empezar su turno).
      stopTimer();
      const g = gameRef.current;
      if (!g) return;
      const s = g.getState();
      if (s.currentPlayer !== 0 || s.handOver || s.streetPending) return;
      if (g.canCheck(0)) g.check(0);
      else g.fold(0);
      commitState();
      setShowRaise(false);
    }, 100);
  }, [stopTimer, commitState, turnDurationMs, gameRef, setShowRaise]);

  useEffect(() => {
    if (isTutorial || currentPlayerIdx === undefined || isHandOver === undefined) return;
    if (settingsOpen) {
      // Pausa: recuerda el tiempo restante para reanudar exactamente ahí.
      if (currentPlayerIdx === 0 && !isHandOver && !isStreetPending) {
        pausedRemainingRef.current = remainingMsRef.current;
      }
      stopTimer();
      return;
    }
    if (currentPlayerIdx === 0 && !isHandOver && !isStreetPending) {
      const from = pausedRemainingRef.current;
      pausedRemainingRef.current = null;
      startTimer(from ?? undefined);
    } else {
      pausedRemainingRef.current = null;
      stopTimer();
    }
    return stopTimer;
  }, [currentPlayerIdx, isHandOver, currentPhase, isStreetPending, startTimer, stopTimer, isTutorial, settingsOpen]);

  // Tic tac en los últimos segundos del turno y aviso al agotarse.
  const lastTimerCue = useRef(-1);
  useEffect(() => {
    if (isTutorial || settingsOpen) return;
    if (timerSeconds === lastTimerCue.current) return;
    lastTimerCue.current = timerSeconds;
    if (timerSeconds === 0) playSfx('time_expire');
    else if (timerSeconds <= 5) playSfx('timer_tick');
  }, [timerSeconds, isTutorial, settingsOpen]);

  return { timerSeconds };
}
