import React from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../animations/motion';

interface CtaCardProps {
  /** Ocupa altura completa del contenedor de escritorio. */
  fill?: boolean;
  /** Layout móvil (apilado). */
  stacked?: boolean;
  half?: boolean;
  /** Tarjeta recomendada: la fila de continuar se muestra rellena (fondo bone). */
  highlighted?: boolean;
  dataTour?: string;
  /** Acción principal: continuar la partida en curso o empezar una nueva. */
  onClick: () => void;
  /** Etiqueta accesible de la fila principal. */
  label?: string;
  /** Descripción del modo (estado sin partida). */
  hint?: React.ReactNode;
  /** Texto de estado (estado con partida en curso). */
  status?: string;
  /** Contexto resumido de la partida en curso. */
  context?: React.ReactNode;
  /** Acción secundaria: empezar una partida nueva (fila inferior outline). */
  onNewGame?: () => void;
  /** Rótulo de la fila inferior. */
  newGameLabel?: string;
  children: React.ReactNode;
}

/**
 * Tarjeta de modo del menú. Sin partida en curso es una única fila (título,
 * descripción y flecha). Con partida en curso son dos filas independientes en
 * una columna sin separación: la superior continúa (rellena si es la
 * recomendada) y la inferior, en outline, inicia una partida nueva.
 */
export const CtaCard: React.FC<CtaCardProps> = ({
  fill = false,
  stacked = false,
  half = false,
  highlighted = false,
  dataTour,
  onClick,
  label,
  hint,
  status,
  context,
  onNewGame,
  newGameLabel,
  children,
}) => {
  const hasGame = Boolean(status && onNewGame);

  const wrapper = [
    '@container w-full',
    fill ? 'flex-1 min-h-0' : '',
    half ? 'h-[calc((100%-0.75rem)/2)]' : '',
  ].join(' ');

  const radius = stacked ? 'rounded-[0.875rem]' : 'rounded-[clamp(0.75rem,3cqw,1rem)]';
  const radiusTop = stacked ? 'rounded-t-[0.875rem]' : 'rounded-t-[clamp(0.75rem,3cqw,1rem)]';
  const radiusBottom = stacked ? 'rounded-b-[0.875rem]' : 'rounded-b-[clamp(0.75rem,3cqw,1rem)]';
  const hPad = stacked ? 'px-7' : 'px-[7.6cqw]';
  const vPad = stacked ? 'py-6' : 'py-[6.8cqw]';
  const gameVPad = stacked ? 'py-5' : 'py-[4cqw]';
  const titleCls = `font-display font-bold leading-[0.96] tracking-[-0.015em] ${stacked ? 'text-[1.5rem]' : 'text-[clamp(1.75rem,10.5cqw,3.75rem)]'}`;
  const arrowCls = `font-display font-bold leading-none ${stacked ? 'text-[1.5rem]' : 'text-[clamp(1.75rem,7.2cqw,2.5rem)]'}`;

  const filled = 'bg-bone text-ink';
  const dark = 'bg-ink text-bone';
  const rowMotion = 'cursor-pointer transition-[translate,border-color,background-color,color] duration-[240ms] ease-brand hover:translate-x-2 active:translate-x-0 focus-visible:outline-2 focus-visible:-outline-offset-2';
  const continueRow = `${rowMotion} ${highlighted ? 'focus-visible:outline-ink' : 'focus-visible:outline-bone'}`;
  const outlineRow = `${rowMotion} border-[1.5px] border-bone/40 hover:border-bone focus-visible:outline-bone`;
  const legacyRow = `border-[1.5px] ${rowMotion} hover:border-bone ${highlighted ? 'border-bone focus-visible:outline-ink' : 'border-bone/40 focus-visible:outline-bone'}`;

  const arrowEl = <span className={arrowCls}>→</span>;

  const onKeyDown = (e: React.KeyboardEvent, fn: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn();
    }
  };

  return (
    <motion.div variants={fadeUp} className={wrapper}>
      <div className="flex h-full w-full flex-col gap-0">
        {hasGame ? (
          <>
            <div
              role="button"
              tabIndex={0}
              aria-label={label}
              data-tour={dataTour}
              onClick={onClick}
              onKeyDown={(e) => onKeyDown(e, onClick)}
              className={`flex flex-1 flex-col justify-between gap-3 ${radiusTop} ${hPad} ${gameVPad} ${continueRow} ${highlighted ? filled : dark}`}
            >
              <div className={titleCls}>{children}</div>
              <div className="flex items-end justify-between gap-4">
                <div className="min-w-0 flex-1 font-body leading-[1.45] opacity-75">
                  <div className="font-bold">{status}</div>
                  <div>{context}</div>
                </div>
                {arrowEl}
              </div>
            </div>
            <div
              role="button"
              tabIndex={0}
              aria-label={newGameLabel}
              onClick={onNewGame}
              onKeyDown={(e) => onKeyDown(e, onNewGame ?? (() => {}))}
              className={`flex w-full items-center justify-between gap-4 bg-transparent ${radiusBottom} ${hPad} ${stacked ? 'py-4' : 'py-[1rem]'} font-display font-bold leading-none tracking-[-0.015em] text-fs-500 text-bone ${outlineRow}`}
            >
              <span>{newGameLabel}</span>
              <span className="leading-none">→</span>
            </div>
          </>
        ) : (
          <div
            role="button"
            tabIndex={0}
            aria-label={label}
            data-tour={dataTour}
            onClick={onClick}
            onKeyDown={(e) => onKeyDown(e, onClick)}
            className={`flex h-full flex-1 flex-col justify-between gap-3 ${radius} ${hPad} ${vPad} ${legacyRow} ${highlighted ? filled : dark}`}
          >
            <div className={titleCls}>{children}</div>
            <div className="flex items-end justify-between gap-4">
              <div className="min-w-0 flex-1 font-body leading-[1.45] opacity-75">{hint}</div>
              {arrowEl}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CtaCard;
