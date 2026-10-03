import React from 'react';
import type { Rank } from '../types';
import { rankFor } from '../types';

interface RankBadgeProps {
  points?: number;
  rank?: Rank;
  compact?: boolean;
}

const RankBadge: React.FC<RankBadgeProps> = ({
  points = 0,
  rank,
  compact = false,
}) => {
  const r = rank ?? rankFor(points);
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-[0.3125rem] border border-current rounded-pill font-display font-bold text-fs-100 tracking-[0.14em] uppercase leading-none">
      <span className="rank-roman">{r.roman}</span>
      {!compact && <span>{r.name}</span>}
    </span>
  );
};

export default RankBadge;
