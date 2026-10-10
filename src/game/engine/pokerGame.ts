import { createDeck, shuffle, deal } from '../deck';
import { evaluateHand, type HandResult } from '../hands';
import { distributePots } from './potDistribution';
import { PokerGameState } from './pokerGameState';
import type { PokerSaveData } from './types';
import {
  nextAlive,
  bigBlindIndex,
  postBlinds,
  activeNotFolded,
  playersWhoCanAct,
  maxBet,
} from './seats';
import { STARTING_CHIPS } from './constants';

/** Motor de la partida: ciclo de vida, acciones de apuestas y flujo de la mano. */
export class PokerGame extends PokerGameState {
  // ---------- Ciclo de vida ----------

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
    this.dealer = nextAlive(this.players, this.dealer);

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

    postBlinds(this.players, this.committed, this.smallBlind, this.bigBlind, this.dealer);

    // Preflop: empieza el siguiente a la BB (o el dealer en heads-up)
    this.currentPlayer = alive.length === 2 ? this.dealer : nextAlive(this.players, bigBlindIndex(this.players, this.dealer));
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

  /**
   * Elimina definitivamente a un asiento (p. ej. expulsado por inactividad):
   * lo retira si la mano está en curso y lo deja sin fichas. Si solo queda un
   * jugador con fichas, la partida termina a su favor.
   */
  eliminate(playerIndex: number): void {
    const p = this.players[playerIndex];
    if (!p || p.eliminated) return;

    p.eliminated = true;
    p.chips = 0;
    p.folded = true;
    p.lastAction = 'Eliminado';

    if (this.gameOver) return;

    if (!this.handOver) {
      const contenders = activeNotFolded(this.players);
      if (contenders.length <= 1) {
        this.finishHand(contenders, false);
        return;
      }
      if (this.currentPlayer === playerIndex) this.advance();
      return;
    }

    // La mano ya había terminado: basta con declarar el fin si queda uno con fichas.
    const alive = this.players.filter((q) => !q.eliminated && q.chips > 0);
    if (alive.length === 1) {
      this.gameOver = true;
      this.gameWinner = alive[0].id;
    }
  }

  // ---------- Helpers de asientos ----------

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
    const currentMaxBet = maxBet(this.players);
    const callAmount = currentMaxBet - p.bet;
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
      this.currentPlayer = nextAlive(this.players, this.currentPlayer);
      guard++;
    }
  }

  private isRoundComplete(): boolean {
    const canAct = playersWhoCanAct(this.players);
    if (canAct.length === 0) return true;
    const mb = maxBet(this.players);
    return canAct.every(i => this.acted[i] && this.players[i].bet === mb);
  }

  private advance(): void {
    const remaining = activeNotFolded(this.players);

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
      if (playersWhoCanAct(this.players).length <= 1) {
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

    this.currentPlayer = nextAlive(this.players, this.currentPlayer);
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
    this.currentPlayer = nextAlive(this.players, this.dealer);
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
    const contenders = activeNotFolded(this.players);
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

  /** Reconstruye una partida a partir de un estado persistido. */
  static deserialize(data: PokerSaveData): PokerGame {
    const game = new PokerGame(
      data.players.length,
      data.smallBlind,
      data.bigBlind,
      data.players.map(p => p.name),
      data.players.map(p => p.chips)
    );
    game.hydrate(data);
    return game;
  }
}
