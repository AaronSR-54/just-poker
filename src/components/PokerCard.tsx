import React from 'react';
import type { Suit, CardRank, CardSize } from '../types';

const SUIT_DIR: Record<Suit, string> = {
  s: 'spades',
  h: 'hearts',
  d: 'diamonds',
  c: 'clubs',
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
  if (back) {
    return (
      <img
        src={cardAssets[BACK_KEY]?.default}
        className={`jp-pcard sz-${size}${dimmed ? ' dimmed' : ''}`}
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
      className={`jp-pcard sz-${size}${dimmed ? ' dimmed' : ''}`}
      style={style}
      alt={`${rank} de ${suit}`}
    />
  );
};

export default PokerCard;
