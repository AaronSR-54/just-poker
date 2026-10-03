import React from 'react';

const Watermark: React.FC = () => (
  <div className="pointer-events-none absolute inset-0 -z-10 flex select-none items-center justify-center" aria-hidden="true">
    <img
      src="/logo-mark.svg"
      alt=""
      className="h-[120vh] w-[120vh] opacity-[0.012] [filter:blur(20px)_grayscale(1)_brightness(2)]"
    />
  </div>
);

export default Watermark;
