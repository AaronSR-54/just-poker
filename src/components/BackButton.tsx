import React from 'react';
import Button from './Button';

interface BackButtonProps {
  onClick: () => void;
  /** `aria-label` ya traducido. */
  label: string;
}

/**
 * Flecha «volver» de la cabecera de pantalla. Antes estaba duplicada en
 * `Local.tsx` y `HandsGuide.tsx`; ahora es la única definición del control.
 */
const BackButton: React.FC<BackButtonProps> = ({ onClick, label }) => (
  <Button
    size="sm"
    variant="ghost"
    className="min-h-0! p-0! text-fs-500! leading-none! text-bone! md:text-fs-700!"
    aria-label={label}
    onClick={onClick}
  >
    ←
  </Button>
);

export default BackButton;
