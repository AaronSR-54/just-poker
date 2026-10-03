import { Server, Socket } from 'socket.io';
import { verifyToken } from '../middleware/auth.js';
import { gameManager, type RoomPlayer } from '../game/GameManager.js';

type Ack<T = unknown> = (res: T) => void;

function playerFromSocket(socket: Socket): RoomPlayer {
  return {
    userId: socket.data.userId as string,
    username: socket.data.username as string,
    avatar: socket.data.avatar as string,
    points: (socket.data.points as number) || 0,
    socketId: socket.id,
  };
}

function broadcastRoom(io: Server, roomId: string): void {
  const room = gameManager.getRoom(roomId);
  if (!room) {
    io.to(roomId).emit('room:closed');
    return;
  }
  io.to(roomId).emit('room:state', gameManager.publicState(room));
}

function startRoom(io: Server, roomId: string): void {
  const room = gameManager.getRoom(roomId);
  if (!room || room.started || room.players.length < 1) return;

  gameManager.markStarted(room);
  const seats = gameManager.buildSeats(room);
  io.to(roomId).emit('room:starting', {
    roomId: room.id,
    hostId: room.hostId,
    type: room.type,
    seats,
  });
}

function maybeAutoStart(io: Server, roomId: string): void {
  const room = gameManager.getRoom(roomId);
  if (!room || room.started || room.type !== 'public') return;
  if (room.players.length < 4) return;
  if (room.countdownTimer) return;

  io.to(roomId).emit('room:countdown', { seconds: 3 });
  room.countdownTimer = setTimeout(() => {
    startRoom(io, roomId);
  }, 3000);
}

