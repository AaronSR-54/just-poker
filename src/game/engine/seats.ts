import type { PokerPlayer } from './types';

/** Índice del siguiente jugador vivo (no eliminado) a partir de `from`. */
export function nextAlive(players: PokerPlayer[], from: number): number {
  let i = from;
  do {
    i = (i + 1) % players.length;
  } while (players[i].eliminated);
  return i;
}

export function smallBlindIndex(players: PokerPlayer[], dealer: number): number {
  const alive = players.filter(p => !p.eliminated).length;
  return alive === 2 ? dealer : nextAlive(players, dealer);
}

export function bigBlindIndex(players: PokerPlayer[], dealer: number): number {
  const alive = players.filter(p => !p.eliminated).length;
  return alive === 2 ? nextAlive(players, dealer) : nextAlive(players, smallBlindIndex(players, dealer));
}

/** Coloca las ciegas pequeña y grande de la mano actual. */
export function postBlinds(
  players: PokerPlayer[],
  committed: number[],
  smallBlind: number,
  bigBlind: number,
  dealer: number
): void {
  const sb = players[smallBlindIndex(players, dealer)];
  const sbActual = Math.min(smallBlind, sb.chips);
  sb.chips -= sbActual;
  sb.bet = sbActual;
  committed[sb.id] += sbActual;
  sb.lastAction = 'Ciega pequeña';
  if (sb.chips === 0) sb.isAllIn = true;

  const bb = players[bigBlindIndex(players, dealer)];
  const bbActual = Math.min(bigBlind, bb.chips);
  bb.chips -= bbActual;
  bb.bet = bbActual;
  committed[bb.id] += bbActual;
  bb.lastAction = 'Ciega grande';
  if (bb.chips === 0) bb.isAllIn = true;
}

/** Índices vivos y no retirados. */
export function activeNotFolded(players: PokerPlayer[]): number[] {
  return players
    .map((_, i) => i)
    .filter(i => !players[i].eliminated && !players[i].folded);
}

/** Índices vivos, no retirados y capaces de actuar (no all-in). */
export function playersWhoCanAct(players: PokerPlayer[]): number[] {
  return activeNotFolded(players).filter(i => !players[i].isAllIn);
}

export function maxBet(players: PokerPlayer[]): number {
  return Math.max(0, ...players.map(p => p.bet));
}
