import { randomUUID } from 'crypto';
import { Server, Socket } from 'socket.io';
import { GameManager, MAX_PLAYERS, MIN_PLAYERS } from '../game/GameManager';
import { MAX_NAME_LENGTH } from '../game/types';
import type { Room, RoomPlayer } from '../game/types';

type Ack = (res: unknown) => void;

/** Ventana de gracia de un asiento ausente antes de expulsarlo de la partida. */
const ABSENT_EXPIRY_MS = parseInt(process.env.ONLINE_ABSENT_EXPIRY_MS ?? '', 10) || 120 * 1000;

interface JoinData {
  roomId?: string;
  code?: string;
  name?: string;
}

function playerFromSocket(socket: Socket): RoomPlayer {
  return {
    userId: socket.data.playerId as string,
    username: (socket.data.username as string) || '',
    socketId: socket.id,
  };
}

function publicState(room: Room) {
  return {
    roomId: room.id,
    code: room.code,
    hostId: room.hostId,
    started: room.started,
    players: room.players.map((p) => ({
      userId: p.userId,
      username: p.username,
      absent: p.socketId === '',
    })),
  };
}

export function setupSocketHandlers(io: Server, gameManager: GameManager): void {
  /** Temporizadores de expulsión por jugador ausente (`roomId:userId`). */
  const absenceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  const clearAbsenceTimer = (roomId: string, userId: string): void => {
    const key = `${roomId}:${userId}`;
    const timer = absenceTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      absenceTimers.delete(key);
    }
  };

  const scheduleAbsenceExpiry = (roomId: string, userId: string): void => {
    clearAbsenceTimer(roomId, userId);
    const key = `${roomId}:${userId}`;
    const timer = setTimeout(() => {
      void expireAbsent(roomId, userId);
    }, ABSENT_EXPIRY_MS);
    absenceTimers.set(key, timer);
  };

  /** Expulsa a un ausente: libera su asiento y avisa a la mesa. */
  const expireAbsent = async (roomId: string, userId: string): Promise<void> => {
    clearAbsenceTimer(roomId, userId);
    const room = await gameManager.getRoom(roomId);
    if (!room) return;
    const player = room.players.find((p) => p.userId === userId);
    if (!player || player.socketId) return;

    io.to(roomId).emit('game:peer-expelled', { userId });
    const left = await gameManager.leaveRoom(roomId, userId);
    if (!left) {
      io.to(roomId).emit('room:closed');
      return;
    }
    io.to(roomId).emit('room:host', { hostId: left.hostId });
  };

  /** Comprobación perezosa: expulsa a los ausentes que superaron la ventana. */
  const expireStale = async (room: Room): Promise<void> => {
    const now = Date.now();
    const stale = room.players.filter(
      (p) => p.absentSince !== undefined && now - p.absentSince >= ABSENT_EXPIRY_MS,
    );
    for (const p of stale) await expireAbsent(room.id, p.userId);
  };

  io.on('connection', (socket: Socket) => {
    // Identidad anónima de sesión: el cliente reutiliza el id para reconectar.
    const provided = socket.handshake.auth?.playerId as string | undefined;
    const playerId = provided || randomUUID();
    socket.data.playerId = playerId;
    // Sala personal: permite enviar datos privados (cartas) por `io.to(playerId)`.
    socket.join(playerId);
    socket.emit('session:id', { playerId });

    // Respaldo del temporizador: cada evento comprueba la caducidad de la sala.
    socket.use((_event, next) => {
      void gameManager
        .getRoomByPlayer(playerId)
        .then((room) => (room ? expireStale(room) : undefined))
        .catch(() => {});
      next();
    });

    const broadcastRoom = async (roomId: string): Promise<void> => {
      const room = await gameManager.getRoom(roomId);
      if (!room) {
        io.to(roomId).emit('room:closed');
        return;
      }
      io.to(roomId).emit('room:state', publicState(room));
    };

    /** Salida de un jugador (abandono o desconexión), con failover si procede. */
    const handleDeparture = async (roomId: string, who: string): Promise<void> => {
      const room = await gameManager.getRoom(roomId);
      if (!room) return;

      if (!room.started) {
        const left = await gameManager.leaveRoom(roomId, who);
        if (left) {
          await broadcastRoom(roomId);
          io.to(roomId).emit('room:host', { hostId: left.hostId });
        } else {
          io.to(roomId).emit('room:closed');
        }
        return;
      }

      await gameManager.markDisconnected(room, who);
      scheduleAbsenceExpiry(roomId, who);

      if (room.hostId === who) {
        const next = room.players.find((p) => p.userId !== who && p.socketId);
        await gameManager.promoteHost(room, next?.userId ?? null);
        io.to(roomId).emit('room:host', { hostId: room.hostId });
        if (next) {
          const snapshot = await gameManager.getSnapshot(roomId);
          if (snapshot) io.to(next.socketId).emit('game:resume', { snapshot, hostId: room.hostId });
        }
      }

      const host = room.players.find((p) => p.userId === room.hostId);
      if (host?.socketId) io.to(host.socketId).emit('game:peer-left', { userId: who });
    };

    // ---- Lobby ----

    socket.on('room:create', async (data: { name?: string }, ack?: Ack) => {
      socket.data.username = (data?.name ?? '').toString().slice(0, MAX_NAME_LENGTH);
      const room = await gameManager.createRoom(playerFromSocket(socket));
      socket.join(room.id);
      await broadcastRoom(room.id);
      ack?.({ ok: true, roomId: room.id, code: room.code, hostId: room.hostId });
    });

    socket.on('room:join', async (data: JoinData, ack?: Ack) => {
      if (data?.name) socket.data.username = data.name.toString().slice(0, MAX_NAME_LENGTH);
      let room = data?.roomId ? await gameManager.getRoom(data.roomId) : null;
      if (!room && data?.code) room = await gameManager.getRoomByCode(data.code);
      if (!room) {
        ack?.({ ok: false, error: 'notFound' });
        return;
      }

      const result = await gameManager.joinRoom(room, playerFromSocket(socket));
      if (!result.ok) {
        ack?.({ ok: false, error: result.error });
        return;
      }

      socket.join(room.id);
      clearAbsenceTimer(room.id, playerId);

      // Si es el único conectado de una partida ya empezada, recupera el rol de anfitrión.
      if (room.started && !room.hostId) {
        await gameManager.promoteHost(room, playerId);
        const snapshot = await gameManager.getSnapshot(room.id);
        if (snapshot) socket.emit('game:resume', { snapshot, hostId: room.hostId });
      }

      await broadcastRoom(room.id);

      // Comunica el anfitrión actual (por si reconecta un antiguo anfitrión).
      socket.emit('room:host', { hostId: room.hostId });

      // Quien se une (o reconecta) a una partida en curso va directo a la mesa.
      if (room.started) {
        socket.emit('room:starting', {
          roomId: room.id,
          hostId: room.hostId,
          seats: gameManager.buildSeats(room),
        });
      }

      ack?.({
        ok: true,
        roomId: room.id,
        code: room.code,
        hostId: room.hostId,
        started: room.started,
      });
    });

    socket.on('room:rename', async (data: { roomId?: string; name?: string }, ack?: Ack) => {
      const name = (data?.name ?? '').toString().trim().slice(0, MAX_NAME_LENGTH);
      if (!data?.roomId || !name) {
        ack?.({ ok: false, error: 'name' });
        return;
      }
      const room = await gameManager.getRoom(data.roomId);
      if (!room || room.started) {
        ack?.({ ok: false, error: 'rename' });
        return;
      }
      socket.data.username = name;
      await gameManager.renamePlayer(room, playerId, name);
      await broadcastRoom(room.id);
      ack?.({ ok: true });
    });

    socket.on('room:leave', async (data: { roomId?: string }) => {
      if (!data?.roomId) return;
      socket.leave(data.roomId);
      await handleDeparture(data.roomId, playerId);
    });

    socket.on('room:start', async (data: { roomId?: string }, ack?: Ack) => {
      const room = data?.roomId ? await gameManager.getRoom(data.roomId) : null;
      if (!room) {
        ack?.({ ok: false, error: 'notFound' });
        return;
      }
      if (room.hostId !== playerId) {
        ack?.({ ok: false, error: 'host' });
        return;
      }
      if (room.players.length < MIN_PLAYERS) {
        ack?.({ ok: false, error: 'players' });
        return;
      }
      if (room.players.length > MAX_PLAYERS) {
        ack?.({ ok: false, error: 'max' });
        return;
      }
      await gameManager.markStarted(room);
      io.to(room.id).emit('room:starting', {
        roomId: room.id,
        hostId: room.hostId,
        seats: gameManager.buildSeats(room),
      });
      ack?.({ ok: true });
    });

    // ---- Juego (relay host-autoritativo) ----

    socket.on('game:state', async (data: { roomId?: string; state?: unknown }) => {
      const room = data?.roomId ? await gameManager.getRoom(data.roomId) : null;
      if (!room || room.hostId !== playerId) return;
      socket.to(room.id).emit('game:state', { state: data.state });
    });

    socket.on('game:snapshot', async (data: { roomId?: string; snapshot?: unknown }) => {
      if (!data?.roomId || data.snapshot === undefined) return;
      const room = await gameManager.getRoom(data.roomId);
      if (!room || room.hostId !== playerId) return;
      await gameManager.saveSnapshot(data.roomId, data.snapshot);
    });

    socket.on('game:holecards', async (data: { roomId?: string; targetUserId?: string; cards?: unknown }) => {
      const room = data?.roomId ? await gameManager.getRoom(data.roomId) : null;
      if (!room || room.hostId !== playerId || !data?.targetUserId) return;
      io.to(data.targetUserId).emit('game:holecards', { cards: data.cards });
    });

    socket.on('game:resume-request', async (data: { roomId?: string }) => {
      const room = data?.roomId ? await gameManager.getRoom(data.roomId) : null;
      if (!room || room.hostId !== playerId) return;
      const snapshot = await gameManager.getSnapshot(room.id);
      // `snapshot` puede ser null: el cliente anfitrión creará una partida nueva.
      socket.emit('game:resume', { snapshot: snapshot ?? null, hostId: room.hostId });
    });

    socket.on('game:sync', async (data: { roomId?: string }) => {
      const room = data?.roomId ? await gameManager.getRoom(data.roomId) : null;
      if (!room || !room.hostId) return;
      const host = room.players.find((p) => p.userId === room.hostId);
      if (host?.socketId) io.to(host.socketId).emit('game:sync-request', { userId: playerId });
    });

    socket.on('game:action', async (data: { roomId?: string; type?: string; amount?: number }) => {
      const room = data?.roomId ? await gameManager.getRoom(data.roomId) : null;
      if (!room || !room.hostId || room.hostId === playerId) return;
      const host = room.players.find((p) => p.userId === room.hostId);
      if (host?.socketId) {
        io.to(host.socketId).emit('game:peer-action', {
          userId: playerId,
          type: data.type,
          amount: data.amount,
        });
      }
    });

    socket.on('game:restart', async (data: { roomId?: string }) => {
      const room = data?.roomId ? await gameManager.getRoom(data.roomId) : null;
      if (!room || room.hostId !== playerId) return;
      socket.to(room.id).emit('game:restart');
    });

    socket.on('disconnect', async () => {
      const room = await gameManager.getRoomByPlayer(playerId);
      if (!room) return;
      await handleDeparture(room.id, playerId);
    });
  });
}
