import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { motionT } from '../animations/motion';

/** Oscurece todo salvo el ancla, con un anillo sutil alrededor (tokens del tema). */
const SPOTLIGHT_SHADOW = [
  '0 0 0 9999px color-mix(in oklab, var(--color-ink-950) 82%, transparent)',
  'inset 0 0 0 2px color-mix(in oklab, var(--color-bone) 85%, transparent)',
].join(', ');

/** Foco sobre el elemento señalado por el coach. */
const CoachSpotlight: React.FC<{ rect: DOMRect | null; hidden?: boolean }> = ({ rect, hidden = false }) => (
  <AnimatePresence>
    {rect && !hidden && (
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed z-[401] rounded-[14px]"
        initial={false}
        animate={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={motionT(0.3)}
        style={{ boxShadow: SPOTLIGHT_SHADOW }}
      />
    )}
  </AnimatePresence>
);

export default CoachSpotlight;
