import type { Card } from '../types';

export interface OnlineSeat {
  seat: number;
  userId: string | null;
  username: string;
  avatar: string;
  points: number;
  isAI: boolean;
}

export interface OnlineSession {
  roomId: string;
  hostId: string | null;
  type: 'public' | 'private';
  seats: OnlineSeat[];
  mySeat: number;
  isHost: boolean;
}

let session: OnlineSession | null = null;

export function setOnlineSession(s: OnlineSession): void {
  session = s;
  try {
    sessionStorage.setItem('jp-online-session', JSON.stringify(s));
  } catch {
    // ignore
  }
}

export function getOnlineSession(): OnlineSession | null {
  if (session) return session;
  try {
    const raw = sessionStorage.getItem('jp-online-session');
    if (raw) {
      session = JSON.parse(raw) as OnlineSession;
      return session;
    }
  } catch {
    // ignore
  }
  return null;
}

export function clearOnlineSession(): void {
  session = null;
  try {
    sessionStorage.removeItem('jp-online-session');
  } catch {
    // ignore
  }
}

export interface LobbyPlayer {
  userId: string;
  username: string;
  avatar: string;
  points: number;
}

export interface RoomState {
  roomId: string;
  type: 'public' | 'private';
  code?: string;
  hostId: string | null;
  started: boolean;
  players: LobbyPlayer[];
}

/** Rota el estado del juego para que mySeat quede en el índice 0. */
export function rotateIndices(count: number, mySeat: number): number[] {
  // [mySeat, mySeat+1, ..., n-1, 0, ..., mySeat-1]
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
