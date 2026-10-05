import React from 'react';
import { useSettingsStore } from '../store/settingsStore';

/** Opacidad base del patrón y cuánto sube al máximo de intensidad CRT. */
const BASE_OPACITY = 0.01;
const CRT_OPACITY_BOOST = 0.02;

/**
 * Fondo global de la aplicación: un patrón muy sutil con los cuatro palos
 * (public/suits/pattern.svg) enmascarado por un rombo difuminado, de modo que
 * el patrón se desvanece suavemente hacia el centro. Se monta una sola vez en
 * App para que esté presente en todas las pantallas sin competir con el
 * contenido. La opacidad sube con la intensidad del efecto CRT.
 */
const Background: React.FC = () => {
  const crtAmount = useSettingsStore((s) => s.crtAmount);

  return (
    <div className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden" aria-hidden="true">
      <div
        className="absolute -inset-2 bg-repeat [filter:blur(3px)]"
        style={{
          opacity: BASE_OPACITY + crtAmount * CRT_OPACITY_BOOST,
          backgroundImage: "url('/suits/pattern.svg')",
          backgroundSize: 'clamp(90px, 14vw, 200px) clamp(90px, 14vw, 200px)',
          backgroundPosition: 'center',
          maskImage: "url('/logo-mask.svg')",
          WebkitMaskImage: "url('/logo-mask.svg')",
          maskMode: 'alpha',
          maskRepeat: 'no-repeat',
          WebkitMaskRepeat: 'no-repeat',
          maskPosition: 'center',
          WebkitMaskPosition: 'center',
          maskSize: '100% 100%',
          WebkitMaskSize: '100% 100%',
        }}
      />
    </div>
  );
};

export default Background;
