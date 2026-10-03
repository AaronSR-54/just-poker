import React from 'react';

interface ProgressDotsProps {
  total: number;
  index: number;
}

const ProgressDots: React.FC<ProgressDotsProps> = ({ total, index }) => {
  return (
    <div className="flex gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`size-1.5 rounded-full bg-current transition-opacity duration-[240ms] ${
            i === index ? 'opacity-100' : 'opacity-25'
          }`}
        />
      ))}
    </div>
  );
};

export default ProgressDots;
