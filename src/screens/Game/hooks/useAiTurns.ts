import { useEffect, useState } from 'react';
import { getActionDelay } from '../../../ai/personalities';
import { getAIAction, type AIPlayer } from '../../../ai/aiPlayer';
import { tutorialAIAction } from '../../../game/tutorial';
import type { PokerGame, PokerState } from '../../../game/poker';

/**
 * Resuelve los turnos de la IA (partida normal y mano guiada) y expone el turno
 * activo para dibujar la barra del rival.
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
  const [aiTurn, setAiTurn] = useState<{ playerIndex: number; duration: number } | null>(null);

  // ---- Turnos de la IA ----
  useEffect(() => {
    const g = gameRef.current;
    if (!g || !gameState || isTutorial) return;
    if (settingsOpen) {
      setAiTurn(null);
      return;
    }

    const current = gameState.currentPlayer;
    if (current === 0 || gameState.handOver || gameState.streetPending) {
      setAiTurn(null);
      return;
    }

    const ai = aiPlayers.find(a => a.playerIndex === current);
    if (!ai) return;

    // El rival decide en el mismo tiempo que a ×1, escalado por la velocidad.
    const delay = getActionDelay(ai.personality) * speed;
    // Su barra dura lo mismo que la del jugador; como decide antes, nunca se agota.
    setAiTurn({ playerIndex: current, duration: turnDurationMs });

    let cancelled = false;
    let settled = false;

    const applyAction = (type: string, amount?: number) => {
      if (settled || cancelled || !gameRef.current) return;
      const currentState = gameRef.current.getState();
      if (currentState.currentPlayer !== current || currentState.handOver) return;
      settled = true;
      if (type === 'fold') gameRef.current.fold(current);
      else if (type === 'check') gameRef.current.check(current);
      else if (type === 'call') gameRef.current.call(current);
      else if (type === 'raise') gameRef.current.raise(current, amount || currentState.minRaise);
      commitState();
    };

    getAIAction(ai, gameState, delay).then((action) => applyAction(action.type, action.amount));

    // Red de seguridad: si la barra llegara a fallar, el rival nunca se retira;
    // pasa o iguala.
    const safety = window.setTimeout(() => {
      if (settled || cancelled) return;
      const g2 = gameRef.current;
      if (!g2) return;
      const s = g2.getState();
      if (s.currentPlayer !== current || s.handOver || s.streetPending) return;
      settled = true;
      if (g2.canCheck(current)) g2.check(current);
      else g2.call(current);
      commitState();
    }, turnDurationMs);

    return () => { cancelled = true; window.clearTimeout(safety); };
  }, [gameState, aiPlayers, isTutorial, commitState, settingsOpen, speed, turnDurationMs, gameRef]);

  // ---- Turnos de la IA en la mano guiada: siempre pasa o iguala ----
  useEffect(() => {
    const g = gameRef.current;
    if (!g || !gameState || !isTutorial || !tutorialReady || coachPaused || settingsOpen) return;

    const current = gameState.currentPlayer;
    if (current === 0 || gameState.handOver || gameState.streetPending) {
      setAiTurn(null);
      return;
    }

    const ai = aiPlayers.find(a => a.playerIndex === current);
    const delay = (ai ? getActionDelay(ai.personality) : 800) * speed;
    // Su barra dura lo mismo que la del jugador; como decide antes, nunca se agota.
    setAiTurn({ playerIndex: current, duration: turnDurationMs });

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
  }, [gameState, isTutorial, tutorialReady, coachPaused, aiPlayers, commitState, settingsOpen, speed, turnDurationMs, gameRef]);

  return { aiTurn };
}
