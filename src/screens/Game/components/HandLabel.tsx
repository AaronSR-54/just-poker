import React from 'react';

/** Nombre de la jugada (p. ej. "Color"). Resalta cuando es la mano ganadora. */
const HandLabel: React.FC<{ name: string; winner?: boolean; className?: string }> = ({ name, winner = false, className = '' }) => {
  if (!name) return null;
  if (winner) {
    return (
      <span className={`whitespace-nowrap font-display font-bold text-fs-100 uppercase tracking-[0.04em] text-bone ${className}`}>
        {name}
      </span>
    );
  }
  return (
    <span className={`whitespace-nowrap font-display text-fs-100 uppercase tracking-[0.04em] opacity-70 ${className}`}>{name}</span>
  );
};

export default HandLabel;
