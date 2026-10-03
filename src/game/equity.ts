import type { Card } from '../types';
import { evaluateHand, compareHands } from './hands';
import { SUITS_LIST, RANKS_LIST } from './deck';

function cardKey(c: Card): string {
  return `${c.rank}${c.suit}`;
}

function buildDeck(known: Card[]): Card[] {
  const knownSet = new Set(known.map(cardKey));
  const deck: Card[] = [];
  for (const suit of SUITS_LIST) {
    for (const rank of RANKS_LIST) {
      const c: Card = { rank, suit };
      if (!knownSet.has(cardKey(c))) deck.push(c);
    }
  }
  return deck;
}

function shuffleInPlace<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export interface EquityResult {
  winPct: number;
  tiePct: number;
  handName: string;
}

export function calculateEquity(
  holeCards: Card[],
  communityCards: Card[],
  numOpponents: number,
  simulations = 1000
): EquityResult {
  if (holeCards.length < 2) {
    return { winPct: 0, tiePct: 0, handName: '' };
  }

  const myHand = evaluateHand(holeCards, communityCards);
  const known = [...holeCards, ...communityCards];
  const remaining = buildDeck(known);
  const communityNeeded = 5 - communityCards.length;

  let wins = 0;
  let ties = 0;

  for (let sim = 0; sim < simulations; sim++) {
    shuffleInPlace(remaining);

    let idx = 0;
    const simCommunity = [
      ...communityCards,
      ...remaining.slice(idx, idx + communityNeeded),
    ];
    idx += communityNeeded;

    const myResult = evaluateHand(holeCards, simCommunity);

    let bestOpp = { rank: -1, cards: [] as Card[], name: '' };

    for (let opp = 0; opp < numOpponents; opp++) {
      const oppCards = remaining.slice(idx, idx + 2);
      idx += 2;
      const oppResult = evaluateHand(oppCards, simCommunity);
      const cmp = compareHands(oppResult, bestOpp);
      if (cmp > 0) bestOpp = oppResult;
    }

    const finalCmp = compareHands(myResult, bestOpp);
    if (finalCmp > 0) {
      wins++;
    } else if (finalCmp === 0) {
      ties++;
    }
  }

  return {
    winPct: Math.round((wins / simulations) * 100),
    tiePct: Math.round((ties / simulations) * 100),
    handName: myHand.name,
  };
}
