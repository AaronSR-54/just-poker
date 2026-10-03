import React, { useMemo } from 'react';
import type { AvatarSize } from '../types';

interface AvatarProps {
  name: string;
  src?: string;
  size?: AvatarSize;
  ring?: boolean;
  muted?: boolean;
  tone?: string;
  imgClassName?: string;
  style?: React.CSSProperties;
}

const sizes: Record<AvatarSize, string> = {
  24: 'size-6 text-fs-100',
  28: 'size-7 text-fs-100',
  32: 'size-8 text-fs-200',
  36: 'size-9 text-fs-200',
  40: 'size-10 text-fs-300',
  48: 'size-12 text-fs-400',
  56: 'size-14 text-fs-400',
  64: 'size-16 text-fs-600',
  80: 'size-20 text-fs-600',
  120: 'size-[7.5rem] text-fs-800',
};

const Avatar: React.FC<AvatarProps> = ({
  name = '?',
  src,
  size = 40,
  ring = false,
  muted = false,
  tone,
  imgClassName,
  style,
}) => {
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]).join('').toUpperCase() || '?';
  }, [name]);

  const cls = [
    'inline-flex items-center justify-center shrink-0 overflow-hidden rounded-full font-display font-bold',
    'uppercase tracking-normal',
    ring ? 'bg-transparent text-inherit shadow-[0_0_0_1.5px_currentColor]' : 'bg-bone text-ink',
    muted ? 'opacity-35' : '',
    sizes[size] ?? sizes[40],
  ]
    .filter(Boolean)
    .join(' ');

  if (src) {
    return (
      <span className={`${cls} ${ring ? 'bg-transparent' : 'bg-transparent'} relative`} style={style}>
        {!ring && <span className={`absolute inset-0 ${tone ?? 'bg-bone'}`} aria-hidden="true" />}
        <img src={src} alt={name} className={`relative size-full object-cover ${imgClassName ?? ''}`} />
      </span>
    );
  }

  return <span className={cls} style={style}>{initials}</span>;
};

export default Avatar;
