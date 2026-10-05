import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/settingsStore';

/**
 * Recreación del filtro CRT de Balatro (shaders/CRT.fs) adaptada a la web.
 *
 * El original es un fragment shader de LÖVE; aquí se reproduce lo esencial con
 * un filtro SVG para la aberración cromática y con un overlay CSS animado para
 * scanlines, ruido y viñeta. Parámetros clave del original:
 *  - `crt_intensity`: intensidad global de scanlines/aberración.
 *  - `scanlines`: frecuencia de la retícula de píxel.
 *  - `noise_fac`: grano animado.
 */

/** Ruido animado generado como data URL cada pocos frames (tipo film grain). */
function makeNoise(seed: number, size = 128): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  const image = ctx.createImageData(size, size);
  const data = image.data;
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  for (let i = 0; i < data.length; i += 4) {
    s = (s * 16807) % 2147483647;
    const v = Math.round((s / 2147483647) * 255);
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL();
}

const CrtOverlay: React.FC = () => {
  const amount = useSettingsStore((s) => s.crtAmount);
  const [seed, setSeed] = useState(1);

  useEffect(() => {
    if (amount <= 0) return;
    const id = window.setInterval(() => setSeed((n) => n + 1), 90);
    return () => window.clearInterval(id);
  }, [amount]);

  if (amount <= 0) return null;

  // Parámetros derivados del slider (0..1), inspirados en los uniformes de Balatro.
  const crtIntensity = amount;
  const caOffset = amount * 0.000711; // separación cromática horizontal
  const noiseFac = amount * 0.04;

  return (
    <>
      <svg className="pointer-events-none fixed h-0 w-0" aria-hidden="true">
        <defs>
          <filter
            id="jp-crt"
            colorInterpolationFilters="sRGB"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
            primitiveUnits="objectBoundingBox"
          >
            {/* Aberración cromática horizontal: rojo a la derecha, azul a la izquierda */}
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="red"
            />
            <feOffset in="red" dx={caOffset} dy="0" result="redOff" />
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
              result="green"
            />
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
              result="blue"
            />
            <feOffset in="blue" dx={-caOffset} dy="0" result="blueOff" />
            <feBlend in="redOff" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blueOff" mode="screen" result="rgb" />
          </filter>
        </defs>
      </svg>

      <div className="pointer-events-none fixed inset-0 z-[999] overflow-hidden" aria-hidden="true">
        {/* Scanlines con máscara de píxel (dos ejes) */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,${crtIntensity * 0.1779}) 2px, rgba(0,0,0,${crtIntensity * 0.1779}) 3px)`,
          }}
        />
        {/* Máscara vertical fina (retícula de píxel) */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(to right, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,${crtIntensity * 0.1067}) 2px, rgba(0,0,0,${crtIntensity * 0.1067}) 3px)`,
          }}
        />
        {/* Viñeta sutil */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(130% 130% at 50% 50%, transparent 78%, rgba(0,0,0,${amount * 0.1333}) 100%)`,
          }}
        />
        {/* Grano animado */}
        <div
          className="absolute inset-0"
          style={{
            opacity: noiseFac,
            backgroundImage: `url(${makeNoise(seed)})`,
            backgroundSize: '128px 128px',
            mixBlendMode: 'overlay',
          }}
        />
      </div>
    </>
  );
};

export default CrtOverlay;
