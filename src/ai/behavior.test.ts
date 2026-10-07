import { describe, it, beforeAll, expect, vi } from 'vitest';
import { PokerGame } from '../game/poker';
import {
  decideAction,
  PERSONALITIES,
  type Personality,
  type DecisionInfo,
} from './personalities';

// ---------------------------------------------------------------------------
// Arnés de diagnóstico: mide el comportamiento real de cada rival contra un
// campo neutral fijo. Sirve para verificar que cada personalidad (y su
// dificultad, de forma emergente vía EV) es acorde a sus 3 constantes.
//
// Ejecutar:  npm run test:ai
// Opciones:  AI_BENCH_HANDS=500 AI_BENCH_SEED=42 npm run test:ai
//
// Solo se ejecuta con `npm run test:ai` (o pasando AI_BENCH_HANDS). Así el
// `npm test` normal no paga los ~100 s de simulación.
// ---------------------------------------------------------------------------

const HANDS = Number(process.env.AI_BENCH_HANDS ?? 300);
const SEED = Number(process.env.AI_BENCH_SEED ?? 1234);
const SEEDS = Number(process.env.AI_BENCH_SEEDS ?? 3);

const NEUTRAL: Personality = {
  name: 'Neutral',
  alias: 'el Patrón',
  difficulty: 'medium',
  points: 0,
  traits: { tightness: 0.5, aggression: 0.5, bluffFrequency: 0.2 },
};

