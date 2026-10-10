import { useCallback, useEffect, useRef, useState } from 'react';
import { playSfx } from '../../../audio/sfx';

/**
 * Núcleo de la cuenta atrás del turno: gestiona los segundos restantes, los
 * avisos sonoros y la pausa/reanudación (p. ej. al abrir Ajustes). Al agotarse
 * llama a `onExpire`, que decide qué hacer (aplicar la acción o emitirla).
 *
 * Compartido por la partida local (`useTurnTimer`) y la online (`OnlineGame`).
 */
export function useTurnCountdown({
  active,
  settingsOpen,
  turnDurationMs,
  initialSeconds,
  turnKey,
  onExpire,
}: {
  /** El turno propio está en curso y la cuenta debe correr. */
  active: boolean;
  settingsOpen: boolean;
  turnDurationMs: number;
  initialSeconds: number;
  /** Cambia al pasar de mano/calle para reiniciar la cuenta. */
  turnKey: string | number;
  onExpire: () => void;
}) {
  const [timerSeconds, setTimerSeconds] = useState(initialSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Ms restantes del turno en curso (para reanudar tras una pausa). */
  const remainingMsRef = useRef(turnDurationMs);
  /** Ms restantes capturados al abrir Ajustes; `null` si no hay pausa pendiente. */
  const pausedRemainingRef = useRef<number | null>(null);
  /** `onExpire` fuera de React para no reiniciar el intervalo en cada render. */
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

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
    setTimerSeconds(Math.ceil(totalMs / 1000));
    timerRef.current = setInterval(() => {
      const remainingMs = Math.max(0, totalMs - (Date.now() - startedAt));
      remainingMsRef.current = remainingMs;
      setTimerSeconds(Math.ceil(remainingMs / 1000));
      if (remainingMs > 0) return;

      // Al agotarse el tiempo se resuelve aquí mismo, sin depender de un render
      // posterior (que podía leer un 0 obsoleto).
      stopTimer();
      onExpireRef.current();
    }, 100);
  }, [stopTimer, turnDurationMs]);

  useEffect(() => {
    if (settingsOpen) {
      // Pausa: recuerda el tiempo restante para reanudar exactamente ahí.
      if (active) pausedRemainingRef.current = remainingMsRef.current;
      stopTimer();
      return;
    }
    if (active) {
      const from = pausedRemainingRef.current;
      pausedRemainingRef.current = null;
      startTimer(from ?? undefined);
    } else {
      pausedRemainingRef.current = null;
      stopTimer();
    }
    return stopTimer;
  }, [active, turnKey, settingsOpen, startTimer, stopTimer]);

  // Tic tac en los últimos segundos del turno y aviso al agotarse.
  const lastTimerCue = useRef(-1);
  useEffect(() => {
    if (settingsOpen) return;
    if (timerSeconds === lastTimerCue.current) return;
    lastTimerCue.current = timerSeconds;
    if (timerSeconds === 0) playSfx('time_expire');
    else if (timerSeconds <= 5) playSfx('timer_tick');
  }, [timerSeconds, settingsOpen]);

  return { timerSeconds };
}
