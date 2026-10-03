import React from 'react';
import type { Rank } from '../types';

interface RankBlockProps {
  rank: Rank;
}

const RankBlock: React.FC<RankBlockProps> = ({ rank }) => {
  return (
    <div className="jp-rank-block">
      <span className="roman">{rank.roman}</span>
      <span className="name">{rank.name}</span>
    </div>
  );
};

export default RankBlock;
