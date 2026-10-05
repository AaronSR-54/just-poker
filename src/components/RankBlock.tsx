import React from 'react';
import type { Rank } from '../types';

interface RankBlockProps {
  rank: Rank;
}

const RankBlock: React.FC<RankBlockProps> = ({ rank }) => {
  return (
    <div className="flex flex-col items-start gap-1 rounded-card border-[1.5px] border-current bg-ink px-[1.125rem] py-[0.875rem] min-w-[6.875rem]">
      <span className="font-display font-bold text-fs-600 leading-none">{rank.roman}</span>
      <span className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase">{rank.name}</span>
    </div>
  );
};

export default RankBlock;
