import React from 'react';
import { useSettingsStore } from '../store/settingsStore';

/** Opacidad base del patrón y cuánto sube al máximo de intensidad CRT. */
const BASE_OPACITY = 0.012;
const CRT_OPACITY_BOOST = 0.025;

/**
 * Fondo global de la aplicación: un patrón muy sutil con los cuatro palos
 * (public/suits/pattern.svg) enmascarado por un rombo difuminado, de modo que
 * el patrón solo se ve dentro del rombo y sus bordes se desenfocan hasta
 * desaparecer antes de llegar a los límites de la pantalla (así no se nota el
 * corte con la barra de estado nativa en Android). Se monta una sola vez en App
 * para que esté presente en todas las pantallas sin competir con el contenido.
 * La opacidad sube con la intensidad del efecto CRT.
 */
const Background: React.FC = () => {
  const crtAmount = useSettingsStore((s) => s.crtAmount);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden" aria-hidden="true">
      <div
        className="absolute -inset-2 bg-repeat [filter:blur(2px)] [--jp-mask-w:100%] max-md:[--jp-mask-w:200%]"
        style={{
          opacity: BASE_OPACITY + crtAmount * CRT_OPACITY_BOOST,
          backgroundImage: "url('/suits/pattern.svg')",
          backgroundSize: 'clamp(130px, 18vw, 200px) clamp(130px, 18vw, 200px)',
          backgroundPosition: 'center',
          maskImage: "url('/logo-mask.svg')",
          WebkitMaskImage: "url('/logo-mask.svg')",
          maskMode: 'alpha',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
          maskSize: 'var(--jp-mask-w) 100%',
          WebkitMaskSize: 'var(--jp-mask-w) 100%',
        }}
      />
    </div>
  );
};

export default Background;
