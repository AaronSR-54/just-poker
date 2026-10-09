export interface RoomPlayer {
  userId: string;
  username: string;
  socketId: string;
}

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
