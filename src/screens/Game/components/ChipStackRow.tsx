import React from 'react';
import ChipIcon from '../../../components/ChipIcon';
import DeltaLine from './DeltaLine';

/**
 * Fila de fichas de un asiento (icono, total o ALL-IN y delta de la mano),
 * compartida por el asiento humano y los rivales. `variant` ajusta la
 * disposición del delta y los tamaños.
 */
const ChipStackRow: React.FC<{
  variant: 'inline' | 'below';
  /** Colores invertidos sobre fondo claro (ganador). */
  filled: boolean;
  allIn: boolean;
  chips: number;
  delta: number;
  /** Clases de tamaño del icono de ficha (por defecto `size-5`). */
  iconClassName?: string;
}> = ({ variant, filled, allIn, chips, delta, iconClassName = 'size-5' }) => {
  const icon = (
    <span data-chips className="inline-flex">
      <ChipIcon className={`${iconClassName} ${filled ? 'text-ink' : 'text-bone'}`} />
    </span>
  );

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-0.5">
        {icon}
        {allIn ? (
          <span className={`font-display font-bold text-fs-300 ${filled ? 'text-danger-bone' : 'text-danger'}`}>ALL-IN</span>
        ) : (
          <span className={`font-display font-bold tabular-nums text-fs-300 ${chips < 100 && !filled ? 'text-danger' : ''}`}>{chips}</span>
        )}
        <DeltaLine amount={delta} filled={filled} className="ml-1" />
      </div>
    );
  }

  return (
    <div className="relative flex w-full items-center justify-center gap-0.5 py-2">
      {icon}
      <div className="relative">
        {allIn ? (
          <span className={`flex h-5 items-center font-display font-bold text-fs-200 ${filled ? 'text-danger-bone' : 'text-danger'}`}>ALL-IN</span>
        ) : (
          <span className={`flex leading-2.5 items-center whitespace-nowrap font-display font-bold tabular-nums text-fs-200 ${chips < 100 && !filled ? 'text-danger' : ''}`}>{chips}</span>
        )}
        <div className="absolute left-3 md:left-4 top-full md:mt-1 -translate-x-1/2">
          <DeltaLine amount={delta} filled={filled} className="whitespace-nowrap" />
        </div>
      </div>
    </div>
  );
};

export default ChipStackRow;
