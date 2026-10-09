// PARKED (Fase 3 — ver ROADMAP.md): registro de listeners del online conservado.
import type { Dispatch, SetStateAction } from 'react';
import type { Socket } from 'socket.io-client';
import type { Card } from '../types';
import type { PokerGame, PokerState } from '../game/poker';
import { PERSONALITIES } from '../ai/personalities';
import { createAIPlayer, type AIPlayer } from '../ai/aiPlayer';
import { useUserStore } from '../store/userStore';
import type { OnlineSession, OnlineSeat } from './onlineSession';

export interface RoomListenerContext {
  sock: Socket;
  sess: OnlineSession;
  seatsRef: { current: OnlineSeat[] };
  aiRef: { current: Map<number, AIPlayer> };
  gameRef: { current: PokerGame | null };
  holeCardsRef: { current: Card[] };
  recordedGameRef: { current: boolean };
  recordedHandRef: { current: number };
  applyRotated: (raw: PokerState, mySeat: number, myCards?: Card[]) => void;
  broadcast: (g: PokerGame, sess: OnlineSession) => void;
  hostApply: (seat: number, type: string, amount?: number) => void;
  hostPush: () => void;
  setState: Dispatch<SetStateAction<PokerState | null>>;
  recordHand: (won: boolean) => void;
  recordGame: (record: { place: 1 | 2 | 3 | 4; pts: number; rivals: string[]; mode: 'online' }) => void;
}

/** Registra los listeners de socket de una sala y devuelve el cleanup. */
export function registerRoomListeners(ctx: RoomListenerContext): () => void {
  const {
    sock, sess, seatsRef, aiRef, gameRef, holeCardsRef,
    recordedGameRef, recordedHandRef, applyRotated, broadcast,
    hostApply, hostPush, setState, recordHand, recordGame,
  } = ctx;

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

  return () => {
    sock.off('game:state', onState);
    sock.off('game:holecards', onHole);
    sock.off('game:peer-action', onPeerAction);
    sock.off('game:sync-request', onSyncRequest);
    sock.off('game:peer-left', onPeerLeft);
    sock.off('game:result', onResult);
    sock.off('game:restart', onRestart);
  };
}
