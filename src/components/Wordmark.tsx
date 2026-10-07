import React from 'react';

interface WordmarkProps {
  /** `stack` = marca de dos líneas del hero; `inline` = barra superior. */
  layout?: 'inline' | 'stack';
  className?: string;
}

/**
 * Marca "Just Poker": «Just» en bold y «Poker» en light itálica. El tamaño,
 * el tracking y el uppercase los decide quien la usa vía `className`, para
 * reutilizarla a distintas escalas (hero, barra superior, assets de tienda).
 */
const Wordmark: React.FC<WordmarkProps> = ({ layout = 'inline', className = '' }) => {
  if (layout === 'stack') {
    return (
      <div className={`font-display font-bold ${className}`}>
        <div className="pl-[0.4rem] text-[0.85em]">Just</div>
        <div className="text-[0.9em]">
          <em className="font-light italic tracking-normal">Poker</em>
        </div>
      </div>
    );
  }

  return (
    <span className={`font-display font-bold ${className}`}>
      Just <em className="font-light italic tracking-normal">Poker</em>
    </span>
  );
};

export default Wordmark;
