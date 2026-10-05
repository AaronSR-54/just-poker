import type { Card, GamePhase, Action as ActionType } from '../types';
import { createDeck, shuffle, deal } from './deck';
import { evaluateHand, compareHands, type HandResult } from './hands';

export interface PokerPlayer {
  id: number;
  name: string;
  avatar: string;
  cards: Card[];
  chips: number;
  bet: number;
  folded: boolean;
  isAllIn: boolean;
  eliminated: boolean;
  lastAction: string;
}

export interface PokerState {
  phase: GamePhase;
  players: PokerPlayer[];
  community: Card[];
  pot: number;
  currentPlayer: number;
  dealer: number;
  smallBlind: number;
  bigBlind: number;
  minRaise: number;
  winner: number[] | null;
  winAmounts: number[];
  committed: number[];
  showdown: boolean;
  handOver: boolean;
  gameOver: boolean;
  gameWinner: number | null;
  handNumber: number;
  actions: ActionType[];
  /** Ronda de apuestas completa esperando a repartir la siguiente calle. */
  streetPending: boolean;
}

/** Estado privado completo para persistir/reanudar una partida. */
export interface PokerSaveData {
  players: PokerPlayer[];
  community: Card[];
  currentPlayer: number;
  dealer: number;
  smallBlind: number;
  bigBlind: number;
  phase: GamePhase;
  minRaise: number;
  winner: number[] | null;
  winAmounts: number[];
  actions: ActionType[];
  handOver: boolean;
  gameOver: boolean;
  gameWinner: number | null;
  handNumber: number;
  committed: number[];
  acted: boolean[];
  deck: Card[];
  streetPending: boolean;
}

const STARTING_CHIPS = 1000;
const DEFAULT_NAMES = ['Tú', 'Mia', 'Dan', 'Sam', 'Leo', 'Nora'];

function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}

export class PokerGame {
  private deck: Card[] = [];
  private players: PokerPlayer[];
  private community: Card[] = [];
  private currentPlayer = 0;
  private dealer = -1;
  private smallBlind: number;
  private bigBlind: number;
  private phase: GamePhase = 'pre-flop';
  private minRaise: number;
  private winner: number[] | null = null;
  private winAmounts: number[] = [];
  private actions: ActionType[] = [];
  private handOver = false;
  private gameOver = false;
  private gameWinner: number | null = null;
  private handNumber = 0;
  /** Contribución total de cada jugador en la mano actual (para side pots). */
  private committed: number[] = [];
  /** Quién ha actuado en la ronda de apuestas actual. */
  private acted: boolean[] = [];
  /** Mazo fijo opcional (tutorial/tests); si existe se usa en cada mano. */
  private presetDeck: Card[] | null = null;
  /** Si es false, la transición entre calles se suspende hasta llamar a resolveStreet(). */
  private autoDeal = true;
  /** La ronda actual está completa y espera a que la UI reparta la siguiente calle. */
  private streetPending = false;

  constructor(playerCount: number, smallBlind = 10, bigBlind = 20, names?: string[], chips?: number[]) {
    this.smallBlind = smallBlind;
    this.bigBlind = bigBlind;
    this.minRaise = bigBlind;
    const count = Math.max(2, Math.min(6, playerCount));
    this.players = Array.from({ length: count }, (_, i) => {
      const name = names?.[i] ?? DEFAULT_NAMES[i] ?? `Jugador ${i + 1}`;
      return {
        id: i,
        name,
        avatar: initials(name),
        cards: [],
        chips: chips?.[i] ?? STARTING_CHIPS,
        bet: 0,
        folded: false,
        isAllIn: false,
        eliminated: false,
        lastAction: '—',
      };
    });
  }

  // ---------- Ciclo de vida ----------

  /** Fija un mazo concreto (en orden de reparto) para las próximas manos. */
  setDeck(deck: Card[] | null): void {
    this.presetDeck = deck ? deck.map(c => ({ ...c })) : null;
  }

  /**
   * Activa o desactiva el reparto automático al cerrar una ronda de apuestas.
   * Con `false`, el estado queda en `streetPending` y la UI decide cuándo llamar
   * a `resolveStreet()` (p. ej. para mostrar una pausa entre calles).
   */
  setAutoDeal(autoDeal: boolean): void {
    this.autoDeal = autoDeal;
  }

