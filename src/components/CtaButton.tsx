import React from 'react';
import Button from './Button';
import type { ButtonVariant } from '../types';

interface CtaButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Versión compacta (móvil o layouts densos). */
  compact?: boolean;
  dataTour?: string;
  /** Variante visual del botón (por defecto, relleno). */
  variant?: ButtonVariant;
}

/**
 * CTA principal con la receta de la preparación local: texto a la izquierda,
 * flecha a la derecha y extremos totalmente redondeados (forma de píldora). Lo
 * comparten `Local` y la pantalla de juego con amigos.
 */
const CtaButton: React.FC<CtaButtonProps> = ({ children, onClick, disabled = false, compact = false, dataTour, variant = 'primary' }) => (
  <Button
    variant={variant}
    data-tour={dataTour}
    disabled={disabled}
    onClick={onClick}
    className={`justify-between! ${compact ? 'min-h-12!' : 'min-h-14!'}`}
  >
    <span>{children}</span>
    <span className={`font-display font-bold leading-none ${compact ? 'text-fs-400' : 'text-fs-500'}`}>→</span>
  </Button>
);

export default CtaButton;
