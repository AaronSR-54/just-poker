import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import ChipIcon from './ChipIcon';
import { motionT } from '../animations/motion';

const COUNT = 18;
const TONES = ['text-bone', 'text-bone/80', 'text-bone/65', 'text-success'];
const SIZES = ['size-4', 'size-5', 'size-6'];

interface ChipBurstProps {
  className?: string;
}

/**
 * Ráfaga de fichas para celebrar una victoria. Reutiliza `ChipIcon` y la base de
 * motion; con reducción de movimiento activa muestra unas fichas estáticas.
 */
const ChipBurst: React.FC<ChipBurstProps> = ({ className }) => {
  const reduce = useReducedMotion();

  const chips = useMemo(
    () =>
      Array.from({ length: COUNT }, (_, i) => {
        const angle = (i / COUNT) * Math.PI * 2 + Math.random() * 0.5;
        const distance = 90 + Math.random() * 140;
        return {
          key: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 40,
          rotate: (Math.random() - 0.5) * 240,
          delay: Math.random() * 0.12,
          size: SIZES[i % SIZES.length],
          tone: TONES[i % TONES.length],
        };
      }),
    []
  );

  const wrapper = `pointer-events-none fixed inset-0 z-[500] overflow-hidden ${className ?? ''}`;

  if (reduce) {
    return (
      <div className={wrapper} aria-hidden="true">
        <div className="absolute left-1/2 top-1/4 flex -translate-x-1/2 justify-center gap-2">
          {chips.slice(0, 5).map((c) => (
            <ChipIcon key={c.key} className={`${c.size} ${c.tone}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={wrapper} aria-hidden="true">
      <div className="absolute left-1/2 top-1/4">
        {chips.map((c) => (
          <motion.div
            key={c.key}
            className="absolute"
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4, rotate: 0 }}
            animate={{ x: c.x, y: c.y, opacity: [0, 1, 1, 0], scale: [0.4, 1, 1, 0.75], rotate: c.rotate }}
            transition={motionT(1.1, c.delay)}
          >
            <ChipIcon className={`${c.size} ${c.tone}`} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ChipBurst;
