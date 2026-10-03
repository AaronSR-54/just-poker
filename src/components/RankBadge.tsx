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
    <span className="jp-rank">
      <span className="rank-roman">{r.roman}</span>
      {!compact && <span>{r.name}</span>}
    </span>
  );
};

export default RankBadge;
