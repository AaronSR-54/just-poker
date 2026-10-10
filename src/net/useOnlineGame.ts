import { useState, useEffect, useRef, useCallback } from 'react';
import type { Card } from '../types';
import { PokerGame, type PokerState, type PokerSaveData } from '../game/poker';
import { connectSocket, getSocket } from './socket';
import {
  getOnlineSession,
  clearOnlineSession,
  type OnlineSession,
  type OnlineSeat,
} from './onlineSession';
import { sanitizeForBroadcast, rotateState } from './onlineGameState';
import { registerRoomListeners } from './onlineRoom';
import { scheduleStreetResolve } from '../screens/Game/hooks/streetDelay';
import { TURN_DURATION } from '../screens/Game/gameConfig';
import { t } from '../i18n';
import { onlineError } from '../utils/onlineError';
import { markPlayed } from '../utils/lastPlayed';

/** Tiempo máximo de espera del turno de un rival (misma duración que el humano). */
const REMOTE_TURN_MS = TURN_DURATION * 1000;

export interface OnlineGameApi {
  state: PokerState | null;
  session: OnlineSession | null;
  loading: boolean;
  error: string | null;
  handleAction: (action: 'fold' | 'check' | 'call' | 'raise', amount?: number) => void;
  startNewHand: () => void;
  restartGame: () => void;
  leave: () => void;
}

