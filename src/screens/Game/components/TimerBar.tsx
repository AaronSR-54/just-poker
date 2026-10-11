import React from 'react';

/**
 * Barra de tiempo del turno. Es una primitiva dirigida por estado: el ancho
 * refleja la fracción de tiempo restante, de modo que comparte la misma fuente
 * de verdad que la resolución del turno y no puede desincronizarse.
 */
const TimerBar: React.FC<{
  remainingMs: number;
  durationMs: number;
  className?: string;
  paused?: boolean;
}> = ({ remainingMs, durationMs, className = '', paused = false }) => {
  const ratio = durationMs > 0 ? Math.min(1, Math.max(0, remainingMs / durationMs)) : 0;
  return (
    <div className={`h-[3px] overflow-hidden rounded-pill bg-bone/10 ${className}`}>
      <div
        className="h-full rounded-pill bg-bone"
        style={{
          width: `${ratio * 100}%`,
          transition: paused ? 'none' : 'width 120ms linear',
        }}
      />
    </div>
  );
};

export default TimerBar;
