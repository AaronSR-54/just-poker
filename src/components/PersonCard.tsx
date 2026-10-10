import React from 'react';
import type { AvatarSize } from '../types';
import Avatar from './Avatar';

interface PersonCardProps {
  name: string;
  /** Segunda línea (rasgo, estado, rol…). */
  secondary?: React.ReactNode;
  /** Apodo entrecomillado en itálica junto al nombre. */
  quip?: string;
  avatarSrc?: string;
  avatarTone?: string;
  avatarImgClassName?: string;
  /** Tamaño del avatar; por defecto 40 en compacto y 56. */
  avatarSize?: AvatarSize;
  compact?: boolean;
  /** Contenido a la derecha de la tarjeta (p. ej. un `Badge`). */
  trailing?: React.ReactNode;
  /** Nombre para las iniciales del avatar cuando difiere del nombre visible. */
  avatarName?: string;
  /** Fila atenuada (p. ej. una plaza libre). */
  muted?: boolean;
  /** Nombre en negrita (por defecto). `false` para las filas secundarias. */
  strong?: boolean;
}

/**
 * Fila de persona: `Avatar` + nombre y una línea secundaria, con un hueco
 * opcional a la derecha. Es la tarjeta que usa la preparación de partida local
 * (`RivalCard`) y la lista de jugadores de la sala online.
 */
const PersonCard: React.FC<PersonCardProps> = ({
  name,
  secondary,
  quip,
  avatarSrc,
  avatarTone,
  avatarImgClassName,
  avatarSize,
  compact = false,
  trailing,
  avatarName,
  muted = false,
  strong = true,
}) => (
  <div className={`flex items-center ${compact ? 'gap-3' : 'gap-4'}`}>
    <Avatar
      name={avatarName ?? name}
      src={avatarSrc}
      size={avatarSize ?? (compact ? 40 : 56)}
      tone={avatarTone}
      imgClassName={avatarImgClassName}
      muted={muted}
    />
    <div className={`flex min-w-0 flex-1 flex-col gap-1 ${muted ? 'opacity-50' : ''}`}>
      <div className={`truncate font-display leading-none text-fs-300 ${strong ? 'font-bold' : 'font-normal'}`}>
        {name}
        {quip && <> <em className="font-light italic opacity-80">“{quip}”</em></>}
      </div>
      {secondary && (
        <div className="font-body text-fs-100 leading-[1.35] tracking-[0.04em] opacity-70">{secondary}</div>
      )}
    </div>
    {trailing}
  </div>
);

export default PersonCard;
