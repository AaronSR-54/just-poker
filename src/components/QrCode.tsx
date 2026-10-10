import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QrCodeProps {
  /** Contenido a codificar (normalmente el enlace de invitación). */
  value: string;
  size?: number;
  className?: string;
  /** Texto accesible que describe el QR. */
  label?: string;
}

/** `qrcode` solo acepta hex; convierte `rgb(r g b)` / `rgb(r, g, b)` a `#rrggbb`. */
function toHex(css: string): string | undefined {
  const m = css.match(/rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
  if (m) {
    const h = (n: string) => Number(n).toString(16).padStart(2, '0');
    return `#${h(m[1])}${h(m[2])}${h(m[3])}`;
  }
  return css.startsWith('#') ? css : undefined;
}

/** Genera un QR de un enlace de invitación sobre un canvas. */
const QrCode: React.FC<QrCodeProps> = ({ value, size = 180, className, label }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Usa los tokens del tema para el contraste del QR.
    const styles = getComputedStyle(document.documentElement);
    const dark = toHex(styles.getPropertyValue('--color-ink').trim());
    const light = toHex(styles.getPropertyValue('--color-bone').trim());
    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 1,
      color: { dark: dark ?? '#000000', light: light ?? '#ffffff' },
    })
      .then(() => {
        // `qrcode` fija el tamaño de visualización con un estilo en línea que
        // pisa las utilidades; lo cedemos a estas (p. ej. `size-6`) dejando el
        // lienzo a alta resolución.
        canvas.style.width = '';
        canvas.style.height = '';
      })
      .catch(() => {
        // Si el lienzo falla, no hay nada que mostrar.
      });
  }, [value, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={label ?? value}
    />
  );
};

export default QrCode;
