import React from 'react';

export type BadgeVariant = 'neutral' | 'warning' | 'info' | 'turn';

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const variants: Record<BadgeVariant, string> = {
  neutral: 'bg-bone/10 text-bone',
  warning: 'bg-danger/20 text-danger',
  info: 'bg-info/15 text-info',
  turn: 'bg-bone/12 text-bone',
};

const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', className, style, children }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-[0.1875rem] rounded-pill font-display font-bold text-fs-100 tracking-[0.08em] uppercase leading-none ${variants[variant]} ${className || ''}`}
      style={style}
    >
      {variant === 'turn' && (
        <span className="size-1.5 rounded-full bg-bone animate-jp-pulse" />
      )}
      {children}
    </span>
  );
};

export default Badge;
