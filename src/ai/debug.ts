/* eslint-disable no-console, no-debugger */
import type { Card } from '../types';
import { SUITS } from '../types';
import type { PokerState } from '../game/poker';
import type { AIDecision, DecisionInfo, Personality } from './personalities';

/**
 * Logs de depuración de la IA. Están apagados por defecto para no ensuciar la
 * consola en producción. Se activan de tres formas:
 *
 *  1. En la URL:              http://localhost:5173/?aiDebug=1
 *  2. Desde la consola:       jpAIDebug(true)
 *  3. Persistente:            localStorage.setItem('just-poker:ai-debug', '1')
 *
 * Al activarlos se imprime la decisión y, justo después, se entra en un
 * breakpoint (`debugger`) para inspeccionar el estado paso a paso. Para ver
 * solo los logs sin pausar, usa `?aiDebug=nobp` (o `jpAIDebug(true, false)`).
 */

const STORAGE_KEY = 'just-poker:ai-debug';
const PARAM = 'aiDebug';

const HAND_NAMES = [
  'Carta alta', 'Pareja', 'Doble pareja', 'Trío', 'Escalera',
  'Color', 'Full house', 'Póker', 'Escalera de color', 'Escalera real',
];
const STREET_NAMES = ['preflop', 'flop', 'turn', 'river', 'showdown'];

interface DebugFlags {
  enabled: boolean;
  breakpoint: boolean;
}

function readFlags(): DebugFlags {
  let enabled = false;
  let breakpoint = true;
  try {
    if (typeof window !== 'undefined') {
      const raw = new URLSearchParams(window.location.search).get(PARAM);
      if (raw !== null) {
        enabled = true;
        breakpoint = raw !== 'nobp' && raw !== 'log';
      }
      if (!enabled) {
        const stored = window.localStorage?.getItem(STORAGE_KEY);
        if (stored != null) {
          enabled = true;
          breakpoint = stored !== 'log';
        }
      }
    }
  } catch {
    // Entornos sin window (tests, SSR).
  }
  return { enabled, breakpoint };
}

export function aiDebugEnabled(): boolean {
  return readFlags().enabled;
}

/** Activa o desactiva los logs (+ breakpoint) de IA en caliente desde la consola. */
export function setAIDebug(on: boolean, breakpoint = true): void {
  try {
    if (typeof window === 'undefined') return;
    if (on) window.localStorage.setItem(STORAGE_KEY, breakpoint ? '1' : 'log');
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignora almacenamiento no disponible.
  }
}

const pct = (x: number): string => `${Math.round(x * 100)}%`;

const fmtCard = (c: Card): string => `${c.rank}${SUITS[c.suit]}`;
const fmtCards = (cards: Card[]): string => (cards.length ? cards.map(fmtCard).join(' ') : '—');

function playerStatus(p: PokerState['players'][number]): string {
  if (p.eliminated) return 'eliminado';
  if (p.folded) return 'retirado';
  if (p.isAllIn) return 'all-in';
  return 'activo';
}

/** Vuelca en consola una decisión de IA con todo el contexto. */
export function logAIDecision(
  personality: Personality,
  state: PokerState,
  playerIndex: number,
  info: DecisionInfo,
  action: AIDecision,
): void {
  const { enabled, breakpoint } = readFlags();
  if (!enabled) return;

  const t = personality.traits;
  const seatName = state.players[playerIndex]?.name ?? personality.name;
  const amount = action.amount !== undefined ? ` ${action.amount}` : '';
  const street = STREET_NAMES[info.street] ?? `calle ${info.street}`;
  const hand = info.street === 0 ? '—' : HAND_NAMES[info.handCategory] ?? '—';
  const mesa = fmtCards(state.community);
  const miMano = fmtCards(state.players[playerIndex]?.cards ?? []);
  const enMesa = state.players.filter(p => !p.eliminated).length;
  const jugadores = state.players.map((p, i) => ({
    asiento: p.name,
    cartas: fmtCards(p.cards),
    estado: playerStatus(p),
    fichas: p.chips,
    apuesta: p.bet,
    ultimaAccion: p.lastAction,
    ...(i === playerIndex ? { actua: 'sí (IA)' } : {}),
  }));

  const head = `[IA] ${seatName} (${personality.name} "${personality.alias}", ${personality.difficulty}) → ${action.type.toUpperCase()}${amount}`;
  const line =
    `mano ${miMano} · mesa ${mesa} · ${street} · pos ${info.position.toFixed(2)} · bote ${info.pot} · pagar ${info.callAmount} (odds ${pct(info.potOdds)}) · ` +
    `eq ${pct(info.rawEquity)} · ${hand} · rivales ${info.opponents}/${enMesa - 1} activos · respeto ${info.respect.toFixed(2)} · ánimo ${info.mood.toFixed(2)} · ` +
    `complejidad ${info.complexity.toFixed(2)} · P(f/c/r) ${info.probFold.toFixed(2)}/${info.probCall.toFixed(2)}/${info.probRaise.toFixed(2)} · motivo: ${info.reason}`;

  console.log(`%c${head}`, 'color:#5b8af0;font-weight:bold', `\n${line}`);
  console.log({
    personaje: {
      nombre: personality.name,
      apodo: personality.alias,
      dificultad: personality.difficulty,
      rasgos: {
        tightness: t.tightness,
        aggression: t.aggression,
        farol: t.bluffFrequency,
        tilt: t.tilt ?? 0.5,
        tempo: t.tempo ?? 1,
      },
    },
    contexto: {
      asiento: seatName,
      calle: street,
      posicion: info.position,
      bote: info.pot,
      aPagar: info.callAmount,
      potOdds: info.potOdds,
      equity: info.rawEquity,
      categoria: hand,
      jugadoresEnMesa: enMesa,
      rivalesActivos: info.opponents,
      respeto: info.respect,
      animo: info.mood,
      riesgoStack: info.stackRisk,
    },
    cartas: {
      miMano,
      comunitarias: mesa,
      jugadores,
    },
    decision: {
      accion: action.type,
      cantidad: action.amount ?? null,
      motivo: info.reason,
      complejidad: info.complexity,
      probabilidades: { fold: info.probFold, call: info.probCall, raise: info.probRaise },
    },
  });

  // Breakpoint tras el log: pausa aquí para inspeccionar cada decisión.
  if (breakpoint) debugger;
}

// Atajo en la consola del navegador: `jpAIDebug(true)` / `jpAIDebug(false)`.
if (typeof window !== 'undefined') {
  (window as unknown as { jpAIDebug?: (on: boolean) => void }).jpAIDebug = setAIDebug;
}