interface Profile {
  name: string;
  alias: string;
  difficulty: Personality['difficulty'];
  points: number;
  tightness: number;
  aggression: number;
  bluffFrequency: number;
  hands: number;
  folds: number;
  checks: number;
  calls: number;
  raises: number;
  vpipHands: number;
  pfrHands: number;
  facedBet: number;
  foldedToBet: number;
  raiseSamples: number;
  bluffRaises: number;
  raiseBBSum: number;
  netChips: number;
  showdowns: number;
  showdownWins: number;
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function spearman(xs: number[], ys: number[]): number {
  const rank = (arr: number[]): number[] => {
    const order = arr.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
    const ranks = new Array<number>(arr.length).fill(0);
    order.forEach(([, i], k) => { ranks[i] = k + 1; });
    return ranks;
  };
  const rx = rank(xs);
  const ry = rank(ys);
  const n = xs.length;
  const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / n;
  const mx = mean(rx);
  const my = mean(ry);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = rx[i] - mx;
    const b = ry[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  return dx === 0 || dy === 0 ? 0 : num / Math.sqrt(dx * dy);
}

function simulate(personality: Personality, hands: number, seed: number): Profile {
  const rng = mulberry32(seed);
  const spy = vi.spyOn(Math, 'random').mockImplementation(rng);

  const p: Profile = {
    name: personality.name,
    alias: personality.alias,
    difficulty: personality.difficulty,
    points: personality.points,
    tightness: personality.traits.tightness,
    aggression: personality.traits.aggression,
    bluffFrequency: personality.traits.bluffFrequency,
    hands: 0,
    folds: 0,
    checks: 0,
    calls: 0,
    raises: 0,
    vpipHands: 0,
    pfrHands: 0,
    facedBet: 0,
    foldedToBet: 0,
    raiseSamples: 0,
    bluffRaises: 0,
    raiseBBSum: 0,
    netChips: 0,
    showdowns: 0,
    showdownWins: 0,
  };

  const g = new PokerGame(4, 10, 20, [personality.name, 'N1', 'N2', 'N3']);

  try {
    while (p.hands < hands) {
      if (g.getState().gameOver) g.reset();
      g.startHand();
      if (g.getState().handOver) break;

      const start = g.getState();
      const dealt = !start.players[0].eliminated;
      const chipsBefore = start.players[0].chips;
      let vpip = false;
      let pfr = false;

      const collect = (info: DecisionInfo) => {
        const { decision, street, rawEquity, callAmount } = info;
        if (decision.type === 'fold') p.folds++;
        else if (decision.type === 'check') p.checks++;
        else if (decision.type === 'call') p.calls++;
        else if (decision.type === 'raise') {
          p.raises++;
          p.raiseBBSum += (decision.amount ?? 0) / 20;
          p.raiseSamples++;
          if (rawEquity < 0.35) p.bluffRaises++;
        }
        if (street === 0 && (decision.type === 'call' || decision.type === 'raise')) vpip = true;
        if (street === 0 && decision.type === 'raise') pfr = true;
        if (callAmount > 0) {
          p.facedBet++;
          if (decision.type === 'fold') p.foldedToBet++;
        }
      };

      let guard = 0;
      while (!g.getState().handOver && guard < 400) {
        guard++;
        const s = g.getState();
        if (s.streetPending) { g.resolveStreet(); continue; }
        const i = s.currentPlayer;
        const decision = decideAction(i, s, i === 0 ? personality : NEUTRAL, i === 0 ? collect : undefined);
        if (decision.type === 'fold') g.fold(i);
        else if (decision.type === 'check') g.check(i);
        else if (decision.type === 'call') g.call(i);
        else g.raise(i, decision.amount ?? s.minRaise);
      }

      const end = g.getState();
      p.netChips += end.players[0].chips - chipsBefore;
      // Solo cuentan las manos en las que el jugador repartió: si queda
      // eliminado, deja de actuar y no debe diluir su VPIP/PFR.
      if (dealt) {
        p.hands++;
        if (vpip) p.vpipHands++;
        if (pfr) p.pfrHands++;
      }

      const contenders = end.players.filter(pl => !pl.folded && !pl.eliminated).length;
      if (contenders > 1) {
        p.showdowns++;
        if (end.winner?.includes(0)) p.showdownWins++;
      }
    }
  } finally {
    spy.mockRestore();
  }

  return p;
}

const pct = (num: number, den: number) => (den > 0 ? (num / den) * 100 : 0);

type NumericKey = keyof Pick<
  Profile,
  | 'hands' | 'folds' | 'checks' | 'calls' | 'raises'
  | 'vpipHands' | 'pfrHands' | 'facedBet' | 'foldedToBet'
  | 'raiseSamples' | 'bluffRaises' | 'raiseBBSum' | 'netChips'
  | 'showdowns' | 'showdownWins'
>;

const NUMERIC_KEYS: NumericKey[] = [
  'hands', 'folds', 'checks', 'calls', 'raises',
  'vpipHands', 'pfrHands', 'facedBet', 'foldedToBet',
  'raiseSamples', 'bluffRaises', 'raiseBBSum', 'netChips',
  'showdowns', 'showdownWins',
];

/** Suma los contadores de varias corridas (promedio ponderado por manos). */
function merge(a: Profile, b: Profile): Profile {
  const out: Profile = { ...a };
  for (const k of NUMERIC_KEYS) out[k] = a[k] + b[k];
  return out;
}

interface Row extends Record<string, unknown> {
  rival: string;
  dif: string;
  tight: number;
  aggr: number;
  bluff: number;
  VPIP: string;
  PFR: string;
  AF: string;
  FoldBet: string;
  Bluff: string;
  'Raise(BB)': string;
  'EV/100': string;
  SDWin: string;
}

const RUN = process.env.AI_BENCH === '1' || process.env.AI_BENCH_HANDS !== undefined;

describe.skipIf(!RUN)('IA — comportamiento por rival', () => {
  let profiles: Profile[] = [];
  const by = (name: string) => profiles.find(p => p.name === name)!;

  beforeAll(() => {
    profiles = Object.values(PERSONALITIES)
      .flat()
      .map((pers, k) => Array.from({ length: SEEDS }, (_, j) =>
        simulate(pers, HANDS, SEED + j * 10_007 + k * 101),
      ).reduce(merge));

    const rows: Row[] = profiles.map(p => ({
      rival: p.name,
      dif: p.difficulty,
      tight: p.tightness,
      aggr: p.aggression,
      bluff: p.bluffFrequency,
      VPIP: `${pct(p.vpipHands, p.hands).toFixed(0)}%`,
      PFR: `${pct(p.pfrHands, p.hands).toFixed(0)}%`,
      AF: `${pct(p.raises, p.raises + p.calls).toFixed(0)}%`,
      FoldBet: `${pct(p.foldedToBet, p.facedBet).toFixed(0)}%`,
      Bluff: `${pct(p.bluffRaises, p.raiseSamples).toFixed(0)}%`,
      'Raise(BB)': (p.raiseBBSum / Math.max(1, p.raises)).toFixed(2),
      'EV/100': ((p.netChips / Math.max(1, p.hands)) * 100).toFixed(0),
      SDWin: `${pct(p.showdownWins, p.showdowns).toFixed(0)}%`,
    }));
    // eslint-disable-next-line no-console
    console.table(rows);
  }, 600_000);

  it('cada personalidad tiene un perfil propio y estable', () => {
    for (const p of profiles) {
      expect.soft(p.hands, `${p.name} sin manos simuladas`).toBeGreaterThan(0);
      expect.soft(p.raises + p.calls + p.folds + p.checks, `${p.name} sin acciones`).toBeGreaterThan(0);
    }
  });

  it('agresión (AF) correlaciona con el trait aggression', () => {
    const rho = spearman(
      profiles.map(p => p.aggression),
      profiles.map(p => pct(p.raises, p.raises + p.calls)),
    );
    expect.soft(rho, `Spearman aggression↔AF = ${rho.toFixed(2)}`).toBeGreaterThan(0.5);

    expect.soft(
      by('Rex').raises / Math.max(1, by('Rex').raises + by('Rex').calls),
      'Rex (aggression 0.9, hard) debe ser más agresivo que Nora (0.4, medium)',
    ).toBeGreaterThan(by('Nora').raises / Math.max(1, by('Nora').raises + by('Nora').calls));
  });

  it('loose/tight (VPIP) correlaciona con (1 − tightness)', () => {
    const rho = spearman(
      profiles.map(p => 1 - p.tightness),
      profiles.map(p => pct(p.vpipHands, p.hands)),
    );
    expect.soft(rho, `Spearman (1−tightness)↔VPIP = ${rho.toFixed(2)}`).toBeGreaterThan(0.5);

    expect.soft(
      pct(by('Mia').vpipHands, by('Mia').hands),
      'Mia (tightness 0.2, la más loose) debe jugar más manos que Nora (0.7)',
    ).toBeGreaterThan(pct(by('Nora').vpipHands, by('Nora').hands));
  });

  it('frecuencia de farol correlaciona con bluffFrequency', () => {
    const rho = spearman(
      profiles.map(p => p.bluffFrequency),
      profiles.map(p => pct(p.bluffRaises, p.raiseSamples)),
    );
    expect.soft(rho, `Spearman bluffFrequency↔faroles = ${rho.toFixed(2)}`).toBeGreaterThan(0.3);
  });

  it('tamaño de subida correlaciona con aggression', () => {
    const rho = spearman(
      profiles.map(p => p.aggression),
      profiles.map(p => p.raiseBBSum / Math.max(1, p.raises)),
    );
    expect.soft(rho, `Spearman aggression↔tamaño = ${rho.toFixed(2)}`).toBeGreaterThan(0.4);
  });

  it('la dificultad se refleja en el EV contra el campo neutral', () => {
    const tierEv = (diff: Personality['difficulty']) =>
      profiles
        .filter(p => p.difficulty === diff)
        .reduce((s, p) => s + (p.netChips / Math.max(1, p.hands)) * 100, 0) / 3;

    const easy = tierEv('easy');
    const medium = tierEv('medium');
    const hard = tierEv('hard');
    // eslint-disable-next-line no-console
    console.log(`EV/100 → easy ${easy.toFixed(0)} | medium ${medium.toFixed(0)} | hard ${hard.toFixed(0)}`);

    expect.soft(hard, `EV hard (${hard.toFixed(0)}) debe superar a easy (${easy.toFixed(0)})`).toBeGreaterThan(easy);
    expect.soft(medium, `EV medium (${medium.toFixed(0)}) debe superar a easy (${easy.toFixed(0)})`).toBeGreaterThan(easy);
    expect.soft(hard, `EV hard (${hard.toFixed(0)}) debe superar a medium (${medium.toFixed(0)})`).toBeGreaterThan(medium);
  });

  it('reporta contradicciones con el copy de Local.tsx', () => {
    const notes: string[] = [];
    if (by('Mia').aggression < 0.5) notes.push('Mia "La Chispa": aggression baja (0.3) pese al copy.');
    if (by('Rex').raises / Math.max(1, by('Rex').raises + by('Rex').calls) < 0.5)
      notes.push('Rex "Toro Salvaje": AF < 50% pese a "sube en cada ronda".');
    if (by('Elena').tightness > 0.4)
      notes.push('Elena "Viuda Negra": tightness alta pese a "casi nunca se retira".');
    notes.push('Rivales no adaptativos y sin memoria entre manos: fieles a Pluribus, no leen tendencias del jugador.');
    notes.push('La dificultad es fidelidad del motor: easy añade ruido y baja disciplina; hard usa equity exacta sin ruido y razona rangos/posición.');
    notes.push('El estado de ánimo (tilt/confianza) solo depende de los resultados propios, nunca del rival.');
    // eslint-disable-next-line no-console
    console.log('\nContradicciones copy↔motor:\n- ' + notes.join('\n- '));
    expect(profiles.length).toBe(9);
  });
});
