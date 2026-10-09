import type { Card, GamePhase, Action as ActionType } from '../../types';

export interface PokerPlayer {
  id: number;
  name: string;
  avatar: string;
  cards: Card[];
  chips: number;
  bet: number;
  folded: boolean;
  isAllIn: boolean;
  eliminated: boolean;
  lastAction: string;
}

export interface PokerState {
  phase: GamePhase;
  players: PokerPlayer[];
  community: Card[];
  pot: number;
  currentPlayer: number;
  dealer: number;
  smallBlind: number;
  bigBlind: number;
  minRaise: number;
  winner: number[] | null;
  winAmounts: number[];
  committed: number[];
  showdown: boolean;
  handOver: boolean;
  gameOver: boolean;
  gameWinner: number | null;
  handNumber: number;
  actions: ActionType[];
  /** Ronda de apuestas completa esperando a repartir la siguiente calle. */
  streetPending: boolean;
}

/** Estado privado completo para persistir/reanudar una partida. */
export interface PokerSaveData {
  players: PokerPlayer[];
  community: Card[];
  currentPlayer: number;
  dealer: number;
  smallBlind: number;
  bigBlind: number;
  phase: GamePhase;
  minRaise: number;
  winner: number[] | null;
  winAmounts: number[];
  actions: ActionType[];
  handOver: boolean;
  gameOver: boolean;
  gameWinner: number | null;
  handNumber: number;
  committed: number[];
  acted: boolean[];
  deck: Card[];
  streetPending: boolean;
}
