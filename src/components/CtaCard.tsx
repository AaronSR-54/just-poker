import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp } from '../animations/motion';

interface CtaCardProps {
  /** Ocupa altura completa del contenedor de escritorio. */
  fill?: boolean;
  /** Layout móvil (apilado). */
  stacked?: boolean;
  half?: boolean;
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
 * descripción y flecha) en contorno, que se rellena al pasar el cursor. Con
 * partida en curso son dos filas independientes en una columna sin separación:
 * la superior continúa y la inferior inicia una partida nueva. Al pasar el
 * cursor, la fila señalada se rellena (fondo bone) y el contorno pasa a la otra
 * fila. Con partida en curso siempre hay exactamente una fila rellena (la de
 * continuar en reposo, la señalada al pasar el cursor), así la compañera
 * conserva su contorno completo (los cuatro lados) y la unión es una sola línea:
 * sin doble borde y sin aristas abiertas.
 */
export const CtaCard: React.FC<CtaCardProps> = ({
  fill = false,
  stacked = false,
  half = false,
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
  const [hoveredRow, setHoveredRow] = useState<'continue' | 'new' | null>(null);
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

  const rowMotion = 'cursor-pointer transition-[translate,border-color,background-color,color] duration-[240ms] ease-brand hover:translate-x-2 active:translate-x-0 focus-visible:outline-2 focus-visible:-outline-offset-2';
  const filledRow = 'bg-bone text-ink focus-visible:outline-ink';
  const outlineRow = 'bg-transparent text-bone border-[1.5px] border-bone/40 focus-visible:outline-bone';

  // Con partida en curso siempre hay exactamente una fila rellena (la de continuar
  // en reposo, la señalada al pasar el cursor). Sin partida, la fila está en
  // contorno y solo se rellena al pasar el cursor. La unión es una sola línea,
  // así que nunca hay doble borde ni una fila con el contorno abierto.
  const continueFilled = hasGame
    ? hoveredRow !== 'new'
    : hoveredRow === 'continue';
  const continueRow = continueFilled ? filledRow : outlineRow;
  const newRow = hoveredRow === 'new' ? filledRow : outlineRow;

  const arrowEl = <span className={arrowCls}>→</span>;

  const onKeyDown = (e: React.KeyboardEvent, fn: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fn();
    }
  };

  const rowEvents = (key: 'continue' | 'new') => ({
    onMouseEnter: () => setHoveredRow(key),
    onMouseLeave: () => setHoveredRow((r) => (r === key ? null : r)),
  });

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
              {...rowEvents('continue')}
              className={`flex flex-1 flex-col justify-between gap-3 ${radiusTop} ${hPad} ${gameVPad} ${rowMotion} ${continueRow}`}
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
              {...rowEvents('new')}
              className={`flex w-full items-center justify-between gap-4 ${radiusBottom} ${hPad} ${stacked ? 'py-4' : 'py-[1rem]'} font-display font-bold leading-none tracking-[-0.015em] text-fs-500 ${rowMotion} ${newRow}`}
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
            {...rowEvents('continue')}
            className={`flex h-full flex-1 flex-col justify-between gap-3 ${radius} ${hPad} ${vPad} ${rowMotion} ${continueFilled ? filledRow : outlineRow}`}
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
