import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../animations/motion';

interface SelectableCardProps {
  /** Etiqueta principal de la tarjeta. */
  label: React.ReactNode;
  /** Texto secundario a la derecha (rasgos, descripción corta…). */
  secondary?: React.ReactNode;
  selected?: boolean;
  disabled?: boolean;
  /** Tamaño de la tarjeta: `sm` (móvil/compacto) o `lg` (escritorio). */
  size?: 'sm' | 'lg';
  /** Con `lg`, la tarjeta se estira para llenar el alto de la columna (por defecto). */
  stretch?: boolean;
  /** Apila el subtítulo debajo del título (izquierda) en vez de a la derecha. */
  stacked?: boolean;
  dense?: boolean;
  dataTour?: string;
  onClick?: () => void;
}

const sizes = {
  sm: {
    gap: 'gap-4',
    root: 'rounded-[14px] px-[1.125rem]',
    pad: 'py-4',
    label: 'text-fs-500',
    secondary: 'text-fs-200',
  },
  lg: {
    gap: 'gap-6',
    root: 'rounded-[clamp(0.75rem,2.4cqw,1rem)] px-[4.5cqw]',
    pad: 'py-[4cqw]',
    label: 'text-[clamp(1.5rem,5.5cqw,2.75rem)]',
    secondary: 'text-fs-300 leading-[1.35]',
  },
} as const;

/**
 * Tarjeta seleccionable: etiqueta grande + texto secundario, con estado activo
 * `border-bone bg-bone text-ink`. La comparten la preparación local
 * (`DifficultyCard`) y la entrada de juego con amigos (crear/unirse).
 */
const SelectableCard: React.FC<SelectableCardProps> = ({
  label,
  secondary,
  selected = false,
  disabled = false,
  size = 'sm',
  stretch = true,
  stacked = false,
  dense = false,
  dataTour,
  onClick,
}) => {
  const s = sizes[size];
  return (
    <motion.div
      variants={fadeUp}
      className={['w-full', size === 'lg' ? (stretch ? 'flex-1 min-h-0 @container' : '@container') : ''].join(' ')}
    >
      <button
        type="button"
        aria-pressed={selected}
        disabled={disabled}
        data-tour={dataTour}
        onClick={onClick}
        className={[
          'flex h-full w-full text-left cursor-pointer border-[1.5px]',
          stacked ? 'flex-col items-start gap-1' : `items-center justify-between ${s.gap}`,
          s.root,
          dense ? 'py-3' : s.pad,
          'transition-[background-color,border-color,transform] duration-[240ms] ease-brand',
          'enabled:hover:-translate-y-0.5 enabled:hover:border-bone enabled:active:translate-y-px',
          'disabled:cursor-not-allowed',
          'focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone',
          selected ? 'border-bone bg-bone text-ink' : 'border-bone/40 bg-ink text-bone',
          disabled && !selected ? 'opacity-40' : '',
        ].join(' ')}
      >
        <div className={`min-w-0 font-display font-bold leading-none ${s.label}`}>{label}</div>
        {secondary && (
          <div
            className={[
              'min-w-0 font-body tracking-[0.04em] opacity-70',
              stacked ? 'text-left' : 'text-right',
              s.secondary,
            ].join(' ')}
          >
            {secondary}
          </div>
        )}
      </button>
    </motion.div>
  );
};

export default SelectableCard;
