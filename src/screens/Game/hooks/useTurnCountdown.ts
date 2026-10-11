import { useCallback, useEffect, useRef, useState } from 'react';
import { playSfx } from '../../../audio/sfx';
import { playHaptic } from '../../../haptics/haptics';

/**
 * Núcleo de la cuenta atrás del turno: gestiona el tiempo restante en
 * milisegundos, los avisos sonoros y la pausa/reanudación (p. ej. al abrir
 * Ajustes). Al agotarse llama a `onExpire`, que decide qué hacer (aplicar la
 * acción o emitirla).
 *
 * El tiempo restante (`remainingMs`) es la única fuente de verdad: la barra
 * visible, los avisos y la resolución del turno se derivan de él. Cambiar la
 * duración del turno (velocidad de juego) reescala el tiempo restante sin
 * reiniciar la cuenta.
 *
 * Compartido por la partida local (`useTurnTimer`) y la online (`OnlineGame`).
 */
export function useTurnCountdown({
  active,
  settingsOpen,
  turnDurationMs,
  turnKey,
  onExpire,
}: {
  /** El turno propio está en curso y la cuenta debe correr. */
  active: boolean;
  settingsOpen: boolean;
  turnDurationMs: number;
  /** Cambia al pasar de mano/calle para reiniciar la cuenta. */
  turnKey: string | number;
  onExpire: () => void;
}) {
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, turnDurationMs));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Ms restantes del turno en curso (para reanudar tras una pausa). */
  const remainingMsRef = useRef(Math.max(0, turnDurationMs));
  /** Duración efectiva actual, leída sin reiniciar el intervalo. */
  const durationRef = useRef(turnDurationMs);
  /** Ms restantes capturados al abrir Ajustes; `null` si no hay pausa pendiente. */
  const pausedRemainingRef = useRef<number | null>(null);
  /** Clave del turno que se pausó, para no reanudar con un tiempo obsoleto. */
  const pausedTurnKeyRef = useRef<string | number | null>(null);
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
    const totalMs = Math.max(0, fromMs ?? durationRef.current);
    const startedAt = Date.now();
    remainingMsRef.current = totalMs;
    setRemainingMs(totalMs);
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, totalMs - (Date.now() - startedAt));
      remainingMsRef.current = remaining;
      setRemainingMs(remaining);
      if (remaining > 0) return;

      // Al agotarse el tiempo se resuelve aquí mismo, sin depender de un render
      // posterior (que podía leer un 0 obsoleto).
      stopTimer();
      onExpireRef.current();
    }, 100);
  }, [stopTimer]);

  /** Clave del turno cuyo temporizador se ha iniciado. No la borra el cleanup
   *  `stopTimer`, así que sobrevive a la pausa y distingue "corría este turno". */
  const startedTurnKeyRef = useRef<string | number | null>(null);

  // Pausa (Ajustes) y reanudación. No depende de la duración: cambiarla no
  // reinicia la cuenta.
  useEffect(() => {
    if (settingsOpen) {
      // Solo se captura el tiempo si el temporizador de ESTE turno ya estaba
      // corriendo. No sirve comprobar `timerRef.current`: el cleanup del efecto
      // anterior (`stopTimer`) se ejecuta antes que este cuerpo y lo pone a null.
      if (active && startedTurnKeyRef.current === turnKey) {
        pausedRemainingRef.current = remainingMsRef.current;
        pausedTurnKeyRef.current = turnKey;
      }
      stopTimer();
      return;
    }
    if (active) {
      const resumeFrom = pausedTurnKeyRef.current === turnKey ? pausedRemainingRef.current : null;
      pausedRemainingRef.current = null;
      pausedTurnKeyRef.current = null;
      startedTurnKeyRef.current = turnKey;
      startTimer(resumeFrom ?? undefined);
    } else {
      pausedRemainingRef.current = null;
      pausedTurnKeyRef.current = null;
      startedTurnKeyRef.current = null;
      stopTimer();
    }
    return stopTimer;
  }, [active, turnKey, settingsOpen, startTimer, stopTimer]);

  // Reescalado al cambiar la duración efectiva (velocidad): conserva la
  // fracción de tiempo restante, en marcha o en pausa, sin reiniciar la cuenta.
  useEffect(() => {
    const previous = durationRef.current;
    durationRef.current = turnDurationMs;
    if (previous === turnDurationMs || previous <= 0 || !active) return;
    if (settingsOpen) {
      if (pausedRemainingRef.current !== null) {
        pausedRemainingRef.current = (pausedRemainingRef.current / previous) * turnDurationMs;
        setRemainingMs(pausedRemainingRef.current);
      }
      return;
    }
    if (!timerRef.current) return;
    startTimer((remainingMsRef.current / previous) * turnDurationMs);
  }, [turnDurationMs, active, settingsOpen, startTimer]);

  // Reinicia el registro de avisos al empezar, pausar o reanudar un turno.
  const lastTimerCue = useRef(-1);
  useEffect(() => {
    lastTimerCue.current = -1;
  }, [turnKey, active, settingsOpen]);

  // Tic tac en los últimos segundos del turno y aviso al agotarse.
  useEffect(() => {
    if (settingsOpen) return;
    const seconds = Math.ceil(remainingMs / 1000);
    if (seconds === lastTimerCue.current) return;
    lastTimerCue.current = seconds;
    if (seconds === 0) {
      playSfx('time_expire');
      playHaptic('expire');
    } else if (seconds <= 5) {
      playSfx('timer_tick');
      playHaptic('tick');
    }
  }, [remainingMs, settingsOpen]);

  return { remainingMs };
}
