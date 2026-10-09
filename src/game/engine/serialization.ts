import type { PokerPlayer, PokerSaveData } from './types';

/** Copia un jugador clonando su mano de cartas. */
export function clonePlayer(p: PokerPlayer): PokerPlayer {
  return { ...p, cards: [...p.cards] };
}

/** Clona en profundidad el estado serializable de una partida. */
export function cloneSaveData(data: PokerSaveData): PokerSaveData {
  return {
    players: data.players.map(clonePlayer),
    community: [...data.community],
    currentPlayer: data.currentPlayer,
    dealer: data.dealer,
    smallBlind: data.smallBlind,
    bigBlind: data.bigBlind,
    phase: data.phase,
    minRaise: data.minRaise,
    winner: data.winner ? [...data.winner] : null,
    winAmounts: [...data.winAmounts],
    actions: [...data.actions],
    handOver: data.handOver,
    gameOver: data.gameOver,
    gameWinner: data.gameWinner,
    handNumber: data.handNumber,
    committed: [...data.committed],
    acted: [...data.acted],
    deck: [...data.deck],
    streetPending: data.streetPending,
  };
}