export function setupSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    const token = socket.handshake.auth.token as string;
    const user = verifyToken(token);

    if (!user) {
      socket.emit('error', { message: 'No autorizado' });
      socket.disconnect();
      return;
    }

    socket.data.userId = user.id;
    socket.data.username = user.username;
    socket.data.avatar = user.avatar;
    socket.data.points = user.points;

    // ---- Lobby ----

    socket.on('room:create', (data: { type?: 'public' | 'private' }, ack?: Ack) => {
      const type = data?.type === 'private' ? 'private' : 'public';
      const room = gameManager.createRoom(type);
      const result = gameManager.joinRoom(room, playerFromSocket(socket));
      if (!result.ok) {
        ack?.({ ok: false, error: result.error });
        return;
      }
      socket.join(room.id);
      broadcastRoom(io, room.id);
      ack?.({ ok: true, roomId: room.id, code: room.code, type: room.type });
    });

    socket.on('room:quick', (_data: unknown, ack?: Ack) => {
      let room = gameManager.findPublicRoom();
      if (!room) room = gameManager.createRoom('public');
      const result = gameManager.joinRoom(room, playerFromSocket(socket));
      if (!result.ok) {
        // Sala llena entre medias: crear otra
        room = gameManager.createRoom('public');
        gameManager.joinRoom(room, playerFromSocket(socket));
      }
      socket.join(room.id);
      broadcastRoom(io, room.id);
      maybeAutoStart(io, room.id);
      ack?.({ ok: true, roomId: room.id, type: 'public' });
    });

    socket.on('room:join', (data: { roomId?: string; code?: string }, ack?: Ack) => {
      let room = data?.roomId ? gameManager.getRoom(data.roomId) : undefined;
      if (!room && data?.code) room = gameManager.getRoomByCode(data.code);
      if (!room) {
        ack?.({ ok: false, error: 'Sala no encontrada' });
        return;
      }
      const result = gameManager.joinRoom(room, playerFromSocket(socket));
      if (!result.ok) {
        ack?.({ ok: false, error: result.error });
        return;
      }
      socket.join(room.id);
      broadcastRoom(io, room.id);
      maybeAutoStart(io, room.id);
      ack?.({ ok: true, roomId: room.id, code: room.code, type: room.type });
    });

    socket.on('room:leave', (data: { roomId: string }) => {
      if (!data?.roomId) return;
      socket.leave(data.roomId);
      const room = gameManager.leaveRoom(data.roomId, user.id);
      if (room) broadcastRoom(io, data.roomId);
      else io.to(data.roomId).emit('room:closed');
    });

    socket.on('room:start', (data: { roomId: string }, ack?: Ack) => {
      const room = gameManager.getRoom(data?.roomId);
      if (!room) {
        ack?.({ ok: false, error: 'Sala no encontrada' });
        return;
      }
      if (room.hostId !== user.id) {
        ack?.({ ok: false, error: 'Solo el anfitrión puede empezar' });
        return;
      }
      if (room.players.length < 1) {
        ack?.({ ok: false, error: 'No hay jugadores' });
        return;
      }
      startRoom(io, room.id);
      ack?.({ ok: true });
    });

    // ---- Juego (relay host-autoritativo) ----

    /** El host emite el estado público (cartas rivales ocultas salvo showdown). */
    socket.on('game:state', (data: { roomId: string; state: unknown }) => {
      const room = gameManager.getRoom(data?.roomId);
      if (!room || room.hostId !== user.id) return;
      socket.to(data.roomId).emit('game:state', { state: data.state });
    });

    /** El host envía cartas privadas a un jugador concreto. */
    socket.on('game:holecards', (data: { roomId: string; targetUserId: string; cards: unknown }) => {
      const room = gameManager.getRoom(data?.roomId);
      if (!room || room.hostId !== user.id) return;
      const target = room.players.find(p => p.userId === data.targetUserId);
      if (!target) return;
      io.to(target.socketId).emit('game:holecards', { cards: data.cards });
    });

    /** Un no-host pide sincronización: se reenvía al host. */
    socket.on('game:sync', (data: { roomId: string }) => {
      const room = gameManager.getRoom(data?.roomId);
      if (!room || !room.hostId) return;
      const host = room.players.find(p => p.userId === room.hostId);
      if (!host) return;
      io.to(host.socketId).emit('game:sync-request', { userId: user.id });
    });

    /** Acción de un cliente → al host. */
    socket.on('game:action', (data: { roomId: string; type: string; amount?: number }) => {
      const room = gameManager.getRoom(data?.roomId);
      if (!room || !room.hostId) return;
      // El host no necesita su propia acción por socket
      if (room.hostId === user.id) return;
      const host = room.players.find(p => p.userId === room.hostId);
      if (!host) return;
      io.to(host.socketId).emit('game:peer-action', {
        userId: user.id,
        type: data.type,
        amount: data.amount,
      });
    });

    /** Resultado final de la partida (host). */
    socket.on('game:result', (data: { roomId: string; places: { userId: string; place: number; pts: number }[] }) => {
      const room = gameManager.getRoom(data?.roomId);
      if (!room || room.hostId !== user.id) return;
      io.to(data.roomId).emit('game:result', { places: data.places, type: room.type });
    });

    socket.on('game:restart', (data: { roomId: string }) => {
      const room = gameManager.getRoom(data?.roomId);
      if (!room || room.hostId !== user.id) return;
      socket.to(data.roomId).emit('game:restart');
    });

    socket.on('disconnect', () => {
      const room = gameManager.getPlayerRoom(user.id);
      if (!room) return;

      if (!room.started) {
        const left = gameManager.leaveRoom(room.id, user.id);
        if (left) broadcastRoom(io, room.id);
        else io.to(room.id).emit('room:closed');
        return;
      }

      // Partida en curso: avisar al host (el asiento pasa a IA)
      const host = room.players.find(p => p.userId === room.hostId);
      if (host && host.userId !== user.id) {
        io.to(host.socketId).emit('game:peer-left', { userId: user.id });
      }
      // Actualizar socketId a vacío (ya no hay conexión)
      const p = room.players.find(pl => pl.userId === user.id);
      if (p) p.socketId = '';
    });
  });
}
