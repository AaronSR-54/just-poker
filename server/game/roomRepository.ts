import { Redis } from 'ioredis';
import type { Room } from './types.js';

/**
 * Almacén del registro de salas. En producción se respalda con Redis para que
 * cualquier instancia de la Function vea el mismo estado; sin `REDIS_URL`
 * (desarrollo) cae a memoria.
 */
export interface RoomRepository {
  createRoom(room: Room): Promise<void>;
  getRoom(roomId: string): Promise<Room | null>;
  updateRoom(room: Room): Promise<void>;
  deleteRoom(roomId: string): Promise<void>;
  getRoomIdByCode(code: string): Promise<string | null>;
  clearCode(code: string): Promise<void>;
  setPlayerRoom(playerId: string, roomId: string): Promise<void>;
  getPlayerRoomId(playerId: string): Promise<string | null>;
  clearPlayerRoom(playerId: string): Promise<void>;
  saveSnapshot(roomId: string, snapshot: unknown): Promise<void>;
  getSnapshot(roomId: string): Promise<unknown | null>;
}

/** Implementación en memoria para desarrollo / instancia única. */
export class MemoryRoomRepository implements RoomRepository {
  private rooms = new Map<string, Room>();
  private codes = new Map<string, string>();
  private playerRoom = new Map<string, string>();
  private snapshots = new Map<string, unknown>();

  async createRoom(room: Room): Promise<void> {
    this.rooms.set(room.id, room);
    this.codes.set(room.code, room.id);
  }

  async getRoom(roomId: string): Promise<Room | null> {
    return this.rooms.get(roomId) ?? null;
  }

  async updateRoom(room: Room): Promise<void> {
    this.rooms.set(room.id, room);
  }

  async deleteRoom(roomId: string): Promise<void> {
    this.rooms.delete(roomId);
    this.snapshots.delete(roomId);
  }

  async getRoomIdByCode(code: string): Promise<string | null> {
    return this.codes.get(code) ?? null;
  }

  async clearCode(code: string): Promise<void> {
    this.codes.delete(code);
  }

  async setPlayerRoom(playerId: string, roomId: string): Promise<void> {
    this.playerRoom.set(playerId, roomId);
  }

  async getPlayerRoomId(playerId: string): Promise<string | null> {
    return this.playerRoom.get(playerId) ?? null;
  }

  async clearPlayerRoom(playerId: string): Promise<void> {
    this.playerRoom.delete(playerId);
  }

  async saveSnapshot(roomId: string, snapshot: unknown): Promise<void> {
    this.snapshots.set(roomId, snapshot);
  }

  async getSnapshot(roomId: string): Promise<unknown | null> {
    return this.snapshots.get(roomId) ?? null;
  }
}

const TTL_SECONDS = 60 * 60 * 12;

/** Implementación respaldada por Redis (ioredis) para Vercel Functions. */
export class RedisRoomRepository implements RoomRepository {
  constructor(private redis: Redis) {}

  private roomKey(roomId: string): string {
    return `jp:room:${roomId}`;
  }

  private codeKey(code: string): string {
    return `jp:roomcode:${code}`;
  }

  private playerKey(playerId: string): string {
    return `jp:player:${playerId}`;
  }

  private snapshotKey(roomId: string): string {
    return `jp:snapshot:${roomId}`;
  }

  async createRoom(room: Room): Promise<void> {
    await this.redis
      .multi()
      .set(this.roomKey(room.id), JSON.stringify(room), 'EX', TTL_SECONDS)
      .set(this.codeKey(room.code), room.id, 'EX', TTL_SECONDS)
      .exec();
  }

  async getRoom(roomId: string): Promise<Room | null> {
    const raw = await this.redis.get(this.roomKey(roomId));
    return raw ? (JSON.parse(raw) as Room) : null;
  }

  async updateRoom(room: Room): Promise<void> {
    await this.redis.set(this.roomKey(room.id), JSON.stringify(room), 'EX', TTL_SECONDS);
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.redis.del(this.roomKey(roomId), this.snapshotKey(roomId));
  }

  async getRoomIdByCode(code: string): Promise<string | null> {
    return this.redis.get(this.codeKey(code));
  }

  async clearCode(code: string): Promise<void> {
    await this.redis.del(this.codeKey(code));
  }

  async setPlayerRoom(playerId: string, roomId: string): Promise<void> {
    await this.redis.set(this.playerKey(playerId), roomId, 'EX', TTL_SECONDS);
  }

  async getPlayerRoomId(playerId: string): Promise<string | null> {
    return this.redis.get(this.playerKey(playerId));
  }

  async clearPlayerRoom(playerId: string): Promise<void> {
    await this.redis.del(this.playerKey(playerId));
  }

  async saveSnapshot(roomId: string, snapshot: unknown): Promise<void> {
    await this.redis.set(this.snapshotKey(roomId), JSON.stringify(snapshot), 'EX', TTL_SECONDS);
  }

  async getSnapshot(roomId: string): Promise<unknown | null> {
    const raw = await this.redis.get(this.snapshotKey(roomId));
    return raw ? (JSON.parse(raw) as unknown) : null;
  }
}

/** Crea el cliente Redis o `null` si no hay `REDIS_URL`. */
export function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  return new Redis(url, { maxRetriesPerRequest: null });
}

export function roomRepositoryFrom(redis: Redis | null): RoomRepository {
  return redis ? new RedisRoomRepository(redis) : new MemoryRoomRepository();
}

export function createRoomRepository(): RoomRepository {
  return roomRepositoryFrom(createRedisClient());
}
