import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PokerGame, type PokerState } from '../../../game/poker';
import { PERSONALITIES } from '../../../ai/personalities';
import { createAIPlayer, type AIPlayer } from '../../../ai/aiPlayer';
import { saveGame, loadSavedGame, clearSavedGame } from '../../../game/saveGame';
import { buildTutorialDeck } from '../../../game/tutorial';
import { getDifficulty } from '../gameConfig';

/**
 * Inicializa (nueva partida o reanudar) el motor local y persiste la partida en
 * curso. Devuelve la referencia al juego y el estado expuesto a la UI.
 */
export function useLocalGameInit({
  gameId,
  username,
  setRaiseAmount,
}: {
  gameId: string | undefined;
  username: string;
  setRaiseAmount: (amount: number) => void;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const gameRef = useRef<PokerGame | null>(null);
  const [gameState, setGameState] = useState<PokerState | null>(null);
  const [aiPlayers, setAiPlayers] = useState<AIPlayer[]>([]);

  const isTutorial = gameId === 'guide';
  const isLocal = (!!gameId && gameId.startsWith('local-')) || isTutorial;

  // ---- Inicialización (nueva partida o reanudar) ----
  useEffect(() => {
    if (!isLocal || !gameId) return;

    if (isTutorial) {
      const g = new PokerGame(4, 10, 20, ['Tú', 'Mia', 'Dan', 'Sam']);
      g.setDeck(buildTutorialDeck());
      g.setAutoDeal(false);
      const ais = PERSONALITIES.easy.map((p, i) => createAIPlayer(i + 1, p));
      gameRef.current = g;
      setAiPlayers(ais);
      g.startHand();
      setRaiseAmount(g.getState().minRaise);
      setGameState(g.getState());
      return;
    }

    // Marca la partida como reanudable en la URL para que una recarga (F5) no
    // reparta una partida nueva. `replace` evita ensuciar el historial.
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('continue', '1');
      return next;
    }, { replace: true });

    const shouldResume = searchParams.get('continue') === '1';
    const saved = shouldResume ? loadSavedGame() : null;

    if (saved && saved.gameId === gameId) {
      try {
        const g = PokerGame.deserialize(saved.state);
        g.setAutoDeal(false);
        const personalities = PERSONALITIES[saved.difficulty] ?? PERSONALITIES[getDifficulty(gameId)];
        const ais = personalities.map((p, i) => createAIPlayer(i + 1, p));
        gameRef.current = g;
        setAiPlayers(ais);
        if (g.getState().streetPending) g.resolveStreet();
        const resumed = g.getState();
        setRaiseAmount(resumed.minRaise);
        setGameState(resumed);
        return;
      } catch {
        clearSavedGame();
      }
    }

    const diff = getDifficulty(gameId);
    const personalities = PERSONALITIES[diff];
    const names = [username, ...personalities.map(p => p.name)];
    const g = new PokerGame(4, 10, 20, names);
    g.setAutoDeal(false);
    const ais = personalities.map((p, i) => createAIPlayer(i + 1, p));

    gameRef.current = g;
    setAiPlayers(ais);

    g.startHand();
    clearSavedGame();
    const initial = g.getState();
    setRaiseAmount(initial.minRaise);
    setGameState(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, isLocal]);

  // ---- Persistir la partida en curso ----
  useEffect(() => {
    if (isTutorial || !isLocal || !gameId || !gameState || !gameRef.current) return;
    const humanOut = gameState.handOver && (gameState.players[0].chips <= 0 || gameState.players[0].eliminated);
    if (gameState.gameOver || humanOut) {
      clearSavedGame();
      return;
    }
    saveGame({
      gameId,
      difficulty: getDifficulty(gameId),
      state: gameRef.current.serialize(),
    });
  }, [gameState, isLocal, gameId, isTutorial]);

  return { gameRef, gameState, setGameState, aiPlayers, isTutorial, isLocal };
}
