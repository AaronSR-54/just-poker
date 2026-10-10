import type { RoomRepository } from './roomRepository.js';
import type { Room, RoomPlayer, SeatInfo } from './types.js';

export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;

/** Alfabeto del código de sala: `A-Z` + `2-9`, sin ambiguos (`O`, `0`, `I`, `1`, `L`). */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 4;

export type JoinResult = { ok: true } | { ok: false; error: string };

/** Reglas de negocio de las salas privadas anónimas. */
export class GameManager {
  constructor(private repo: RoomRepository) {}

  async createRoom(host: RoomPlayer): Promise<Room> {
    const code = await this.generateCode();
    const room: Room = {
      id: Math.random().toString(36).substring(2, 10),
      code,
      players: [],
      hostId: null,
      started: false,
      createdAt: Date.now(),
    };
    await this.repo.createRoom(room);
    await this.joinRoom(room, host);
    return room;
  }

  async getRoom(roomId: string): Promise<Room | null> {
    return this.repo.getRoom(roomId);
  }

  async getRoomByCode(code: string): Promise<Room | null> {
    const roomId = await this.repo.getRoomIdByCode(this.normalizeCode(code));
    if (!roomId) return null;
    return this.repo.getRoom(roomId);
  }

  async getRoomByPlayer(playerId: string): Promise<Room | null> {
    const roomId = await this.repo.getPlayerRoomId(playerId);
    if (!roomId) return null;
    return this.repo.getRoom(roomId);
  }

  async joinRoom(room: Room, player: RoomPlayer): Promise<JoinResult> {
    const existing = room.players.find((p) => p.userId === player.userId);
    if (existing) {
      existing.socketId = player.socketId;
      existing.username = player.username;
      delete existing.absentSince;
      await this.repo.updateRoom(room);
      await this.repo.setPlayerRoom(player.userId, room.id);
      return { ok: true };
    }

    if (room.started) return { ok: false, error: 'started' };
    if (room.players.length >= MAX_PLAYERS) return { ok: false, error: 'full' };

    const prevRoomId = await this.repo.getPlayerRoomId(player.userId);
    if (prevRoomId && prevRoomId !== room.id) {
      await this.leaveRoom(prevRoomId, player.userId);
    }

    room.players.push(player);
    if (!room.hostId) room.hostId = player.userId;
    await this.repo.updateRoom(room);
    await this.repo.setPlayerRoom(player.userId, room.id);
    return { ok: true };
  }

  async leaveRoom(roomId: string, playerId: string): Promise<Room | null> {
    const room = await this.repo.getRoom(roomId);
    if (!room) return null;

    room.players = room.players.filter((p) => p.userId !== playerId);
    await this.repo.clearPlayerRoom(playerId);

    if (room.hostId === playerId) {
      room.hostId = room.players[0]?.userId ?? null;
    }

    if (room.players.length === 0) {
      await this.repo.deleteRoom(roomId);
      await this.repo.clearCode(room.code);
      return null;
    }
    await this.repo.updateRoom(room);
    return room;
  }

  async renamePlayer(room: Room, playerId: string, name: string): Promise<void> {
    const player = room.players.find((p) => p.userId === playerId);
    if (!player) return;
    player.username = name;
    await this.repo.updateRoom(room);
  }

  async markStarted(room: Room): Promise<void> {
    room.started = true;
    await this.repo.updateRoom(room);
  }

  /** Asientos ocupados por los jugadores reales, en orden. */
  buildSeats(room: Room): SeatInfo[] {
    return room.players.map((p, seat) => ({
      seat,
      userId: p.userId,
      username: p.username,
    }));
  }

  /** Marca a un jugador como desconectado (conserva su asiento para reconectar). */
  async markDisconnected(room: Room, playerId: string): Promise<void> {
    const player = room.players.find((p) => p.userId === playerId);
    if (!player) return;
    player.socketId = '';
    player.absentSince = Date.now();
    await this.repo.updateRoom(room);
  }

  async promoteHost(room: Room, playerId: string | null): Promise<void> {
    room.hostId = playerId;
    await this.repo.updateRoom(room);
  }

  async saveSnapshot(roomId: string, snapshot: unknown): Promise<void> {
    await this.repo.saveSnapshot(roomId, snapshot);
  }

  async getSnapshot(roomId: string): Promise<unknown | null> {
    return this.repo.getSnapshot(roomId);
  }

  /** Normaliza un código tecleado (mayúsculas, sin espacios) para su búsqueda. */
  normalizeCode(code: string): string {
    return String(code ?? '').trim().toUpperCase();
  }

  /** Código aleatorio de 4 caracteres del alfabeto sin ambiguos. */
  private randomCode(): string {
    let code = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    return code;
  }

  /** Código alfanumérico de 4 caracteres libre. */
  private async generateCode(): Promise<string> {
    for (let i = 0; i < 100; i++) {
      const code = this.randomCode();
      const existing = await this.repo.getRoomIdByCode(code);
      if (!existing) return code;
    }
    return this.randomCode();
  }
}
