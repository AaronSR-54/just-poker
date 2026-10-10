import { io, type Socket } from 'socket.io-client';
import { getPlayerId, setPlayerId } from './onlineSession';
import { onlineOrigin } from '../config/online';

let socket: Socket | null = null;

/** URL del servidor online (vacío = mismo origen). */
function socketUrl(): string {
  return onlineOrigin();
}

/**
 * Ruta del endpoint de socket.io. Es la misma en producción (Function de Vercel
 * en `/api/socket-io`) y en desarrollo (proxy de Vite a `/api/socket-io`).
 */
function socketPath(): string {
  const override = import.meta.env.VITE_ONLINE_PATH as string | undefined;
  if (override) return override;
  return '/api/socket-io';
}

/** Conecta (o reutiliza) el socket anónimo de la sesión actual. */
export function connectSocket(): Promise<Socket> {
  if (socket) {
    if (socket.connected) return Promise.resolve(socket);
    socket.auth = { playerId: getPlayerId() ?? undefined };
    socket.connect();
    return waitForConnect(socket);
  }

  socket = io(socketUrl(), {
    path: socketPath(),
    auth: { playerId: getPlayerId() ?? undefined },
    autoConnect: true,
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
  });

  // El servidor asigna (o confirma) el id anónimo; se persiste para reconectar.
  socket.on('session:id', (data: { playerId?: string }) => {
    if (data?.playerId) setPlayerId(data.playerId);
  });

  return waitForConnect(socket);
}

function waitForConnect(sock: Socket): Promise<Socket> {
  return new Promise((resolve, reject) => {
    if (sock.connected) {
      resolve(sock);
      return;
    }
    const onConnect = () => {
      cleanup();
      resolve(sock);
    };
    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      sock.off('connect', onConnect);
      sock.off('connect_error', onError);
    };
    sock.once('connect', onConnect);
    sock.once('connect_error', onError);
  });
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/** Emit con ack tipado. */
export function emitAck<T>(event: string, data?: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error('Socket no conectado'));
      return;
    }
    socket.timeout(8000).emit(event, data ?? {}, (err: Error | null, res: T) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
}
