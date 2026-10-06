import React from 'react';
import type { Suit, CardRank, CardSize } from '../types';

const SUIT_DIR: Record<Suit, string> = {
  s: 'spades',
  h: 'hearts',
  d: 'diamonds',
  c: 'clubs',
};

const sizes: Record<CardSize, string> = {
  xs: 'w-[2.125rem] h-12',
  sm: 'w-[min(3rem,13vw)] h-[min(4.25rem,18.4vw)]',
  md: 'w-[min(4rem,16vw)] h-[min(5.625rem,22.4vw)]',
  lg: 'w-[min(5.5rem,20vw)] h-[min(7.75rem,28.2vw)]',
  xl: 'w-[6.875rem] h-[9.625rem]',
  xxl: 'w-[min(8.125rem,15vw)] h-[min(11.375rem,21vw)]',
};

interface PokerCardProps {
  rank?: CardRank;
  suit?: Suit;
  size?: CardSize;
  dimmed?: boolean;
  style?: React.CSSProperties;
}

const cardAssets = import.meta.glob<{ default: string }>(
  '../assets/cards/**/*.svg',
  { eager: true, query: 'url' },
);

function cardSrc(rank: string, suit: Suit): string | undefined {
  return cardAssets[`../assets/cards/${SUIT_DIR[suit]}/${rank}.svg`]?.default;
}

const PokerCard: React.FC<PokerCardProps> = ({ rank, suit, size = 'md', dimmed = false, style }) => {
  const cls = `block shrink-0 box-border rounded-[8%_/_5.714%] bg-bone ${sizes[size]}${dimmed ? ' brightness-40 saturate-50 transition-[filter] duration-300' : ''}`;

  if (!rank || !suit) return null;

  const src = cardSrc(rank, suit);
  if (!src) return null;

  return (
    <img
      src={src}
      className={cls}
      style={style}
      alt={`${rank} de ${suit}`}
    />
  );
};

export default PokerCard;
