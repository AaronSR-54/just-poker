import React from 'react';
import type { ButtonVariant, ButtonSize } from '../types';

type ButtonOwnProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  children: React.ReactNode;
};

type ButtonProps<T extends React.ElementType> = ButtonOwnProps & {
  as?: T;
} & Omit<React.ComponentPropsWithoutRef<T>, keyof ButtonOwnProps | 'as'>;

const base =
  'inline-flex items-center justify-center gap-2 min-h-12 px-[1.375rem] py-[0.875rem] ' +
  'rounded-full font-display font-bold text-fs-200 tracking-[0.12em] uppercase ' +
  'border-[1.5px] cursor-pointer select-none whitespace-nowrap ' +
  'transition-[translate,border-color,background-color,color,filter] duration-[240ms] ease-brand ' +
  'enabled:hover:-translate-y-0.5 enabled:active:translate-y-px ' +
  'focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone ' +
  'disabled:opacity-35 disabled:cursor-not-allowed';

const variants: Record<ButtonVariant, string> = {
  outline: 'border-bone/40 bg-ink text-bone enabled:hover:border-bone',
  primary: 'border-bone bg-bone text-ink enabled:hover:brightness-[1.08]',
  ghost: 'border-transparent bg-ink text-bone enabled:hover:opacity-80',
  outlineFill: 'border-bone/40 bg-ink text-bone enabled:hover:border-bone enabled:hover:bg-bone enabled:hover:text-ink',
};

const sizes: Record<Exclude<ButtonSize, ''>, string> = {
  sm: 'min-h-9 px-[0.875rem] py-[0.625rem] text-fs-100',
  lg: 'min-h-14 px-7 py-[1.125rem] text-fs-300',
};

function Button<T extends React.ElementType = 'button'>({
  children,
  variant = 'outline',
  size = '',
  block = false,
  as,
  className,
  ...rest
}: ButtonProps<T>) {
  const As = (as ?? 'button') as React.ElementType;
  const cls = [
    base,
    variants[variant] ?? variants.outline,
    size ? sizes[size] : '',
    block ? 'w-full' : '',
    className || '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <As className={cls} {...rest}>
      {children}
    </As>
  );
}

export default Button;
