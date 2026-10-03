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
  sm: 'w-12 h-[4.25rem]',
  md: 'w-16 h-[5.625rem]',
  lg: 'w-[5.5rem] h-[7.75rem]',
  xl: 'w-[6.875rem] h-[9.625rem]',
  xxl: 'w-[8.125rem] h-[11.375rem]',
};

interface PokerCardProps {
  rank?: CardRank;
  suit?: Suit;
  size?: CardSize;
  back?: boolean;
  dimmed?: boolean;
  style?: React.CSSProperties;
}

const cardAssets = import.meta.glob<{ default: string }>(
  '../assets/cards/**/*.svg',
  { eager: true, query: 'url' },
);

const BACK_KEY = '../assets/cards/back.svg';

function cardSrc(rank: string, suit: Suit): string | undefined {
  return cardAssets[`../assets/cards/${SUIT_DIR[suit]}/${rank}.svg`]?.default;
}

const PokerCard: React.FC<PokerCardProps> = ({ rank, suit, size = 'md', back = false, dimmed = false, style }) => {
  const cls = `block shrink-0 box-border ${sizes[size]}${dimmed ? ' opacity-30 transition-opacity duration-300' : ''}`;

  if (back) {
    return (
      <img
        src={cardAssets[BACK_KEY]?.default}
        className={cls}
        style={style}
        alt="Dorso de carta"
      />
    );
  }

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
