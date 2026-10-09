const handDesc = {
  0: 'No combination: the highest card wins.',
  1: 'Two cards of the same rank.',
  2: 'Two different pairs.',
  3: 'Three cards of the same rank.',
  4: 'Five consecutive cards of different suits.',
  5: 'Five cards of the same suit, in any order.',
  6: 'Three of a kind plus a pair.',
  7: 'Four cards of the same rank.',
  8: 'Five consecutive cards of the same suit.',
  9: 'A, K, Q, J and 10 of the same suit. The best possible hand.',
} as Record<number, string>;

export default handDesc;
