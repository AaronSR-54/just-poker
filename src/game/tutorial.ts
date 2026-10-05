import type { Card, CardRank, Suit } from '../types';
import type { PokerState } from './poker';
import { createDeck } from './deck';

/**
 * Mazo ordenado para la mano guiada. Garantiza una partida determinista y
 * didáctica: el jugador recibe una pareja de ases, liga un trío en el flop y
 * gana en el showdown. El orden de reparto es el que usa `PokerGame.startHand`
 * (rival 1 → rival 2 → rival 3 → jugador → quemada → flop → turn → river).
 */
export function buildTutorialDeck(): Card[] {
  const used = new Set<string>();
  const card = (rank: CardRank, suit: Suit): Card => {
    used.add(`${rank}${suit}`);
    return { rank, suit };
  };

  const scripted: Card[] = [
    card('7', 'c'), card('7', 'd'), // Mia: pareja de sietes
    card('K', 'd'), card('J', 's'), // Dan: carta alta
    card('9', 'c'), card('9', 'h'), // Sam: pareja de nueves
    card('A', 's'), card('A', 'h'), // Tú: pareja de ases
    card('3', 's'), // quemada
    card('A', 'd'), card('8', 'h'), card('2', 'h'), // flop (trío de ases)
    card('4', 's'), // quemada
    card('5', 'h'), // turn
    card('6', 's'), // quemada
    card('Q', 'c'), // river
  ];

  const rest = createDeck().filter(c => !used.has(`${c.rank}${c.suit}`));
  return [...scripted, ...rest];
}

/**
 * En la mano guiada los rivales siempre pasan o igualan (nunca se retiran ni
 * suben) para que la mano llegue siempre al showdown y se puedan explicar
 * todas las calles.
 */
export function tutorialAIAction(
  state: PokerState,
  playerIndex: number,
): { type: 'check' | 'call' } {
  const player = state.players[playerIndex];
  const maxBet = Math.max(0, ...state.players.map(p => p.bet));
  return player.bet >= maxBet ? { type: 'check' } : { type: 'call' };
}
