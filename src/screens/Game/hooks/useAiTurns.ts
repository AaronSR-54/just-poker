import { useCallback, useEffect, useRef, useState } from 'react';
import { getActionDelay } from '../../../ai/personalities';
import { getAIAction, type AIPlayer } from '../../../ai/aiPlayer';
import { tutorialAIAction } from '../../../game/tutorial';
import type { PokerGame, PokerState } from '../../../game/poker';

interface RivalTurn {
  playerIndex: number;
  duration: number;
  remainingMs: number;
}

/**
 * Resuelve los turnos de la IA (partida normal y mano guiada) y expone el turno
 * activo para dibujar la barra del rival. El tiempo restante es la fuente de
 * verdad de esa barra y se congela mientras Ajustes está abierto.
 *
 * La velocidad de juego se lee desde un ref para que cambiarla no reinicie la
 * decisión ni el turno en curso.
 */
export function useAiTurns({
  gameRef,
  gameState,
  aiPlayers,
  isTutorial,
  commitState,
  settingsOpen,
  speed,
  turnDurationMs,
  tutorialReady,
  coachPaused,
}: {
  gameRef: { current: PokerGame | null };
  gameState: PokerState | null;
  aiPlayers: AIPlayer[];
  isTutorial: boolean;
  commitState: () => void;
  settingsOpen: boolean;
  speed: number;
  turnDurationMs: number;
  tutorialReady: boolean;
  coachPaused: boolean;
}) {
  const [aiTurn, setAiTurn] = useState<RivalTurn | null>(null);

  const speedRef = useRef(speed);
  speedRef.current = speed;
  const turnDurationRef = useRef(turnDurationMs);
  turnDurationRef.current = turnDurationMs;

  const barTimerRef = useRef<number | null>(null);
  const barRemainingRef = useRef(0);
  const barDurationRef = useRef(0);
  const barKeyRef = useRef<string | null>(null);
  const observedKeyRef = useRef<string | null>(null);

  const clearBar = useCallback(() => {
    if (barTimerRef.current !== null) {
      window.clearInterval(barTimerRef.current);
      barTimerRef.current = null;
    }
  }, []);

  const runBar = useCallback((playerIndex: number, key: string) => {
    if (barKeyRef.current !== key) {
      clearBar();
      barKeyRef.current = key;
      barDurationRef.current = turnDurationRef.current;
      barRemainingRef.current = barDurationRef.current;
    }
    if (barTimerRef.current !== null) return;
    const endsAt = Date.now() + Math.max(0, barRemainingRef.current);
    const tick = () => {
      const remaining = Math.max(0, endsAt - Date.now());
      barRemainingRef.current = remaining;
      setAiTurn({ playerIndex, duration: barDurationRef.current, remainingMs: remaining });
      if (remaining <= 0) clearBar();
    };
    tick();
    barTimerRef.current = window.setInterval(tick, 100);
  }, [clearBar]);

  const freezeBar = useCallback((playerIndex: number) => {
    clearBar();
    setAiTurn({ playerIndex, duration: barDurationRef.current, remainingMs: barRemainingRef.current });
  }, [clearBar]);

  // ---- Turnos de la IA ----
  useEffect(() => {
    const g = gameRef.current;
    if (!g || !gameState || isTutorial) {
      clearBar(); barKeyRef.current = null; setAiTurn(null);
      return;
    }

    const current = gameState.currentPlayer;
    const key = `${gameState.handNumber}-${gameState.phase}-${current}`;
    if (current === 0 || gameState.handOver || gameState.streetPending) {
      clearBar(); barKeyRef.current = null; setAiTurn(null);
      return;
    }

    if (settingsOpen) {
      freezeBar(current);
      return;
    }

    const ai = aiPlayers.find(a => a.playerIndex === current);
    if (!ai) return;

    runBar(current, key);

    const shouldObserve = observedKeyRef.current !== key;
    observedKeyRef.current = key;

    let settled = false;
    const controller = new AbortController();

    const applyAction = (type: string, amount?: number) => {
      if (settled || !gameRef.current) return;
      const currentState = gameRef.current.getState();
      if (currentState.currentPlayer !== current || currentState.handOver) return;
      settled = true;
      if (type === 'fold') gameRef.current.fold(current);
      else if (type === 'check') gameRef.current.check(current);
      else if (type === 'call') gameRef.current.call(current);
      else if (type === 'raise') gameRef.current.raise(current, amount || currentState.minRaise);
      commitState();
    };

    getAIAction(ai, gameState, getActionDelay(ai.personality) * speedRef.current, {
      signal: controller.signal,
      observe: shouldObserve,
    })
      .then((action) => applyAction(action.type, action.amount))
      .catch(() => {});

    // Red de seguridad: si la barra llegara a fallar, el rival nunca se retira;
    // pasa o iguala.
    const safety = window.setTimeout(() => {
      if (settled) return;
      const g2 = gameRef.current;
      if (!g2) return;
      const s = g2.getState();
      if (s.currentPlayer !== current || s.handOver || s.streetPending) return;
      settled = true;
      if (g2.canCheck(current)) g2.check(current);
      else g2.call(current);
      commitState();
    }, turnDurationRef.current);

    return () => { controller.abort(); window.clearTimeout(safety); };
  }, [gameState, aiPlayers, isTutorial, commitState, settingsOpen, gameRef, runBar, freezeBar, clearBar]);

  // ---- Turnos de la IA en la mano guiada: siempre pasa o iguala ----
  useEffect(() => {
    const g = gameRef.current;
    if (!g || !gameState || !isTutorial) return;

    const current = gameState.currentPlayer;
    const key = `tutorial-${gameState.handNumber}-${gameState.phase}-${current}`;
    if (current === 0 || gameState.handOver || gameState.streetPending) {
      clearBar(); barKeyRef.current = null; setAiTurn(null);
      return;
    }

    if (!tutorialReady || coachPaused || settingsOpen) {
      freezeBar(current);
      return;
    }

    const ai = aiPlayers.find(a => a.playerIndex === current);
    const delay = (ai ? getActionDelay(ai.personality) : 800) * speedRef.current;

    runBar(current, key);

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled || !gameRef.current) return;
      const currentState = gameRef.current.getState();
      if (currentState.currentPlayer !== current || currentState.handOver) return;
      const action = tutorialAIAction(currentState, current);
      if (action.type === 'check') gameRef.current.check(current);
      else gameRef.current.call(current);
      commitState();
    }, delay);

    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [gameState, isTutorial, tutorialReady, coachPaused, aiPlayers, commitState, settingsOpen, gameRef, runBar, freezeBar, clearBar]);

  // Limpieza de la barra al desmontar.
  useEffect(() => clearBar, [clearBar]);

  return { aiTurn };
}
