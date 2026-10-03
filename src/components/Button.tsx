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
    'jp-btn',
    variant === 'primary' ? 'primary' : '',
    variant === 'ghost' ? 'ghost' : '',
    size,
    block ? 'block' : '',
    disabled ? 'disabled' : '',
    glow ? 'glow' : '',
    className || '',
  ].filter(Boolean).join(' ');

  return (
    <As className={cls} disabled={disabled} {...rest}>
      {children}
    </As>
  );
};

export default Button;
