import type { Card, GamePhase, Action as ActionType } from '../../types';
import type { PokerPlayer, PokerState, PokerSaveData } from './types';
import { STARTING_CHIPS, DEFAULT_NAMES, initials } from './constants';
import { clonePlayer, cloneSaveData } from './serialization';
import { activeNotFolded, maxBet } from './seats';

/**
 * Estado, consultas y serialización de una partida de póker.
 * La lógica que muta el juego (acciones y flujo de la mano) vive en `PokerGame`.
 */
export class PokerGameState {
  protected deck: Card[] = [];
  protected players: PokerPlayer[];
  protected community: Card[] = [];
  protected currentPlayer = 0;
  protected dealer = -1;
  protected smallBlind: number;
  protected bigBlind: number;
  protected phase: GamePhase = 'pre-flop';
  protected minRaise: number;
  protected winner: number[] | null = null;
  protected winAmounts: number[] = [];
  protected actions: ActionType[] = [];
  protected handOver = false;
  protected gameOver = false;
  protected gameWinner: number | null = null;
  protected handNumber = 0;
  /** Contribución total de cada jugador en la mano actual (para side pots). */
  protected committed: number[] = [];
  /** Quién ha actuado en la ronda de apuestas actual. */
  protected acted: boolean[] = [];
  /** Mazo fijo opcional (tutorial/tests); si existe se usa en cada mano. */
  protected presetDeck: Card[] | null = null;
  /** Si es false, la transición entre calles se suspende hasta llamar a resolveStreet(). */
  protected autoDeal = true;
  /** La ronda actual está completa y espera a que la UI reparta la siguiente calle. */
  protected streetPending = false;

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

  // ---------- Consultas ----------

  getActivePlayers(): number[] {
    return activeNotFolded(this.players);
  }

  getPot(): number {
    return this.committed.reduce((a, b) => a + b, 0);
  }

  getCallAmount(playerIndex: number): number {
    return Math.max(0, maxBet(this.players) - this.players[playerIndex].bet);
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
      players: this.players.map(clonePlayer),
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

  // ---------- Serialización ----------

  /** Estado serializable (sin clonar) construido desde los campos internos. */
  protected snapshot(): PokerSaveData {
    return {
      players: this.players,
      community: this.community,
      currentPlayer: this.currentPlayer,
      dealer: this.dealer,
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
      phase: this.phase,
      minRaise: this.minRaise,
      winner: this.winner,
      winAmounts: this.winAmounts,
      actions: this.actions,
      handOver: this.handOver,
      gameOver: this.gameOver,
      gameWinner: this.gameWinner,
      handNumber: this.handNumber,
      committed: this.committed,
      acted: this.acted,
      deck: this.deck,
      streetPending: this.streetPending,
    };
  }

  /** Estado privado completo, listo para persistir. */
  serialize(): PokerSaveData {
    return cloneSaveData(this.snapshot());
  }

  /** Restaura el estado interno a partir de un estado persistido. */
  protected hydrate(data: PokerSaveData): void {
    const d = cloneSaveData(data);
    this.players = d.players;
    this.community = d.community;
    this.currentPlayer = d.currentPlayer;
    this.dealer = d.dealer;
    this.smallBlind = d.smallBlind;
    this.bigBlind = d.bigBlind;
    this.phase = d.phase;
    this.minRaise = d.minRaise;
    this.winner = d.winner;
    this.winAmounts = d.winAmounts;
    this.actions = d.actions;
    this.handOver = d.handOver;
    this.gameOver = d.gameOver;
    this.gameWinner = d.gameWinner;
    this.handNumber = d.handNumber;
    this.committed = d.committed;
    this.acted = d.acted;
    this.deck = d.deck;
    this.streetPending = d.streetPending;
  }
}
