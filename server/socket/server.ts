import { createServer, type Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createRedisClient, roomRepositoryFrom } from '../game/roomRepository.js';
import { GameManager } from '../game/GameManager.js';
import { setupSocketHandlers } from './handlers.js';

/**
 * Path de socket.io. Debe coincidir con la ruta de la Function en Vercel
 * (`/api/socket-io`): la plataforma solo enruta esa ruta exacta al `http.Server`.
 */
export const SOCKET_PATH = '/api/socket-io';

/**
 * Crea el servidor HTTP con socket.io y sus handlers.
 *
 * - En Vercel, `api/socket-io.ts` lo exporta por defecto y la plataforma
 *   gestiona el `Upgrade`. La Function solo enruta su ruta exacta
 *   (`/api/socket-io`), así que socket.io usa ese mismo path.
 * - En desarrollo, `server/index.ts` lo pone a escuchar en un puerto.
 *
 * Si hay `REDIS_URL`, las salas y el fan-out cruzan instancias mediante Redis.
 */
export function createSocketServer(): HttpServer {
  const httpServer = createServer();
  const io = new Server(httpServer, {
    path: SOCKET_PATH,
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
