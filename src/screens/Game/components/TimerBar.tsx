import React from 'react';

const TimerBar: React.FC<{ duration: number; className?: string; paused?: boolean }> = ({ duration, className = '', paused = false }) => (
  <div className={`h-[3px] overflow-hidden rounded-pill bg-bone/10 ${className}`}>
    <div
      className="h-full w-full animate-timer-drain rounded-pill bg-bone"
      style={{ animationDuration: `${duration}ms`, animationPlayState: paused ? 'paused' : 'running' }}
    />
  </div>
);

export default TimerBar;
