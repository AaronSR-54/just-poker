import React from 'react';

interface LogoProps {
  className?: string;
}

/**
 * Marca de la app: el rombo bone. Usa el mismo trazado que `public/logo-mark.svg`
 * (no crear uno nuevo) y hereda el color vía `currentColor`, así que se colorea
 * con `text-bone` / `text-ink` desde el consumidor.
 */
const Logo: React.FC<LogoProps> = ({ className }) => (
  <svg viewBox="112 80 288 352" className={className} fill="currentColor" aria-hidden="true">
    <path d="M256 80 L400 256 L256 432 L112 256Z" />
  </svg>
);

export default Logo;
