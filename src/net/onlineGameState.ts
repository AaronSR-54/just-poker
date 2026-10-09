// PARKED (Fase 3 — ver ROADMAP.md): utilidades de estado del código online conservado.
import type { PokerState } from '../game/poker';
import { mapIndexToRotated } from './onlineSession';

/** Estado público para difundir: oculta las cartas privadas salvo en showdown. */
export function sanitizeForBroadcast(state: PokerState): PokerState {
  if (state.showdown || state.handOver) {
    return {
      ...state,
      players: state.players.map(p => ({ ...p, cards: [...p.cards] })),
      community: [...state.community],
      winner: state.winner ? [...state.winner] : null,
      winAmounts: [...state.winAmounts],
      actions: [...state.actions],
    };
  }
  return {
    ...state,
    players: state.players.map(p => ({
      ...p,
      cards: [], // ocultar cartas privadas hasta el showdown
    })),
    community: [...state.community],
    winner: state.winner ? [...state.winner] : null,
    winAmounts: [...state.winAmounts],
    actions: [...state.actions],
  };
}

/** Rota el estado para que el asiento propio quede en el índice visual 0. */
export function rotateState(state: PokerState, mySeat: number): PokerState {
  const n = state.players.length;
  const order = Array.from({ length: n }, (_, i) => (mySeat + i) % n);
  const players = order.map(i => ({ ...state.players[i], cards: [...state.players[i].cards] }));
  // Reasignar ids a posiciones rotadas para la UI (id = índice visual)
  const playersUi = players.map((p, i) => ({ ...p, id: i }));
  const map = (idx: number) => mapIndexToRotated(idx, mySeat, n);

  return {
    ...state,
    players: playersUi,
    currentPlayer: map(state.currentPlayer),
    dealer: map(state.dealer),
    winner: state.winner ? state.winner.map(map) : null,
    winAmounts: order.map(i => state.winAmounts[i] ?? 0),
    gameWinner: state.gameWinner !== null ? map(state.gameWinner) : null,
    actions: state.actions.map(a => ({
      ...a,
      playerIndex: map(a.playerIndex),
    })),
    community: [...state.community],
  };
}
