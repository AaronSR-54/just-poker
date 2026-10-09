// PARKED (Fase 3 — ver ROADMAP.md): código online conservado, fuera de las rutas activas.
import { io, type Socket } from 'socket.io-client';
import { useUserStore } from '../store/userStore';

let socket: Socket | null = null;

export interface GuestAuth {
  token: string;
  user: { id: string; username: string; avatar: string; points: number };
}

/** Obtiene (o renueva) un token de invitado y lo guarda en el store. */
export async function ensureGuestAuth(): Promise<GuestAuth> {
  const store = useUserStore.getState();
  // Si ya hay token de invitado o real, reutilizarlo
  if (store.token && store.user.id) {
    return {
      token: store.token,
      user: {
        id: store.user.id,
        username: store.user.username,
        avatar: store.user.avatar,
        points: store.user.points,
      },
    };
  }

  const res = await fetch('/api/auth/guest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: store.user.username,
      points: store.user.points,
    }),
  });
  if (!res.ok) throw new Error('No se pudo autenticar como invitado');
  const data = (await res.json()) as GuestAuth;
  store.setToken(data.token);
  store.setUser({
    id: data.user.id,
    username: data.user.username,
    avatar: data.user.avatar,
    points: data.user.points,
  });
  return data;
}

export async function connectSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const auth = await ensureGuestAuth();

  if (socket) {
    socket.auth = { token: auth.token };
    socket.connect();
    return new Promise((resolve, reject) => {
      socket!.once('connect', () => resolve(socket!));
      socket!.once('connect_error', (err) => reject(err));
    });
  }

  socket = io({
    path: '/socket.io',
    auth: { token: auth.token },
    autoConnect: true,
    transports: ['websocket', 'polling'],
  });

  return new Promise((resolve, reject) => {
    const onConnect = () => {
      cleanup();
      resolve(socket!);
    };
    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      socket!.off('connect', onConnect);
      socket!.off('connect_error', onError);
    };
    socket!.once('connect', onConnect);
    socket!.once('connect_error', onError);
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

/** Helper: emit con ack tipado. */
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
