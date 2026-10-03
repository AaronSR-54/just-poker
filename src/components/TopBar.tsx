import React from 'react';

interface TopBarProps {
  right?: React.ReactNode;
  dark?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ right, dark = true }) => {
  return (
    <div
      className={`flex items-center justify-between shrink-0 px-8 py-5 border-b font-display font-bold tracking-[0.02em] ${
        dark ? 'border-bone/10 text-bone' : 'border-ink/15 text-ink'
      }`}
    >
      <div className="font-display font-bold text-fs-400 uppercase tracking-[0.08em]">
        Just <em className="font-light italic tracking-normal">Poker</em>
      </div>
      <div className="flex items-center gap-3">{right}</div>
    </div>
  );
};

export default TopBar;
