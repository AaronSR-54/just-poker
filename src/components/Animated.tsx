import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { EASE_OUT, container, fadeUp, t } from '../animations/motion';

interface FadeInProps extends HTMLMotionProps<'div'> {
  /** Retardo en segundos. */
  delay?: number;
  /** Desplazamiento vertical inicial. */
  offset?: number;
  children: React.ReactNode;
}

/** Entrada suave y reutilizable (fade + desplazamiento). */
export const FadeIn: React.FC<FadeInProps> = ({
  delay = 0,
  offset = 14,
  className,
  children,
  ...rest
}) => (
  <motion.div
    initial={{ opacity: 0, y: offset }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -offset * 0.6 }}
    transition={t(0.34, delay, EASE_OUT)}
    className={className}
    {...rest}
  >
    {children}
  </motion.div>
);

interface StaggerProps extends HTMLMotionProps<'div'> {
  /** Separación entre hijos. */
  stagger?: number;
  delay?: number;
  children: React.ReactNode;
}

/** Contenedor que escalona la entrada de sus hijos. */
export const Stagger: React.FC<StaggerProps> = ({
  stagger = 0.06,
  delay = 0,
  className,
  children,
  ...rest
}) => (
  <motion.div
    variants={container(stagger, delay)}
    initial="hidden"
    animate="visible"
    className={className}
    {...rest}
  >
    {children}
  </motion.div>
);

/** Hijo de `Stagger`. */
export const StaggerItem: React.FC<HTMLMotionProps<'div'>> = ({ className, children, ...rest }) => (
  <motion.div variants={fadeUp} className={className} {...rest}>
    {children}
  </motion.div>
);
