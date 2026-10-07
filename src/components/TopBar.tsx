import React from 'react';
import Wordmark from './Wordmark';

interface TopBarProps {
  right?: React.ReactNode;
  dark?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ right, dark = true }) => {
  return (
    <div
      className={`flex items-center justify-between shrink-0 px-8 py-5 border-b font-display font-bold tracking-[0.02em] ${
        dark ? 'border-bone/10 bg-ink text-bone' : 'border-ink/15 text-ink'
      }`}
    >
      <Wordmark layout="inline" className="text-fs-400 uppercase tracking-[0.08em]" />
      <div className="flex items-center gap-3">{right}</div>
    </div>
  );
};

export default TopBar;
