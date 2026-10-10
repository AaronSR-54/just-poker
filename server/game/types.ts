export interface RoomPlayer {
  userId: string;
  username: string;
  socketId: string;
  /** Marca de tiempo desde que el jugador dejó de estar en la sala (ausente). */
  absentSince?: number;
}

/** Longitud máxima del nombre almacenado. Espejo del cliente (build target separado). */
export const MAX_NAME_LENGTH = 16;

export interface Room {
  id: string;
  code: string;
  players: RoomPlayer[];
  hostId: string | null;
  started: boolean;
  createdAt: number;
}

export interface SeatInfo {
  seat: number;
  userId: string;
  username: string;
}
