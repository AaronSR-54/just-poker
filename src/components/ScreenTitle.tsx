import React from 'react';

interface ScreenTitleProps {
  /** Parte en cursiva clara. */
  em: string;
  /** Resto del titular. */
  rest: string;
  className?: string;
  /** Coloca la parte en cursiva después del resto (por defecto va primero). */
  emLast?: boolean;
}

/**
 * Titular de pantalla con la receta compartida: una parte en cursiva (`em`) y
 * el resto en negrita, dentro de un `nowrap`. Lo comparten `Local`, `Online` y
 * la Guía de manos.
 */
const ScreenTitle: React.FC<ScreenTitleProps> = ({ em, rest, className, emLast = false }) => (
  <div className={`font-display font-bold tracking-[-0.015em] ${className ?? ''}`}>
    <span className="whitespace-nowrap">
      {emLast ? (
        <>
          {rest} <em className="font-light italic tracking-normal">{em}</em>
        </>
      ) : (
        <>
          <em className="font-light italic tracking-normal">{em}</em> {rest}
        </>
      )}
    </span>
  </div>
);

export default ScreenTitle;