  startHand(): void {
    if (this.gameOver) return;

    // Eliminar jugadores sin fichas
    for (const p of this.players) {
      if (p.chips <= 0) p.eliminated = true;
    }

    const alive = this.players.filter(p => !p.eliminated);
    if (alive.length === 1) {
      this.gameOver = true;
      this.gameWinner = alive[0].id;
      this.handOver = true;
      return;
    }

    this.deck = this.presetDeck ? this.presetDeck.map(c => ({ ...c })) : shuffle(createDeck());
    this.community = [];
    this.phase = 'pre-flop';
    this.minRaise = this.bigBlind;
    this.winner = null;
    this.winAmounts = this.players.map(() => 0);
    this.handOver = false;
    this.actions = [];
    this.handNumber++;
    this.streetPending = false;
    this.committed = this.players.map(() => 0);
    this.acted = this.players.map(() => false);

    // Rotar dealer al siguiente jugador vivo
    this.dealer = this.nextAlive(this.dealer);

    for (const p of this.players) {
      p.cards = [];
      p.bet = 0;
      p.folded = false;
      p.isAllIn = false;
      p.lastAction = p.eliminated ? 'Eliminado' : '—';
    }

    // Repartir 2 cartas a cada jugador vivo, empezando por el siguiente al dealer
    let remaining = [...this.deck];
    const aliveIndexes = this.players.map((_, i) => i).filter(i => !this.players[i].eliminated);
    for (let n = 0; n < aliveIndexes.length; n++) {
      const idx = aliveIndexes[(aliveIndexes.indexOf(this.dealer) + 1 + n) % aliveIndexes.length];
      const [dealt, rest] = deal(remaining, 2);
      this.players[idx].cards = dealt;
      remaining = rest;
    }
    this.deck = remaining;

    this.postBlinds();

    // Preflop: empieza el siguiente a la BB (o el dealer en heads-up)
    this.currentPlayer = alive.length === 2 ? this.dealer : this.nextAlive(this.bbIndex());
    this.skipUnavailable();
  }

  /** Reinicia la partida por completo (fichas, eliminaciones). */
  reset(): void {
    for (const p of this.players) {
      p.chips = STARTING_CHIPS;
      p.eliminated = false;
      p.cards = [];
      p.bet = 0;
      p.folded = false;
      p.isAllIn = false;
      p.lastAction = '—';
    }
    this.dealer = -1;
    this.handNumber = 0;
    this.gameOver = false;
    this.gameWinner = null;
    this.handOver = false;
    this.winner = null;
    this.community = [];
    this.phase = 'pre-flop';
    this.streetPending = false;
  }

  // ---------- Helpers de asientos ----------

  private nextAlive(from: number): number {
    let i = from;
    do {
      i = (i + 1) % this.players.length;
    } while (this.players[i].eliminated);
    return i;
  }

  private sbIndex(): number {
    const alive = this.players.filter(p => !p.eliminated).length;
    return alive === 2 ? this.dealer : this.nextAlive(this.dealer);
  }

  private bbIndex(): number {
    const alive = this.players.filter(p => !p.eliminated).length;
    return alive === 2 ? this.nextAlive(this.dealer) : this.nextAlive(this.sbIndex());
  }

  private postBlinds(): void {
    const sb = this.players[this.sbIndex()];
    const sbActual = Math.min(this.smallBlind, sb.chips);
    sb.chips -= sbActual;
    sb.bet = sbActual;
    this.committed[sb.id] += sbActual;
    sb.lastAction = 'Ciega pequeña';
    if (sb.chips === 0) sb.isAllIn = true;

    const bb = this.players[this.bbIndex()];
    const bbActual = Math.min(this.bigBlind, bb.chips);
    bb.chips -= bbActual;
    bb.bet = bbActual;
    this.committed[bb.id] += bbActual;
    bb.lastAction = 'Ciega grande';
    if (bb.chips === 0) bb.isAllIn = true;
  }

  // ---------- Acciones ----------

  fold(playerIndex: number): void {
    if (!this.canAct(playerIndex)) return;
    const p = this.players[playerIndex];
    p.folded = true;
    p.lastAction = 'Se retiró';
    this.acted[playerIndex] = true;
    this.actions.push({ playerIndex, type: 'fold', timestamp: Date.now() });
    this.advance();
  }

  check(playerIndex: number): void {
    if (!this.canAct(playerIndex)) return;
    if (!this.canCheck(playerIndex)) return;
    this.players[playerIndex].lastAction = 'Pasó';
    this.acted[playerIndex] = true;
    this.actions.push({ playerIndex, type: 'check', timestamp: Date.now() });
    this.advance();
  }

