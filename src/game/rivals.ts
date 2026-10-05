import { PERSONALITIES } from '../ai/personalities';
import type { TableDifficulty } from '../types';

/** Tinte del avatar de los rivales según la dificultad de la mesa. */
export const DIFFICULTY_AVATAR_TONE: Record<TableDifficulty, { tone: string; imgClassName: string }> = {
  easy: { tone: 'bg-success brightness-[0.55]', imgClassName: 'contrast-[0.85] saturate-75' },
  medium: { tone: 'bg-bone brightness-[0.7]', imgClassName: 'contrast-100 saturate-100' },
  hard: { tone: 'bg-danger brightness-[0.5]', imgClassName: 'contrast-125 saturate-150' },
};

const rivalAvatars = import.meta.glob<{ default: string }>(
  '../assets/rivals/*.webp',
  { eager: true, query: 'url' },
);

function slug(name: string): string {
  return name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Ruta del avatar de un rival por su nombre, o undefined si no existe. */
export function rivalAvatar(name: string): string | undefined {
  return rivalAvatars[`../assets/rivals/${slug(name)}.webp`]?.default;
}

const ALIASES: Record<string, string> = Object.fromEntries(
  Object.values(PERSONALITIES)
    .flat()
    .map(p => [p.name, p.alias]),
);

/** Apodo de un rival por su nombre, o undefined si no se conoce. */
export function rivalAlias(name: string): string | undefined {
  return ALIASES[name];
}
