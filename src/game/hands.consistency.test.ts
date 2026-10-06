import { describe, it, expect } from 'vitest';
import { evaluateHand } from './hands';
import type { Card, CardRank, Suit } from '../types';

const RANK_ORDER: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};
const rv = (r: CardRank) => RANK_ORDER[r] || 0;

const RANKS: CardRank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const SUITS: Suit[] = ['s', 'h', 'd', 'c'];

// Oráculo independiente: clave [categoria, ...desempates] que compareHands debe replicar.
function oracle(cards: Card[]): number[] {
  const ranks = cards.map(c => rv(c.rank)).sort((a, b) => b - a);
  const isFlush = cards.every(c => c.suit === cards[0].suit);
  const uniq = [...new Set(ranks)];

  let straightHigh = 0;
  if (uniq.length === 5) {
    if (uniq[0] - uniq[4] === 4) straightHigh = uniq[0];
    else if (uniq[0] === 14 && uniq[1] === 5 && uniq[4] === 2) straightHigh = 5;
  }

  const counts: Record<number, number> = {};
  for (const r of ranks) counts[r] = (counts[r] || 0) + 1;
  const groups = Object.entries(counts)
    .map(([r, ct]) => ({ r: Number(r), ct }))
    .sort((a, b) => b.ct - a.ct || b.r - a.r);
  const countsArr = groups.map(g => g.ct);
  const flat = groups.flatMap(g => Array(g.ct).fill(g.r) as number[]);

  let cat: number;
  if (isFlush && straightHigh) cat = straightHigh === 14 ? 9 : 8;
  else if (countsArr[0] === 4) cat = 7;
  else if (countsArr[0] === 3 && countsArr[1] === 2) cat = 6;
  else if (isFlush) cat = 5;
  else if (straightHigh) cat = 4;
  else if (countsArr[0] === 3) cat = 3;
  else if (countsArr[0] === 2 && countsArr[1] === 2) cat = 2;
  else if (countsArr[0] === 2) cat = 1;
  else cat = 0;

  if (cat === 4 || cat === 8 || cat === 9) {
    const expanded = straightHigh === 5 ? [5, 4, 3, 2, 14] : ranks;
    return [cat, ...expanded];
  }
  return [cat, ...flat];
}

describe('hands — consistencia con oráculo (todas las manos de 5 cartas)', () => {
  it('cada mano produce la misma categoría y orden de desempate', { timeout: 120000 }, () => {
    const deck: Card[] = [];
    for (const s of SUITS) for (const r of RANKS) deck.push({ rank: r, suit: s });

    let mismatches = 0;
    const samples: string[] = [];
    const n = deck.length;
    for (let a = 0; a < n; a++)
      for (let b = a + 1; b < n; b++)
        for (let c = b + 1; c < n; c++)
          for (let d = c + 1; d < n; d++)
            for (let e = d + 1; e < n; e++) {
              const hand = [deck[a], deck[b], deck[c], deck[d], deck[e]];
              const h = evaluateHand(hand, []);
              const key = [h.rank, ...h.cards.map(x => rv(x.rank))];
              const exp = oracle(hand);
              if (key.join(',') !== exp.join(',')) {
                mismatches++;
                if (samples.length < 20)
                  samples.push(`${hand.map(x => x.rank + x.suit).join(' ')} => ${key} vs ${exp}`);
              }
            }

    expect(samples, samples.join('\n')).toHaveLength(0);
    expect(mismatches).toBe(0);
  });
});
