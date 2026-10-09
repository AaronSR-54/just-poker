import React from 'react';

interface PanelProps {
  /** Panel compacto (móvil o layouts densos). */
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * Contenedor de panel de contenido: fondo `ink-900`, esquinas redondeadas y
 * padding. Es el mismo panel que usa la preparación de partida local
 * (`TableDetail`), extraído para reutilizarlo también en la pantalla de juego
 * con amigos.
 */
const Panel: React.FC<PanelProps> = ({ compact = false, className, children }) => (
  <div
    className={[
      'flex flex-col bg-ink-900',
      compact ? 'gap-4 rounded-[12px] p-5' : 'gap-6 rounded-[14px] p-6 sm:gap-8 sm:p-9',
      className ?? '',
    ].join(' ')}
  >
    {children}
  </div>
);

export default Panel;
