import React from 'react';
import { motion } from 'framer-motion';
import { t as motionT } from '../../../animations/motion';

/** Delta de fichas ganadas/gastadas en la mano, mostrado bajo el total del jugador. */
const DeltaLine: React.FC<{ amount: number; filled?: boolean; className?: string }> = ({ amount, filled = false, className = '' }) => {
  const color = amount > 0
    ? (filled ? 'text-success-bone' : 'text-success')
    : (filled ? 'text-danger-bone' : 'text-danger');
  return (
    <div className={`flex items-center justify-center leading-none ${className}`}>
      {amount !== 0 && (
        <motion.span
          key={amount}
          initial={{ opacity: 0, y: amount > 0 ? 6 : -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={motionT(0.24)}
          className={`font-display font-bold text-fs-100 ${color}`}
        >
          {amount > 0 ? `+${amount}` : `−${Math.abs(amount)}`}
        </motion.span>
      )}
    </div>
  );
};

export default DeltaLine;
