import React from 'react';

export type PositionRole = 'dealer' | 'sb' | 'bb';

interface PositionChipProps {
  role: PositionRole;
  filled?: boolean;
  className?: string;
}

const LABELS: Record<PositionRole, string> = {
  dealer: 'D',
  sb: 'SB',
  bb: 'BB',
};

// Monocromo (bone/ink) para integrarse con el estilo editorial de la app.
// El dealer es el botón sólido; las ciegas se diferencian por intensidad del fondo.
const ON_DARK: Record<PositionRole, string> = {
  dealer: 'bg-bone text-ink',
  sb: 'bg-blind-sb text-bone',
  bb: 'bg-blind-bb text-ink',
};

const ON_LIGHT: Record<PositionRole, string> = {
  dealer: 'bg-ink text-bone',
  sb: 'bg-blind-sb text-bone',
  bb: 'bg-blind-bb text-ink',
};

/** Chip de posición abreviado (BTN/SB/BB) para encajar en la card de jugador. */
const PositionChip: React.FC<PositionChipProps> = ({ role, filled = false, className = '' }) => (
  <span
    className={`inline-flex shrink-0 items-center rounded-pill px-1.5 py-px font-display font-bold text-fs-100 leading-none tracking-[0.08em] uppercase max-md:px-1 max-md:tracking-[0.06em] ${
      filled ? ON_LIGHT[role] : ON_DARK[role]
    } ${className}`}
  >
    {LABELS[role]}
  </span>
);

export default PositionChip;
