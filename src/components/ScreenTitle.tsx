import React from 'react';

interface ScreenTitleProps {
  /** Parte inicial en cursiva clara. */
  em: string;
  /** Resto del titular. */
  rest: string;
  className?: string;
}

/**
 * Titular de pantalla con la receta de la preparación local: primera parte en
 * cursiva (`em`) y el resto en negrita, dentro de un `nowrap`. Lo comparten
 * `Local` y `Online`.
 */
const ScreenTitle: React.FC<ScreenTitleProps> = ({ em, rest, className }) => (
  <div className={`font-display font-bold leading-[0.94] tracking-[-0.015em] ${className ?? ''}`}>
    <span className="whitespace-nowrap">
      <em className="font-light italic tracking-normal">{em}</em> {rest}
    </span>
  </div>
);

export default ScreenTitle;
