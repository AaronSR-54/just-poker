import { createServer, type Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createRedisClient, roomRepositoryFrom } from '../game/roomRepository';
import { GameManager } from '../game/GameManager';
import { setupSocketHandlers } from './handlers';

/**
 * Crea el servidor HTTP con socket.io y sus handlers.
 *
 * - En Vercel, `api/socket-io.ts` lo exporta por defecto y la plataforma
 *   gestiona el `Upgrade` (la ruta pública es `/api/socket-io/socket.io`).
 * - En desarrollo, `server/index.ts` lo pone a escuchar en un puerto.
 *
 * Si hay `REDIS_URL`, las salas y el fan-out cruzan instancias mediante Redis.
 */
export function createSocketServer(): HttpServer {
  const httpServer = createServer();
  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true },
    transports: ['websocket'],
  });

  const redis = createRedisClient();
  if (redis) {
    io.adapter(createAdapter(redis, redis.duplicate()));
  }

  const gameManager = new GameManager(roomRepositoryFrom(redis));
  setupSocketHandlers(io, gameManager);

  return httpServer;
}