export function useOnlineGame(roomId: string | undefined): OnlineGameApi {
  const [state, setState] = useState<PokerState | null>(null);
  const [session, setSession] = useState<OnlineSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const gameRef = useRef<PokerGame | null>(null);
  const seatsRef = useRef<OnlineSeat[]>([]);
  const sessionRef = useRef<OnlineSession | null>(null);
  const isHostRef = useRef(false);
  const remoteTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const streetTimerRef = useRef<number | null>(null);
  const holeCardsRef = useRef<Card[]>([]);
  const absentRef = useRef<Set<string>>(new Set());

  const clearRemoteTimers = useCallback(() => {
    for (const t of remoteTimers.current.values()) clearTimeout(t);
    remoteTimers.current.clear();
  }, []);

  const cancelStreetResolve = useCallback(() => {
    if (streetTimerRef.current !== null) {
      window.clearTimeout(streetTimerRef.current);
      streetTimerRef.current = null;
    }
  }, []);

  const broadcast = useCallback((g: PokerGame, sess: OnlineSession) => {
    const sock = getSocket();
    if (!sock) return;
    const raw = g.getState();
    sock.emit('game:state', { roomId: sess.roomId, state: sanitizeForBroadcast(raw) });

    for (const seat of seatsRef.current) {
      const cards = raw.players[seat.seat]?.cards ?? [];
      sock.emit('game:holecards', { roomId: sess.roomId, targetUserId: seat.userId, cards });
    }

    // Snapshot completo para reconexión y failover del anfitrión.
    sock.emit('game:snapshot', { roomId: sess.roomId, snapshot: g.serialize() });
  }, []);

  const applyRotated = useCallback((raw: PokerState, mySeat: number, myCards?: Card[]) => {
    let next = rotateState(raw, mySeat);
    const cards = myCards && myCards.length > 0 ? myCards : holeCardsRef.current;
    if (cards.length > 0 && !raw.showdown) {
      next = {
        ...next,
        players: next.players.map((p, i) => (i === 0 ? { ...p, cards } : p)),
      };
    }
    setState(next);
  }, []);

  const hostPush = useCallback(() => {
    const g = gameRef.current;
    const sess = sessionRef.current;
    if (!g || !sess || !isHostRef.current) return;
    const raw = g.getState();
    broadcast(g, sess);
    applyRotated(raw, sess.mySeat, raw.players[sess.mySeat]?.cards);
  }, [broadcast, applyRotated]);

  const hostApply = useCallback((seat: number, type: string, amount?: number) => {
    const g = gameRef.current;
    if (!g) return;
    const s = g.getState();
    if (s.handOver || s.currentPlayer !== seat) return;

    if (type === 'fold') g.fold(seat);
    else if (type === 'check') g.check(seat);
    else if (type === 'call') g.call(seat);
    else if (type === 'raise') g.raise(seat, amount ?? s.minRaise);

    hostPush();
  }, [hostPush]);

  /** El anfitrión resuelve el turno de un rival que no responde. */
  const scheduleRemoteTimeout = useCallback(() => {
    clearRemoteTimers();
    const g = gameRef.current;
    const sess = sessionRef.current;
    if (!g || !sess || !isHostRef.current) return;
    const s = g.getState();
    if (s.handOver) return;

    const seat = s.currentPlayer;
    if (seat === sess.mySeat) return;

    const t = setTimeout(() => {
      const cur = gameRef.current?.getState();
      if (!cur || cur.currentPlayer !== seat || cur.handOver) return;
      const g2 = gameRef.current!;
      const userId = seatsRef.current.find((s) => s.seat === seat)?.userId;
      // Un rival ausente se retira; nunca hace check para no ganar sin apostar.
      if (userId && absentRef.current.has(userId)) g2.fold(seat);
      else if (g2.canCheck(seat)) g2.check(seat);
      else g2.fold(seat);
      hostPush();
    }, REMOTE_TURN_MS);
    remoteTimers.current.set(seat, t);
  }, [hostPush, clearRemoteTimers]);

  const onHostChange = useCallback((hostId: string | null) => {
    const sess = sessionRef.current;
    if (!sess) return;
    const iAmHost = hostId === sess.playerId;
    isHostRef.current = iAmHost;
    const next = { ...sess, hostId, isHost: iAmHost };
    sessionRef.current = next;
    setSession(next);
    if (iAmHost && !gameRef.current) {
      getSocket()?.emit('game:resume-request', { roomId: sess.roomId });
    }
  }, []);

  /** Restaura el juego desde un snapshot o, si no lo hay, arranca una partida nueva. */
  const onResume = useCallback((snapshot: PokerSaveData | null) => {
    const sess = sessionRef.current;
    if (!sess) return;
    if (!snapshot && gameRef.current) return;
    if (snapshot) {
      gameRef.current = PokerGame.deserialize(snapshot);
    } else {
      const names = sess.seats.map((s) => s.username);
      const game = new PokerGame(sess.seats.length, 10, 20, names);
      gameRef.current = game;
      game.startHand();
    }
    // Pausa entre calles: la UI del anfitrión llama a resolveStreet().
    gameRef.current.setAutoDeal(false);
    isHostRef.current = true;
    const next = { ...sess, isHost: true };
    sessionRef.current = next;
    setSession(next);
    hostPush();
  }, [hostPush]);

  // El anfitrión gestiona los tiempos de espera de los rivales y la pausa entre calles.
  useEffect(() => {
    if (!state || !isHostRef.current) return;
    const g = gameRef.current;
    if (!g) return;
    const raw = g.getState();

    // Pausa entre calles: reparte la calle pendiente tras el retardo y difunde.
    if (raw.streetPending) {
      clearRemoteTimers();
      cancelStreetResolve();
      streetTimerRef.current = scheduleStreetResolve(gameRef, hostPush);
      return;
    }
    cancelStreetResolve();

    if (raw.handOver || raw.gameOver) {
      clearRemoteTimers();
      return;
    }
    if (raw.currentPlayer === sessionRef.current?.mySeat) {
      clearRemoteTimers();
      return;
    }
    scheduleRemoteTimeout();
  }, [state, scheduleRemoteTimeout, clearRemoteTimers, hostPush, cancelStreetResolve]);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    let cleanupListeners: (() => void) | undefined;
    let detachConnect: (() => void) | undefined;

    (async () => {
      try {
        const sess = getOnlineSession();
        if (!sess || sess.roomId !== roomId) {
          setError(t('online.sessionMissing'));
          setLoading(false);
          return;
        }
        sessionRef.current = sess;
        seatsRef.current = sess.seats;
        isHostRef.current = sess.isHost;
        setSession(sess);

        const sock = await connectSocket();
        if (cancelled) return;

        cleanupListeners = registerRoomListeners({
          sock, sess, seatsRef, gameRef, holeCardsRef, isHostRef, absentRef,
          applyRotated, broadcast, hostApply, hostPush, setState,
          onHostChange, onResume,
        });

        // Al reconectar (corte o fin de duración de la Function), vuelve a la sala.
        const onConnect = () => {
          sock.emit('room:join', { roomId: sess.roomId, name: sess.playerName });
          if (isHostRef.current) hostPush();
          else sock.emit('game:sync', { roomId: sess.roomId });
        };
        sock.on('connect', onConnect);
        detachConnect = () => sock.off('connect', onConnect);

        // (Re)entra a la sala. Si soy host, el servidor reenvía `room:host` y pido
        // el snapshot (o creo partida nueva si no hay); si no, pido sincronización.
        sock.emit(
          'room:join',
          { roomId: sess.roomId, name: sess.playerName },
          (res: { ok: boolean; error?: string } | undefined) => {
            if (cancelled) return;
            if (!res?.ok) {
              clearOnlineSession();
              setError(onlineError(res?.error, 'online.roomGone'));
              setLoading(false);
              return;
            }
            if (!isHostRef.current) sock.emit('game:sync', { roomId: sess.roomId });
            setLoading(false);
          },
        );
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : t('online.serverError'));
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      detachConnect?.();
      cleanupListeners?.();
      clearRemoteTimers();
      cancelStreetResolve();
    };
  }, [roomId, broadcast, applyRotated, hostApply, hostPush, onHostChange, onResume, clearRemoteTimers, cancelStreetResolve]);

  // Refresca la última actividad online mientras la partida avanza (throttle).
  const lastMarkRef = useRef(0);
  useEffect(() => {
    if (!roomId || !state) return;
    const now = Date.now();
    if (now - lastMarkRef.current < 60_000) return;
    lastMarkRef.current = now;
    markPlayed('online');
  }, [roomId, state]);

  const handleAction = useCallback((action: 'fold' | 'check' | 'call' | 'raise', amount?: number) => {
    const sess = sessionRef.current;
    if (!sess) return;
    if (isHostRef.current) {
      hostApply(sess.mySeat, action, amount);
      return;
    }
    getSocket()?.emit('game:action', { roomId: sess.roomId, type: action, amount });
  }, [hostApply]);

  const startNewHand = useCallback(() => {
    if (!isHostRef.current || !gameRef.current) return;
    gameRef.current.startHand();
    hostPush();
  }, [hostPush]);

  const restartGame = useCallback(() => {
    const sess = sessionRef.current;
    if (!isHostRef.current || !gameRef.current || !sess) return;
    gameRef.current.reset();
    gameRef.current.startHand();
    getSocket()?.emit('game:restart', { roomId: sess.roomId });
    hostPush();
  }, [hostPush]);

  // Vuelve al menú dejando la partida reanudable: libera la plaza en la sala
  // (el servidor resuelve el turno y hace failover del anfitrión) pero conserva
  // la sesión local, para que el menú ofrezca «Continuar partida» como en local.
  const leave = useCallback(() => {
    const sess = sessionRef.current;
    if (sess) {
      markPlayed('online');
      getSocket()?.emit('room:leave', { roomId: sess.roomId });
    }
    clearRemoteTimers();
    cancelStreetResolve();
  }, [clearRemoteTimers, cancelStreetResolve]);

  return { state, session, loading, error, handleAction, startNewHand, restartGame, leave };
}
