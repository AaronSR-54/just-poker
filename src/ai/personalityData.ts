import type { Personality } from './personalityTypes';

export const MIA: Personality = {
  name: 'Mia',
  alias: 'La Chispa',
  difficulty: 'easy',
  points: 45,
  traits: { tightness: 0.25, aggression: 0.7, bluffFrequency: 0.4, tilt: 0.85, tempo: 0.9 },
};

export const DAN: Personality = {
  name: 'Dan',
  alias: 'Ruleta Rusa',
  difficulty: 'easy',
  points: 80,
  traits: { tightness: 0.45, aggression: 0.75, bluffFrequency: 0.5, tilt: 0.95, tempo: 1.15 },
};

export const SAM: Personality = {
  name: 'Sam',
  alias: 'Camaleón',
  difficulty: 'easy',
  points: 60,
  traits: { tightness: 0.5, aggression: 0.5, bluffFrequency: 0.3, tilt: 0.5, tempo: 1 },
};

export const LEO: Personality = {
  name: 'Leo',
  alias: 'El Protocolo',
  difficulty: 'medium',
  points: 210,
  traits: { tightness: 0.62, aggression: 0.55, bluffFrequency: 0.15, tilt: 0.2, tempo: 1 },
};

export const NORA: Personality = {
  name: 'Nora',
  alias: 'Ojo Clínico',
  difficulty: 'medium',
  points: 340,
  traits: { tightness: 0.72, aggression: 0.35, bluffFrequency: 0.12, tilt: 0.15, tempo: 1.2 },
};

export const KAI: Personality = {
  name: 'Kai',
  alias: 'Doble Fondo',
  difficulty: 'medium',
  points: 260,
  traits: { tightness: 0.5, aggression: 0.5, bluffFrequency: 0.45, tilt: 0.4, tempo: 1 },
};

export const VICTOR: Personality = {
  name: 'Víctor',
  alias: 'Yo, Robot',
  difficulty: 'hard',
  points: 720,
  traits: { tightness: 0.64, aggression: 0.6, bluffFrequency: 0.25, tilt: 0, tempo: 0.7 },
};

export const ELENA: Personality = {
  name: 'Elena',
  alias: 'Viuda Negra',
  difficulty: 'hard',
  points: 900,
  traits: { tightness: 0.3, aggression: 0.55, bluffFrequency: 0.22, tilt: 0.2, tempo: 1.1 },
};

export const REX: Personality = {
  name: 'Rex',
  alias: 'Toro Salvaje',
  difficulty: 'hard',
  points: 1050,
  traits: { tightness: 0.4, aggression: 0.92, bluffFrequency: 0.45, tilt: 0.85, tempo: 0.85 },
};

export const PERSONALITIES: Record<string, Personality[]> = {
  easy: [MIA, DAN, SAM],
  medium: [LEO, NORA, KAI],
  hard: [VICTOR, ELENA, REX],
};
