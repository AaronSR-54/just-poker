export interface Personality {
  name: string;
  /** Apodo mostrado junto al nombre en los slots */
  alias: string;
  difficulty: 'easy' | 'medium' | 'hard';
  /** Puntos de ranking mostrados en su slot */
  points: number;
  traits: {
    /** 0 = juega todo (loose), 1 = juega poco (tight) */
    tightness: number;
    /** 0 = pasivo, 1 = hiperagresivo */
    aggression: number;
    /** Probabilidad base de farol */
    bluffFrequency: number;
    /** Cuánto le afectan los resultados (0 = estoico, 1 = montaña rusa). */
    tilt?: number;
    /** Ritmo de decisión: >1 piensa más, <1 es más rápido. */
    tempo?: number;
  };
}

export interface AIDecision {
  type: 'fold' | 'check' | 'call' | 'raise';
  amount?: number;
}

/** Contexto interno de una decisión, expuesto para diagnóstico (no altera el motor). */
export interface DecisionInfo {
  equity: number;
  rawEquity: number;
  raiseThreshold: number;
  callThreshold: number;
  entryThreshold: number;
  difficulty: Personality['difficulty'];
  callAmount: number;
  pot: number;
  potOdds: number;
  opponents: number;
  stackRisk: number;
  street: number;
  bluffRoll: boolean;
  canCheck: boolean;
  canRaise: boolean;
  decision: AIDecision;
  // --- capa nueva ---
  /** Categoría de la mano hecha (HAND_RANKS); 0 preflop. */
  handCategory: number;
  /** 0 = primer jugador en hablar, 1 = último (botón). */
  position: number;
  /** Animo actual (−1..1). */
  mood: number;
  /** Peso de la fuerza mostrada por la mesa (0..1). */
  respect: number;
  /** Dificultad de la decisión (0 = trivial, 1 = muy reñida). */
  complexity: number;
  probFold: number;
  probCall: number;
  probRaise: number;
  /** Etiqueta legible del motivo de la decisión (para depuración). */
  reason: string;
}

export type ActionKind = 'fold' | 'check' | 'call' | 'raise';

/** Acción elegida internamente, con motivo y si es un farol. */
export interface Choice {
  kind: ActionKind;
  isBluff: boolean;
  /** Etiqueta legible del motivo, solo para depuración. */
  reason: string;
}