  call(playerIndex: number): void {
    if (!this.canAct(playerIndex)) return;
    const p = this.players[playerIndex];
    const toCall = this.getCallAmount(playerIndex);
    if (toCall <= 0) {
      this.check(playerIndex);
      return;
    }
    const actual = Math.min(toCall, p.chips);
    p.chips -= actual;
    p.bet += actual;
    this.committed[playerIndex] += actual;
    if (p.chips === 0) p.isAllIn = true;
    p.lastAction = actual < toCall ? `All-in ${p.bet}` : 'Igualó';
    this.acted[playerIndex] = true;
    this.actions.push({ playerIndex, type: 'call', amount: actual, timestamp: Date.now() });
    this.advance();
  }

  raise(playerIndex: number, amount: number): void {
    if (!this.canAct(playerIndex)) return;
    const p = this.players[playerIndex];
    const maxBet = this.getMaxBet();
    const callAmount = maxBet - p.bet;
    const maxRaise = p.chips - callAmount;
    if (maxRaise <= 0) {
      this.call(playerIndex);
      return;
    }
    const isAllInRaise = amount >= maxRaise;
    const finalAmount = Math.min(Math.max(amount, isAllInRaise ? amount : this.minRaise), maxRaise);
    if (!isAllInRaise && finalAmount < this.minRaise) return;

    const totalAdded = callAmount + finalAmount;
    p.chips -= totalAdded;
    p.bet += totalAdded;
    this.committed[playerIndex] += totalAdded;
    if (p.chips === 0) p.isAllIn = true;

    const newMaxBet = p.bet;
    // Solo una subida completa reabre la ronda
    const raiseSize = finalAmount;
    if (raiseSize >= this.minRaise) {
      this.minRaise = raiseSize;
      for (let i = 0; i < this.players.length; i++) {
        if (i !== playerIndex) this.acted[i] = false;
      }
    }
    p.lastAction = p.isAllIn ? `All-in ${newMaxBet}` : `Subió a ${newMaxBet}`;
    this.acted[playerIndex] = true;
    this.actions.push({ playerIndex, type: 'raise', amount: finalAmount, timestamp: Date.now() });
    this.advance();
  }

  // ---------- Flujo ----------

  private canAct(playerIndex: number): boolean {
    const p = this.players[playerIndex];
    return (
      !this.handOver &&
      !this.gameOver &&
      !this.streetPending &&
      this.currentPlayer === playerIndex &&
      !p.folded &&
      !p.isAllIn &&
      !p.eliminated
    );
  }

  private skipUnavailable(): void {
    let guard = 0;
    while (
      (this.players[this.currentPlayer].folded ||
        this.players[this.currentPlayer].isAllIn ||
        this.players[this.currentPlayer].eliminated) &&
      guard < this.players.length
    ) {
      this.currentPlayer = this.nextAlive(this.currentPlayer);
      guard++;
    }
  }

  private activeNotFolded(): number[] {
    return this.players
      .map((_, i) => i)
      .filter(i => !this.players[i].eliminated && !this.players[i].folded);
  }

  private playersWhoCanAct(): number[] {
    return this.activeNotFolded().filter(i => !this.players[i].isAllIn);
  }

  private isRoundComplete(): boolean {
    const canAct = this.playersWhoCanAct();
    if (canAct.length === 0) return true;
    const maxBet = this.getMaxBet();
    return canAct.every(i => this.acted[i] && this.players[i].bet === maxBet);
  }

  private advance(): void {
    const remaining = this.activeNotFolded();

    // Solo queda uno: gana sin showdown
    if (remaining.length === 1) {
      this.finishHand([remaining[0]], false);
      return;
    }

    if (this.isRoundComplete()) {
      if (this.phase === 'river') {
        this.showdownNow();
        return;
      }
      // Runout automático si como mucho queda 1 jugador capaz de actuar:
      // sus futuras decisiones serían checks obligados (trámite)
      if (this.playersWhoCanAct().length <= 1) {
        this.runout();
        return;
      }
      if (!this.autoDeal) {
        // La UI mostrará una pausa y llamará a resolveStreet().
        this.streetPending = true;
        return;
      }
      this.dealCommunity();
      return;
    }

    this.currentPlayer = this.nextAlive(this.currentPlayer);
    this.skipUnavailable();
  }

  /**
   * Reparte la calle pendiente tras una pausa entre rondas. Solo tiene efecto
   * si `advance()` dejó el estado en `streetPending` (autoDeal desactivado).
   */
  resolveStreet(): void {
    if (!this.streetPending) return;
    this.streetPending = false;
    if (this.handOver || this.gameOver) return;
    this.dealCommunity();
  }

