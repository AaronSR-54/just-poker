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

/** Genera un QR de un enlace de invitación sobre un canvas. */
const QrCode: React.FC<QrCodeProps> = ({ value, size = 180, className, label }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Usa los tokens del tema para el contraste del QR.
    const styles = getComputedStyle(document.documentElement);
    const dark = styles.getPropertyValue('--color-ink').trim();
    const light = styles.getPropertyValue('--color-bone').trim();
    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 1,
      color: { dark: dark || undefined, light: light || undefined },
    }).catch(() => {
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
