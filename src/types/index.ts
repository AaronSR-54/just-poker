export type Suit = 's' | 'h' | 'd' | 'c';
export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
export type CardSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
export type AvatarSize = 24 | 28 | 32 | 36 | 40 | 48 | 56 | 64 | 80 | 120;
export type GamePhase = 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';
export type ActionType = 'fold' | 'check' | 'call' | 'raise' | 'blind';
export type TableDifficulty = 'easy' | 'medium' | 'hard';
export type ButtonVariant = 'outline' | 'primary' | 'ghost' | 'outlineFill';
export type ButtonSize = 'sm' | '' | 'lg';
export type RomanNumeral = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';
export type RankName = 'Repartidor' | 'Regular' | 'Afilado' | 'Buscavidas' | 'Tiburón' | 'Leyenda';

export interface Card {
  rank: CardRank;
  suit: Suit;
}

export interface Player {
  id: number;
  name: string;
  avatar: string;
  cards: Card[];
  bet: number;
  folded: boolean;
  isConnected: boolean;
  lastAction?: string;
}

export interface Rank {
  roman: RomanNumeral;
  name: RankName;
  min: number;
  max: number;
}

export interface Action {
  playerIndex: number;
  type: ActionType;
  amount?: number;
  timestamp: number;
}

export const RANKS: Rank[] = [
  { roman: 'I' as const, name: 'Repartidor' as const, min: 0, max: 99 },
  { roman: 'II' as const, name: 'Regular' as const, min: 100, max: 299 },
  { roman: 'III' as const, name: 'Afilado' as const, min: 300, max: 599 },
  { roman: 'IV' as const, name: 'Buscavidas' as const, min: 600, max: 999 },
  { roman: 'V' as const, name: 'Tiburón' as const, min: 1000, max: 1999 },
  { roman: 'VI' as const, name: 'Leyenda' as const, min: 2000, max: Infinity },
];

export function rankFor(points: number): Rank {
  return RANKS.find(r => points >= r.min && points <= r.max) ?? RANKS[0];
}

export const SUITS: Record<Suit, string> = { s: '♠', h: '♥', d: '♦', c: '♣' };
