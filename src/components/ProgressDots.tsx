import React from 'react';

interface ProgressDotsProps {
  total: number;
  index: number;
}

const ProgressDots: React.FC<ProgressDotsProps> = ({ total, index }) => {
  return (
    <div className="jp-dots">
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`d ${i === index ? 'on' : ''}`} />
      ))}
    </div>
  );
};

export default ProgressDots;
