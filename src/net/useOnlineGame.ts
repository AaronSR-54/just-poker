import { useState, useEffect, useRef, useCallback } from 'react';
import type { Card } from '../types';
import { PokerGame, type PokerState } from '../game/poker';
import { PERSONALITIES } from '../ai/personalities';
import { createAIPlayer, getAIAction, type AIPlayer } from '../ai/aiPlayer';
import { connectSocket, getSocket } from './socket';
import {
  getOnlineSession,
  clearOnlineSession,
  mapIndexToRotated,
  mapRotatedToOriginal,
  type OnlineSession,
  type OnlineSeat,
} from './onlineSession';
import { POINTS_BY_PLACE, useUserStore } from '../store/userStore';

const REMOTE_TIMEOUT_MS = 35000;

function sanitizeForBroadcast(state: PokerState): PokerState {
  if (state.showdown || state.handOver) {
    return {
      ...state,
      players: state.players.map(p => ({ ...p, cards: [...p.cards] })),
      community: [...state.community],
      winner: state.winner ? [...state.winner] : null,
      winAmounts: [...state.winAmounts],
      actions: [...state.actions],
    };
  }
  return {
    ...state,
    players: state.players.map(p => ({
      ...p,
      cards: p.cards.length > 0 ? [] : [], // ocultar cartas
    })),
    community: [...state.community],
    winner: state.winner ? [...state.winner] : null,
    winAmounts: [...state.winAmounts],
    actions: [...state.actions],
  };
}

function rotateState(state: PokerState, mySeat: number): PokerState {
  const n = state.players.length;
  const order = Array.from({ length: n }, (_, i) => (mySeat + i) % n);
  const players = order.map(i => ({ ...state.players[i], cards: [...state.players[i].cards] }));
  // Reasignar ids a posiciones rotadas para la UI (id = índice visual)
  const playersUi = players.map((p, i) => ({ ...p, id: i }));
  const map = (idx: number) => mapIndexToRotated(idx, mySeat, n);

  return {
    ...state,
    players: playersUi,
    currentPlayer: map(state.currentPlayer),
    dealer: map(state.dealer),
    winner: state.winner ? state.winner.map(map) : null,
    winAmounts: order.map(i => state.winAmounts[i] ?? 0),
    gameWinner: state.gameWinner !== null ? map(state.gameWinner) : null,
    actions: state.actions.map(a => ({
      ...a,
      playerIndex: map(a.playerIndex),
    })),
    community: [...state.community],
  };
}

export interface OnlineGameApi {
  state: PokerState | null;
  session: OnlineSession | null;
  loading: boolean;
  error: string | null;
  handleAction: (action: 'fold' | 'check' | 'call' | 'raise', amount?: number) => void;
  startNewHand: () => void;
  restartGame: () => void;
  leave: () => void;
  rivalPoints: (visualIndex: number) => number;
}