  private dealCommunity(): void {
    this.deck = this.deck.slice(1); // carta quemada
    if (this.phase === 'pre-flop') {
      const [dealt, rest] = deal(this.deck, 3);
      this.community = dealt;
      this.deck = rest;
      this.phase = 'flop';
    } else if (this.phase === 'flop' || this.phase === 'turn') {
      const [dealt, rest] = deal(this.deck, 1);
      this.community = [...this.community, ...dealt];
      this.deck = rest;
      this.phase = this.phase === 'flop' ? 'turn' : 'river';
    }

    for (const p of this.players) {
      p.bet = 0;
      if (!p.eliminated && !p.folded) p.lastAction = '—';
    }
    this.minRaise = this.bigBlind;
    this.acted = this.players.map(() => false);

    // Postflop empieza el primer vivo tras el dealer
    this.currentPlayer = this.nextAlive(this.dealer);
    this.skipUnavailable();
  }

  /** Reparte todas las cartas restantes y va al showdown (todos all-in). */
  private runout(): void {
    while (this.phase !== 'river' && !this.handOver) {
      this.dealCommunity();
    }
    this.showdownNow();
  }

  private showdownNow(): void {
    this.phase = 'showdown';
    const contenders = this.activeNotFolded();
    const results = new Map<number, HandResult>();
    for (const i of contenders) {
      results.set(i, evaluateHand(this.players[i].cards, this.community));
    }
    this.finishHand(contenders, true, results);
  }

  /**
   * Reparte el bote (con side pots) entre los ganadores.
   * @param contenders índices que llegan al reparto (no retirados)
   * @param byShowdown si hubo showdown (para evaluar manos)
   * @param results manos evaluadas por jugador (solo en showdown)
   */
  private finishHand(
    contenders: number[],
    byShowdown: boolean,
    results?: Map<number, HandResult>
  ): void {
    this.phase = 'showdown';
    this.handOver = true;

    const { payouts, winners } = distributePots(
      this.committed,
      contenders,
      byShowdown,
      results,
      this.dealer
    );

    for (let i = 0; i < this.players.length; i++) {
      this.players[i].chips += payouts[i];
    }
    this.winner = winners;
    this.winAmounts = payouts;

    // ¿Fin de la partida?
    const alive = this.players.filter(p => !p.eliminated && p.chips > 0);
    if (alive.length === 1) {
      this.gameOver = true;
      this.gameWinner = alive[0].id;
    }
  }

  // ---------- Consultas ----------

  getActivePlayers(): number[] {
    return this.activeNotFolded();
  }

  private getMaxBet(): number {
    return Math.max(0, ...this.players.map(p => p.bet));
  }

  getPot(): number {
    return this.committed.reduce((a, b) => a + b, 0);
  }

  getCallAmount(playerIndex: number): number {
    return Math.max(0, this.getMaxBet() - this.players[playerIndex].bet);
  }

  canCheck(playerIndex: number): boolean {
    return this.getCallAmount(playerIndex) === 0;
  }

  canRaise(playerIndex: number): boolean {
    const p = this.players[playerIndex];
    return p.chips > this.getCallAmount(playerIndex);
  }

  getMinRaise(): number {
    return this.minRaise;
  }

  /** Máxima subida (sobre la apuesta máxima) que puede hacer el jugador. */
  getMaxRaise(playerIndex: number): number {
    const p = this.players[playerIndex];
    return Math.max(0, p.chips - this.getCallAmount(playerIndex));
  }

  getState(): PokerState {
    return {
      phase: this.phase,
      players: this.players.map(p => ({ ...p, cards: [...p.cards] })),
      community: [...this.community],
      pot: this.getPot(),
      currentPlayer: this.currentPlayer,
      dealer: this.dealer,
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
      minRaise: this.minRaise,
      winner: this.winner ? [...this.winner] : null,
      winAmounts: [...this.winAmounts],
      committed: [...this.committed],
      showdown: this.phase === 'showdown',
      handOver: this.handOver,
      gameOver: this.gameOver,
      gameWinner: this.gameWinner,
      handNumber: this.handNumber,
      actions: [...this.actions],
      streetPending: this.streetPending,
    };
  }

