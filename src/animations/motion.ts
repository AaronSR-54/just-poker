import type { Transition, Variants } from 'framer-motion';

/* ------------------------------------------------------------------ *
 * Base de movimiento compartida
 * ------------------------------------------------------------------ */

export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const EASE_BRAND: [number, number, number, number] = [0.4, 0, 0.2, 1];

export const DUR = {
  fast: 0.16,
  base: 0.28,
  slow: 0.48,
} as const;

/**
 * Escala global de duración de las animaciones. La partida la ajusta según la
 * velocidad de juego; al salir se restablece a 1 para no afectar al resto de la app.
 */
let motionScale = 1;

export const setMotionScale = (scale: number): void => {
  motionScale = scale > 0 ? scale : 1;
};

/** Atajo para transiciones coherentes en toda la app. */
export const motionT = (duration: number = DUR.base, delay = 0, ease = EASE_OUT): Transition => ({
  duration: duration * motionScale,
  delay: delay * motionScale,
  ease,
});

/** Contenedor que reparte la entrada de sus hijos motion. */
export const container = (stagger = 0.06, delayChildren = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

/* ------------------------------------------------------------------ *
 * Variants de entrada
 * ------------------------------------------------------------------ */

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0 },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

/* ------------------------------------------------------------------ *
 * Transiciones (con salida, para AnimatePresence)
 * ------------------------------------------------------------------ */

/** Transición de pantalla: elevación sutil + fundido. */
export const page: Variants = {
  initial: { opacity: 0, y: 14, scale: 0.994 },
  animate: { opacity: 1, y: 0, scale: 1, transition: motionT(0.42, 0, EASE_OUT) },
  exit: { opacity: 0, y: -10, scale: 0.994, transition: motionT(0.22, 0, EASE_BRAND) },
};

/** Cambio lateral direccional (pasos, mesas…). `dir` > 0 avanza. */
export const slideSwap = (dir: number, distance = 32): Variants => ({
  hidden: { opacity: 0, x: dir >= 0 ? distance : -distance },
  visible: { opacity: 1, x: 0, transition: motionT(0.34, 0, EASE_OUT) },
  exit: { opacity: 0, x: dir >= 0 ? -distance : distance, transition: motionT(0.2, 0, EASE_BRAND) },
});
