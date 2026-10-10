import type { Card } from '../types';
import { getLastPlayed, clearLastPlayed } from '../utils/lastPlayed';

/**
 * Ventana durante la que una sesión online se considera reanudable. Pasada
 * esta ventana desde la última actividad, la partida se da por terminada y la
 * sesión se descarta (evita ofrecer salas muertas). Alineada con la ventana de
 * expulsión por inactividad del servidor: el asiento ya habrá caducado.
 */
export const ONLINE_RESUME_WINDOW_MS = 120 * 1000;

/** Asiento ocupado por un jugador real. */
export interface OnlineSeat {
  seat: number;
  userId: string;
  username: string;
}

export interface OnlineSession {
  roomId: string;
  code: string;
  hostId: string | null;
  seats: OnlineSeat[];
  mySeat: number;
  isHost: boolean;
  playerId: string;
  playerName: string;
  /** Marca temporal de la última vez que se guardó la sesión. */
  savedAt: number;
}

const SESSION_KEY = 'jp-online-session';
const PLAYER_KEY = 'jp-online-player-id';
const NAME_KEY = 'jp-online-player-name';

let session: OnlineSession | null = null;
let playerId: string | null = null;
let playerName: string | null = null;

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * La sesión online se persiste en `localStorage` (no en `sessionStorage`) para
 * poder reincorporarse a una partida en curso aunque la app se cierre o se
 * recargue por un fallo de conexión.
 */
export function setOnlineSession(s: Omit<OnlineSession, 'savedAt'>): void {
  session = { ...s, savedAt: Date.now() };
  write(SESSION_KEY, JSON.stringify(session));
}

export function getOnlineSession(): OnlineSession | null {
  if (session) return session;
  const raw = read(SESSION_KEY);
  if (raw) {
    try {
      session = JSON.parse(raw) as OnlineSession;
      return session;
    } catch {
      // ignore
    }
  }
  return null;
}

export function clearOnlineSession(): void {
  session = null;
  remove(SESSION_KEY);
}

/**
 * Devuelve la sesión online solo si sigue dentro de la ventana de reanudación.
 * Si la superó, descarta la sesión y devuelve `null`.
 */
export function getActiveOnlineSession(): OnlineSession | null {
  const s = getOnlineSession();
  if (!s) return null;
  const last = getLastPlayed('online') ?? s.savedAt;
  if (Date.now() - last > ONLINE_RESUME_WINDOW_MS) {
    clearOnlineSession();
    clearLastPlayed('online');
    return null;
  }
  return s;
}

/** Id anónimo de sesión: permite reconectar y recuperar el asiento. */
export function getPlayerId(): string | null {
  if (playerId) return playerId;
  playerId = read(PLAYER_KEY);
  return playerId;
}

export function setPlayerId(id: string): void {
  playerId = id;
  write(PLAYER_KEY, id);
}

/** Nombre temporal elegido por el jugador, reutilizado en la sesión. */
export function getPlayerName(): string | null {
  if (playerName) return playerName;
  playerName = read(NAME_KEY);
  return playerName;
}

export function setPlayerName(name: string): void {
  playerName = name;
  write(NAME_KEY, name);
}

export interface LobbyPlayer {
  userId: string;
  username: string;
  /** El jugador dejó la sala y conserva su asiento en la ventana de gracia. */
  absent?: boolean;
}

export interface RoomState {
  roomId: string;
  code: string;
  hostId: string | null;
  started: boolean;
  players: LobbyPlayer[];
}

export interface StartingPayload {
  roomId: string;
  hostId: string | null;
  seats: OnlineSeat[];
}

/** Rota el estado del juego para que mySeat quede en el índice 0. */
export function rotateIndices(count: number, mySeat: number): number[] {
  const order: number[] = [];
  for (let i = 0; i < count; i++) {
    order.push((mySeat + i) % count);
  }
  return order;
}

export function mapIndexToRotated(originalIndex: number, mySeat: number, count: number): number {
  return (originalIndex - mySeat + count) % count;
}

export function mapRotatedToOriginal(rotatedIndex: number, mySeat: number, count: number): number {
  return (rotatedIndex + mySeat) % count;
}

export type { Card };