  /** Estado privado completo, listo para persistir. */
  serialize(): PokerSaveData {
    return {
      players: this.players.map(p => ({ ...p, cards: [...p.cards] })),
      community: [...this.community],
      currentPlayer: this.currentPlayer,
      dealer: this.dealer,
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
      phase: this.phase,
      minRaise: this.minRaise,
      winner: this.winner ? [...this.winner] : null,
      winAmounts: [...this.winAmounts],
      actions: [...this.actions],
      handOver: this.handOver,
      gameOver: this.gameOver,
      gameWinner: this.gameWinner,
      handNumber: this.handNumber,
      committed: [...this.committed],
      acted: [...this.acted],
      deck: [...this.deck],
      streetPending: this.streetPending,
    };
  }

  /** Reconstruye una partida a partir de un estado persistido. */
  static deserialize(data: PokerSaveData): PokerGame {
    const game = new PokerGame(
      data.players.length,
      data.smallBlind,
      data.bigBlind,
      data.players.map(p => p.name),
      data.players.map(p => p.chips)
    );
    game.players = data.players.map(p => ({ ...p, cards: [...p.cards] }));
    game.community = [...data.community];
    game.currentPlayer = data.currentPlayer;
    game.dealer = data.dealer;
    game.phase = data.phase;
    game.minRaise = data.minRaise;
    game.winner = data.winner ? [...data.winner] : null;
    game.winAmounts = [...data.winAmounts];
    game.actions = [...data.actions];
    game.handOver = data.handOver;
    game.gameOver = data.gameOver;
    game.gameWinner = data.gameWinner;
    game.handNumber = data.handNumber;
    game.committed = [...data.committed];
    game.acted = [...data.acted];
    game.deck = [...data.deck];
    game.streetPending = data.streetPending ?? false;
    return game;
  }
}

/**
 * Reparte el bote entre los ganadores aplicando side pots por niveles de
 * contribución. Función pura (sin estado) para poder testear el reparto.
 *
 * @param committed contribución total de cada jugador en la mano
 * @param contenders índices que llegan al reparto (no retirados)
 * @param byShowdown si es showdown (se comparan manos) o victoria por retirada
 * @param results manos evaluadas por jugador (obligatorio en showdown)
 * @param dealer índice del dealer, para repartir el resto (odd chip) por orden
 * @returns pagos por jugador y conjunto de ganadores
 */
export function distributePots(
  committed: number[],
  contenders: number[],
  byShowdown: boolean,
  results: Map<number, HandResult> | undefined,
  dealer: number
): { payouts: number[]; winners: number[] } {
  const n = committed.length;
  const payouts = committed.map(() => 0);
  const winSet = new Set<number>();

  if (!byShowdown) {
    // Victoria por retirada: se lo lleva todo el único superviviente
    const total = committed.reduce((a, b) => a + b, 0);
    if (contenders.length > 0) {
      payouts[contenders[0]] = total;
      winSet.add(contenders[0]);
    }
    return { payouts, winners: [...winSet] };
  }

  // Side pots por niveles de contribución
  const levels = [...new Set(committed.filter(c => c > 0))].sort((a, b) => a - b);
  let prev = 0;
  for (const level of levels) {
    let sidePot = 0;
    const contributions: Array<{ index: number; amount: number }> = [];
    for (let i = 0; i < n; i++) {
      const contrib = Math.min(committed[i], level) - Math.min(committed[i], prev);
      if (contrib > 0) {
        sidePot += contrib;
        contributions.push({ index: i, amount: contrib });
      }
    }
    const eligible = contributions
      .map(c => c.index)
      .filter(i => contenders.includes(i));
    if (sidePot > 0 && eligible.length > 0) {
      // Mejor mano entre los elegibles
      let best: HandResult | null = null;
      for (const i of eligible) {
        const r = results!.get(i)!;
        if (!best || compareHands(r, best) > 0) best = r;
      }
      const winnersHere = eligible.filter(i => compareHands(results!.get(i)!, best!) === 0);
      const share = Math.floor(sidePot / winnersHere.length);
      let remainder = sidePot - share * winnersHere.length;
      // El resto va al primer ganador tras el dealer
      const ordered = [...winnersHere].sort((a, b) => {
        const da = (a - dealer + n) % n;
        const db = (b - dealer + n) % n;
        return da - db;
      });
      for (const w of ordered) {
        payouts[w] += share + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
        winSet.add(w);
      }
    } else if (sidePot > 0) {
      // Apuesta no igualada por ningún contendiente: se devuelve a quien la puso
      for (const c of contributions) {
        payouts[c.index] += c.amount;
      }
    }
    prev = level;
  }

  return { payouts, winners: [...winSet] };
}
