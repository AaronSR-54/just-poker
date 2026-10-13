import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { motionT } from '../animations/motion';

interface AnimatedNumberProps {
  /** Valor final al que contar. */
  value: number;
  /** Duración base (s) antes de aplicar la escala de motion. */
  duration?: number;
  /** Formatea el valor mientras se cuenta. Por defecto, entero redondeado. */
  format?: (n: number) => string;
  className?: string;
}

/**
 * Cuenta desde el valor anterior hasta `value`. Con reducción de movimiento
 * activa muestra el valor final de inmediato. Reutilizable por la clasificación
 * y el resumen del fin de partida.
 */
const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 0.8,
  format = (n) => String(Math.round(n)),
  className,
}) => {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(() => (reduce ? value : 0));
  const fromRef = useRef(0);

  useEffect(() => {
    if (reduce) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }

    const scaledMs = Math.max(0, (motionT(duration).duration as number) * 1000);
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;

    const step = (now: number) => {
      const p = scaledMs <= 0 ? 1 : Math.min(1, (now - start) / scaledMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) {
        raf = requestAnimationFrame(step);
      } else {
        fromRef.current = value;
      }
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration, reduce]);

  return <span className={className}>{format(display)}</span>;
};

export default AnimatedNumber;
