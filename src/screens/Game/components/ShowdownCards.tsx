import React from 'react';
import { motion } from 'framer-motion';
import PokerCard from '../../../components/PokerCard';
import { container, popIn } from '../../../animations/motion';
import type { CardRank, Suit } from '../../../types';

/** Cartas boca arriba de un rival, mostradas debajo de su tarjeta en el showdown. */
const ShowdownCards: React.FC<{
  cards: { rank: CardRank; suit: Suit }[];
  size: 'xs' | 'sm' | 'md';
  isDimmed?: (card: { rank: CardRank; suit: Suit }) => boolean;
}> = ({ cards, size, isDimmed }) => (
  <motion.div
    className="flex justify-center gap-1"
    variants={container(0.07)}
    initial="hidden"
    animate="visible"
  >
    {cards.map((c, i) => (
      <motion.div key={i} variants={popIn}>
        <PokerCard
          size={size}
          rank={c.rank}
          suit={c.suit}
          dimmed={isDimmed?.(c)}
        />
      </motion.div>
    ))}
  </motion.div>
);

export default ShowdownCards;