export function useOnlineGame(roomId: string | undefined): OnlineGameApi {
  const [state, setState] = useState<PokerState | null>(null);
  const [session, setSession] = useState<OnlineSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const gameRef = useRef<PokerGame | null>(null);
  const aiRef = useRef<Map<number, AIPlayer>>(new Map());
  const seatsRef = useRef<OnlineSeat[]>([]);
  const sessionRef = useRef<OnlineSession | null>(null);
  const remoteTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const recordedHandRef = useRef(0);
  const recordedGameRef = useRef(false);
  const holeCardsRef = useRef<Card[]>([]);

  const recordHand = useUserStore(s => s.recordHand);
  const recordGame = useUserStore(s => s.recordGame);

  const clearRemoteTimers = () => {
    for (const t of remoteTimers.current.values()) clearTimeout(t);
    remoteTimers.current.clear();
  };

  const broadcast = useCallback((g: PokerGame, sess: OnlineSession) => {
    const sock = getSocket();
    if (!sock) return;
    const raw = g.getState();
    const publicState = sanitizeForBroadcast(raw);
    sock.emit('game:state', { roomId: sess.roomId, state: publicState });

    // Enviar cartas privadas a cada humano
    for (const seat of seatsRef.current) {
      if (seat.isAI || !seat.userId) continue;
      const cards = raw.players[seat.seat]?.cards ?? [];
      // En showdown ya van en el estado público; igual reenviamos
      sock.emit('game:holecards', {
        roomId: sess.roomId,
        targetUserId: seat.userId,
        cards: raw.showdown || raw.handOver ? cards : cards,
      });
    }
  }, []);

  const applyRotated = useCallback((raw: PokerState, mySeat: number, myCards?: Card[]) => {
    let next = rotateState(raw, mySeat);
    if (myCards && myCards.length > 0 && !raw.showdown) {
      // Inyectar mis cartas en el índice 0
      next = {
        ...next,
        players: next.players.map((p, i) =>
          i === 0 ? { ...p, cards: myCards } : p
        ),
      };
    } else if (!raw.showdown && holeCardsRef.current.length > 0) {
      next = {
        ...next,
        players: next.players.map((p, i) =>
          i === 0 ? { ...p, cards: holeCardsRef.current } : p
        ),
      };
    }
    setState(next);
  }, []);

  const hostPush = useCallback(() => {
    const g = gameRef.current;
    const sess = sessionRef.current;
    if (!g || !sess || !sess.isHost) return;
    const raw = g.getState();
    broadcast(g, sess);
    applyRotated(raw, sess.mySeat, raw.players[sess.mySeat]?.cards);
  }, [broadcast, applyRotated]);

  // ---- Host: aplicar acción en asiento real ----
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

  // ---- Host: timers para humanos remotos ----
  const scheduleRemoteTimeouts = useCallback(() => {
    clearRemoteTimers();
    const g = gameRef.current;
    const sess = sessionRef.current;
    if (!g || !sess?.isHost) return;
    const s = g.getState();
    if (s.handOver) return;

    const seat = s.currentPlayer;
    const seatInfo = seatsRef.current[seat];
    if (!seatInfo || seatInfo.isAI) return;
    // Si es el host mismo, el timer lo gestiona la UI
    if (seat === sess.mySeat) return;

    const t = setTimeout(() => {
      const cur = gameRef.current?.getState();
      if (!cur || cur.currentPlayer !== seat || cur.handOver) return;
      const g2 = gameRef.current!;
      if (g2.canCheck(seat)) g2.check(seat);
      else g2.fold(seat);
      hostPush();
    }, REMOTE_TIMEOUT_MS);
    remoteTimers.current.set(seat, t);
  }, [hostPush]);

  // ---- Host: turnos IA ----
  useEffect(() => {
    if (!session?.isHost || !state) return;
    // state está rotado; trabajar con el juego real
    const g = gameRef.current;
    if (!g) return;
    const raw = g.getState();
    if (raw.handOver) return;

    const seat = raw.currentPlayer;
    const seatInfo = seatsRef.current[seat];
    // Solo IA o asientos convertidos a IA
    if (!seatInfo?.isAI && seatInfo?.userId) {
      scheduleRemoteTimeouts();
      return;
    }

    const ai = aiRef.current.get(seat);
    if (!ai) {
      // Asiento humano desconectado: auto check/fold
      const t = setTimeout(() => {
        const cur = g.getState();
        if (cur.currentPlayer !== seat || cur.handOver) return;
        if (g.canCheck(seat)) g.check(seat);
        else g.fold(seat);
        hostPush();
      }, 600);
      return () => clearTimeout(t);
    }

    let cancelled = false;
    getAIAction(ai, raw).then((action) => {
      if (cancelled || !gameRef.current) return;
      const cur = gameRef.current.getState();
      if (cur.currentPlayer !== seat || cur.handOver) return;
      if (action.type === 'fold') gameRef.current.fold(seat);
      else if (action.type === 'check') gameRef.current.check(seat);
      else if (action.type === 'call') gameRef.current.call(seat);
      else if (action.type === 'raise') gameRef.current.raise(seat, action.amount || cur.minRaise);
      hostPush();
    });
    return () => { cancelled = true; };
  }, [state, session?.isHost, hostPush, scheduleRemoteTimeouts]);

  // ---- Registrar stats (solo host reporta result; todos registran localmente en game:result) ----
  useEffect(() => {
    if (!state || !session?.isHost) return;
    const g = gameRef.current;
    if (!g) return;
    const raw = g.getState();
    if (!raw.handOver || raw.gameOver) return;
    if (recordedHandRef.current === raw.handNumber) return;
    recordedHandRef.current = raw.handNumber;
    // hands se registran en game:result para todos
  }, [state, session?.isHost]);

  useEffect(() => {
    if (!state?.gameOver || !session?.isHost || recordedGameRef.current) return;
    recordedGameRef.current = true;
    const g = gameRef.current;
    if (!g) return;
    const raw = g.getState();
    const standings = [...raw.players].sort((a, b) => {
      if (a.id === raw.gameWinner) return -1;
      if (b.id === raw.gameWinner) return 1;
      return b.chips - a.chips;
    });
    const places = standings.map((p, i) => {
      const seat = seatsRef.current[p.id];
      const place = (i + 1) as 1 | 2 | 3 | 4;
      const pts = session.type === 'public' ? (POINTS_BY_PLACE[place] ?? 0) : 0;
      return { userId: seat?.userId ?? `ai-${p.id}`, place, pts };
    });
    getSocket()?.emit('game:result', { roomId: session.roomId, places });
  }, [state?.gameOver, session]);

  // ---- Init ----
  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;

    (async () => {
      try {
        const sess = getOnlineSession();
        if (!sess || sess.roomId !== roomId) {
          setError('Sesión online no encontrada. Vuelve al lobby.');
          setLoading(false);
          return;
        }
        sessionRef.current = sess;
        seatsRef.current = sess.seats;
        setSession(sess);

        await connectSocket();
        if (cancelled) return;
        const sock = getSocket()!;

        if (sess.isHost) {
          // Crear el juego con nombres de seats
          const names = sess.seats.map(s => s.username);
          const g = new PokerGame(4, 10, 20, names);
          gameRef.current = g;

          // IAs para asientos vacíos
          const ais = new Map<number, AIPlayer>();
          const personalities = PERSONALITIES.medium;
          let aiIdx = 0;
          for (const seat of sess.seats) {
            if (seat.isAI) {
              const p = personalities[aiIdx % personalities.length];
              ais.set(seat.seat, createAIPlayer(seat.seat, { ...p, name: seat.username }));
              aiIdx++;
            }
          }
          aiRef.current = ais;

          g.startHand();
          hostPush();
        } else {
          // Pedir sync al host
          sock.emit('game:sync', { roomId: sess.roomId });
        }

        // Listeners
        const onState = (data: { state: PokerState }) => {
          if (sess.isHost) return; // el host ya tiene el suyo
          applyRotated(data.state, sess.mySeat);
        };

        const onHole = (data: { cards: Card[] }) => {
          holeCardsRef.current = data.cards ?? [];
          setState(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              players: prev.players.map((p, i) =>
                i === 0 ? { ...p, cards: holeCardsRef.current } : p
              ),
            };
          });
        };

        const onPeerAction = (data: { userId: string; type: string; amount?: number }) => {
          if (!sess.isHost) return;
          const seat = seatsRef.current.find(s => s.userId === data.userId);
          if (!seat) return;
          hostApply(seat.seat, data.type, data.amount);
        };

        const onSyncRequest = (_data: { userId: string }) => {
          if (!sess.isHost || !gameRef.current) return;
          broadcast(gameRef.current, sess);
        };

        const onPeerLeft = (data: { userId: string }) => {
          if (!sess.isHost) return;
          const seat = seatsRef.current.find(s => s.userId === data.userId);
          if (!seat) return;
          // Convertir a IA
          seat.isAI = true;
          seat.userId = null;
          const personalities = PERSONALITIES.medium;
          const p = personalities[seat.seat % personalities.length];
          aiRef.current.set(seat.seat, createAIPlayer(seat.seat, { ...p, name: seat.username }));
          // Si era su turno, la IA actuará en el próximo efecto
          hostPush();
        };

        const onResult = (data: { places: { userId: string; place: number; pts: number }[]; type: string }) => {
          const me = useUserStore.getState().user;
          const mine = data.places.find(p => p.userId === me.id);
          if (!mine) return;
          const rivals = data.places
            .filter(p => p.userId !== me.id)
            .map(p => {
              const seat = seatsRef.current.find(s => s.userId === p.userId);
              return seat?.username ?? 'Rival';
            });
          recordHand(mine.place === 1);
          recordGame({
            place: mine.place as 1 | 2 | 3 | 4,
            pts: mine.pts,
            rivals,
            mode: 'online',
          });
        };

        const onRestart = () => {
          if (sess.isHost) return;
          recordedGameRef.current = false;
          recordedHandRef.current = 0;
          holeCardsRef.current = [];
          sock.emit('game:sync', { roomId: sess.roomId });
        };

        sock.on('game:state', onState);
        sock.on('game:holecards', onHole);
        sock.on('game:peer-action', onPeerAction);
        sock.on('game:sync-request', onSyncRequest);
        sock.on('game:peer-left', onPeerLeft);
        sock.on('game:result', onResult);
        sock.on('game:restart', onRestart);

        setLoading(false);

        return () => {
          sock.off('game:state', onState);
          sock.off('game:holecards', onHole);
          sock.off('game:peer-action', onPeerAction);
          sock.off('game:sync-request', onSyncRequest);
          sock.off('game:peer-left', onPeerLeft);
          sock.off('game:result', onResult);
          sock.off('game:restart', onRestart);
        };
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error de conexión');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      clearRemoteTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const handleAction = useCallback((action: 'fold' | 'check' | 'call' | 'raise', amount?: number) => {
    const sess = sessionRef.current;
    if (!sess) return;

    if (sess.isHost) {
      hostApply(sess.mySeat, action, amount);
      return;
    }

    getSocket()?.emit('game:action', {
      roomId: sess.roomId,
      type: action,
      amount,
    });
  }, [hostApply]);

  const startNewHand = useCallback(() => {
    const sess = sessionRef.current;
    const g = gameRef.current;
    if (!sess?.isHost || !g) return;
    g.startHand();
    hostPush();
  }, [hostPush]);

  const restartGame = useCallback(() => {
    const sess = sessionRef.current;
    const g = gameRef.current;
    if (!sess?.isHost || !g) return;
    recordedGameRef.current = false;
    recordedHandRef.current = 0;
    g.reset();
    g.startHand();
    getSocket()?.emit('game:restart', { roomId: sess.roomId });
    hostPush();
  }, [hostPush]);

  const leave = useCallback(() => {
    const sess = sessionRef.current;
    if (sess) {
      getSocket()?.emit('room:leave', { roomId: sess.roomId });
    }
    clearOnlineSession();
    clearRemoteTimers();
  }, []);

  const rivalPoints = useCallback((visualIndex: number) => {
    const sess = sessionRef.current;
    if (!sess) return 100;
    // visual 0 = me; visual i = original seat
    const orig = mapRotatedToOriginal(visualIndex, sess.mySeat, 4);
    return seatsRef.current[orig]?.points ?? 100;
  }, []);

  return {
    state,
    session,
    loading,
    error,
    handleAction,
    startNewHand,
    restartGame,
    leave,
    rivalPoints,
  };
}


