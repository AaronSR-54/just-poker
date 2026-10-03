export interface RoomPlayer {
  userId: string;
  username: string;
  avatar: string;
  points: number;
  socketId: string;
}

export interface Room {
  id: string;
  type: 'public' | 'private';
  code?: string;
  players: RoomPlayer[];
  hostId: string | null;
  started: boolean;
  countdownTimer: ReturnType<typeof setTimeout> | null;
  createdAt: Date;
}

export interface SeatInfo {
  seat: number;
  userId: string | null;
  username: string;
  avatar: string;
  points: number;
  isAI: boolean;
}

const AI_NAMES = ['Mia', 'Dan', 'Sam', 'Leo'];

class GameManager {
  rooms: Map<string, Room> = new Map();
  /** userId → roomId */
  playerRoom: Map<string, string> = new Map();

  createRoom(type: 'public' | 'private'): Room {
    const id = Math.random().toString(36).substring(2, 10);
    const room: Room = {
      id,
      type,
      players: [],
      hostId: null,
      started: false,
      countdownTimer: null,
      createdAt: new Date(),
    };
    if (type === 'private') {
      room.code = generateCode();
    }
    this.rooms.set(id, room);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomByCode(code: string): Room | undefined {
    const upper = code.toUpperCase();
    for (const room of this.rooms.values()) {
      if (room.type === 'private' && room.code === upper && !room.started) {
        return room;
      }
    }
    return undefined;
  }

  findPublicRoom(): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.type === 'public' && !room.started && room.players.length < 4) {
        return room;
      }
    }
    return undefined;
  }

  joinRoom(room: Room, player: RoomPlayer): { ok: true } | { ok: false; error: string } {
    if (room.started) return { ok: false, error: 'La partida ya ha empezado' };
    if (room.players.length >= 4) return { ok: false, error: 'Sala llena' };

    // Si el jugador ya está (reconexión), actualiza socket
    const existing = room.players.find(p => p.userId === player.userId);
    if (existing) {
      existing.socketId = player.socketId;
      existing.username = player.username;
      existing.avatar = player.avatar;
      existing.points = player.points;
      this.playerRoom.set(player.userId, room.id);
      return { ok: true };
    }

    // Quitar de otra sala si estaba
    const prevRoomId = this.playerRoom.get(player.userId);
    if (prevRoomId && prevRoomId !== room.id) {
      this.leaveRoom(prevRoomId, player.userId);
    }

    room.players.push(player);
    if (!room.hostId) room.hostId = player.userId;
    this.playerRoom.set(player.userId, room.id);
    return { ok: true };
  }

  leaveRoom(roomId: string, userId: string): Room | undefined {
    const room = this.rooms.get(roomId);
    if (!room) return undefined;

    room.players = room.players.filter(p => p.userId !== userId);
    this.playerRoom.delete(userId);

    if (room.hostId === userId) {
      room.hostId = room.players[0]?.userId ?? null;
    }

    if (room.players.length === 0) {
      if (room.countdownTimer) clearTimeout(room.countdownTimer);
      this.rooms.delete(roomId);
      return undefined;
    }
    return room;
  }

  getPlayerRoom(userId: string): Room | undefined {
    const id = this.playerRoom.get(userId);
    return id ? this.rooms.get(id) : undefined;
  }

  /** Construye 4 asientos: humanos primero, IA de relleno. */
  buildSeats(room: Room): SeatInfo[] {
    const seats: SeatInfo[] = [];
    for (let i = 0; i < 4; i++) {
      const human = room.players[i];
      if (human) {
        seats.push({
          seat: i,
          userId: human.userId,
          username: human.username,
          avatar: human.avatar,
          points: human.points,
          isAI: false,
        });
      } else {
        const name = AI_NAMES[i] ?? `IA ${i + 1}`;
        seats.push({
          seat: i,
          userId: null,
          username: name,
          avatar: name.slice(0, 2).toUpperCase(),
          points: 100 * (i + 1),
          isAI: true,
        });
      }
    }
    return seats;
  }

  markStarted(room: Room): void {
    room.started = true;
    if (room.countdownTimer) {
      clearTimeout(room.countdownTimer);
      room.countdownTimer = null;
    }
  }

  publicState(room: Room) {
    return {
      roomId: room.id,
      type: room.type,
      code: room.code,
      hostId: room.hostId,
      started: room.started,
      players: room.players.map(p => ({
        userId: p.userId,
        username: p.username,
        avatar: p.avatar,
        points: p.points,
      })),
    };
  }
}

function generateCode(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const gameManager = new GameManager();
