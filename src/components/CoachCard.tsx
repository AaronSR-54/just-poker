import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from './Button';
import { motionT } from '../animations/motion';

interface CoachCardProps {
  visible: boolean;
  /** Cambia al pasar de paso para animar la entrada/salida. */
  stepKey: string;
  panelRef: (node: HTMLDivElement | null) => void;
  position: { top: number; left: number } | null;
  placeBelow: boolean;
  /** Margen por defecto cuando aún no hay posición calculada. */
  edge: number;
  title: React.ReactNode;
  body: React.ReactNode;
  /** Muestra el aviso de «pulsa el elemento resaltado». */
  act: boolean;
  pressLabel: string;
  skipLabel: string;
  onSkip: () => void;
  /** Botón principal (siguiente / terminar); si no se indica, no se muestra. */
  primary?: { label: string; onClick: () => void };
}

/** Tarjeta de explicación del coach (onboarding y tutorial). */
const CoachCard: React.FC<CoachCardProps> = ({
  visible,
  stepKey,
  panelRef,
  position,
  placeBelow,
  edge,
  title,
  body,
  act,
  pressLabel,
  skipLabel,
  onSkip,
  primary,
}) => (
  <AnimatePresence mode="wait">
    {visible && (
      <motion.div
        ref={panelRef}
        key={stepKey}
        initial={{ opacity: 0, y: placeBelow ? -8 : 8, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, transition: motionT(0.14) }}
        transition={motionT(0.26)}
        role="dialog"
        aria-live="polite"
        style={position ? { top: position.top, left: position.left } : { top: edge, left: edge }}
        className="fixed z-[402] max-h-[calc(100dvh-1.5rem)] w-[calc(100%-2rem)] max-w-[26rem] overflow-y-auto rounded-[14px] border border-bone/[0.18] bg-ink px-5 py-4 shadow-xl"
      >
        <div className="font-display font-bold text-fs-500">{title}</div>
        <p className="mt-2 font-body text-fs-200 leading-[1.45] opacity-80">{body}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          {act ? (
            <p className="font-display font-bold text-fs-100 tracking-[0.12em] uppercase text-bone/70">{pressLabel}</p>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onSkip}
              className="cursor-pointer font-body font-bold text-fs-100 uppercase tracking-[0.12em] text-bone/60 underline underline-offset-2 transition-colors duration-[160ms] ease-brand hover:text-bone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bone"
            >
              {skipLabel}
            </button>
            {primary && (
              <Button size="sm" variant="primary" onClick={primary.onClick}>
                {primary.label}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default CoachCard;
