import React, { useMemo } from 'react';
import type { AvatarSize } from '../types';

interface AvatarProps {
  name: string;
  size?: AvatarSize;
  ring?: boolean;
  muted?: boolean;
  style?: React.CSSProperties;
}

const Avatar: React.FC<AvatarProps> = ({
  name = '?',
  size = 40,
  ring = false,
  muted = false,
  style,
}) => {
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]).join('').toUpperCase() || '?';
  }, [name]);

  const cls = [
    'jp-avatar',
    `sz-${size}`,
    ring ? 'ring' : '',
    muted ? 'muted' : '',
  ].filter(Boolean).join(' ');

  return <span className={cls} style={style}>{initials}</span>;
};

export default Avatar;
