import React from 'react';
import { motion } from 'framer-motion';
import PokerCard from '../../../components/PokerCard';
import HandLabel from './HandLabel';
import { t as motionT } from '../../../animations/motion';
import type { CardRank, Suit } from '../../../types';

/** Cartas del jugador humano con la etiqueta de su jugada. */
const HumanCards: React.FC<{
  cards: { rank: CardRank; suit: Suit }[];
  handName: string;
  isWinner: boolean;
  dimmed: boolean;
  size: 'md' | 'lg';
  isDimmed: (card: { rank: CardRank; suit: Suit }) => boolean;
  handNumber: number;
}> = ({ cards, handName, isWinner, dimmed, size, isDimmed, handNumber }) => (
  <div data-tour="human-cards" className="flex flex-col items-center gap-1">
    <HandLabel name={handName} winner={isWinner} />
    {cards.length > 0 && (
      <div className="flex gap-2">
        {cards.map((c, i) => (
          <motion.div
            key={`${handNumber}-${i}`}
            initial={{ opacity: 0, y: -28, rotate: -7 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={motionT(0.42, 0.08 * i)}
          >
            <PokerCard
              size={size}
              rank={c.rank}
              suit={c.suit}
              dimmed={dimmed || isDimmed({ rank: c.rank, suit: c.suit })}
            />
          </motion.div>
        ))}
      </div>
    )}
  </div>
);

export default HumanCards;
