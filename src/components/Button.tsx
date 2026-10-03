import React from 'react';
import type { ButtonVariant, ButtonSize } from '../types';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  glow?: boolean;
  as?: React.ElementType;
  children: React.ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 min-h-12 px-[1.375rem] py-[0.875rem] ' +
  'rounded-[0.875rem] font-display font-bold text-fs-200 tracking-[0.12em] uppercase ' +
  'border-[1.5px] cursor-pointer select-none whitespace-nowrap ' +
  'transition-[translate,border-color,background-color,color,filter] duration-[240ms] ease-brand ' +
  'focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone ' +
  'disabled:opacity-35 disabled:cursor-not-allowed';

const variants: Record<ButtonVariant, string> = {
  outline: 'border-bone/40 text-ink enabled:hover:border-bone enabled:hover:translate-x-2 enabled:active:translate-x-0',
  primary:
    'border-bone bg-bone text-ink enabled:hover:brightness-[1.08] enabled:hover:translate-x-2 enabled:active:translate-x-0',
  ghost:
    'border-transparent text-ink enabled:hover:text-ink enabled:hover:opacity-80 enabled:hover:translate-x-2 enabled:active:translate-x-0',
};

const sizes: Record<Exclude<ButtonSize, ''>, string> = {
  sm: 'min-h-9 px-[0.875rem] py-[0.625rem] text-fs-100',
  lg: 'min-h-14 px-7 py-[1.125rem] text-fs-300',
};

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'outline',
  size = '',
  block = false,
  disabled = false,
  glow = false,
  as: As = 'button',
  className,
  ...rest
}) => {
  const cls = [
    base,
    variants[variant] ?? variants.outline,
    size ? sizes[size] : '',
    block ? 'w-full' : '',
    glow ? 'shadow-[0_0_0_6px_rgba(205,197,183,0.18)]' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <As className={cls} disabled={disabled} {...rest}>
      {children}
    </As>
  );
};

export default Button;
