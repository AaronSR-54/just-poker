import type { Dispatch, SetStateAction } from 'react';
import type { Socket } from 'socket.io-client';
import type { Card } from '../types';
import type { PokerGame, PokerState, PokerSaveData } from '../game/poker';
import type { LobbyPlayer, OnlineSession, OnlineSeat } from './onlineSession';

export interface RoomListenerContext {
  sock: Socket;
  sess: OnlineSession;
  seatsRef: { current: OnlineSeat[] };
  gameRef: { current: PokerGame | null };
  holeCardsRef: { current: Card[] };
  isHostRef: { current: boolean };
  absentRef: { current: Set<string> };
  applyRotated: (raw: PokerState, mySeat: number, myCards?: Card[]) => void;
  broadcast: (g: PokerGame, sess: OnlineSession) => void;
  hostApply: (seat: number, type: string, amount?: number) => void;
  hostPush: () => void;
  setState: Dispatch<SetStateAction<PokerState | null>>;
  onHostChange: (hostId: string | null) => void;
  onResume: (snapshot: PokerSaveData | null) => void;
}

/** Registra los listeners de una sala online y devuelve el cleanup. */
export function registerRoomListeners(ctx: RoomListenerContext): () => void {
  const {
    sock, sess, seatsRef, gameRef, holeCardsRef, isHostRef, absentRef,
    applyRotated, broadcast, hostApply, hostPush, setState,
    onHostChange, onResume,
  } = ctx;

  const onState = (data: { state: PokerState }) => {
    if (isHostRef.current) return;
    applyRotated(data.state, sess.mySeat);
  };

  const onHole = (data: { cards: Card[] }) => {
    holeCardsRef.current = data.cards ?? [];
    setState((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        players: prev.players.map((p, i) => (i === 0 ? { ...p, cards: holeCardsRef.current } : p)),
      };
    });
  };

  const onPeerAction = (data: { userId: string; type: string; amount?: number }) => {
    if (!isHostRef.current) return;
    const seat = seatsRef.current.find((s) => s.userId === data.userId);
    if (!seat) return;
    hostApply(seat.seat, data.type, data.amount);
  };

  const onSyncRequest = () => {
    if (!isHostRef.current || !gameRef.current) return;
    broadcast(gameRef.current, sess);
  };

  /** Un rival se desconecta: se retira (fold) si tenía el turno y queda marcado ausente. */
  const onPeerLeft = (data: { userId: string }) => {
    if (!isHostRef.current) return;
    absentRef.current.add(data.userId);
    const g = gameRef.current;
    if (!g) return;
    const seat = seatsRef.current.find((s) => s.userId === data.userId);
    if (!seat) return;
    const raw = g.getState();
    if (!raw.handOver && raw.currentPlayer === seat.seat) {
      g.fold(seat.seat);
      hostPush();
    }
  };

  /** El servidor expulsa a un ausente: se elimina su asiento del juego. */
  const onPeerExpelled = (data: { userId: string }) => {
    if (!isHostRef.current) return;
    absentRef.current.delete(data.userId);
    const g = gameRef.current;
    if (!g) return;
    const seat = seatsRef.current.find((s) => s.userId === data.userId);
    if (!seat) return;
    g.eliminate(seat.seat);
    hostPush();
  };

  /** La sala informa de quién sigue presente: se refresca la ausencia. */
  const onRoomState = (state: { players: LobbyPlayer[] }) => {
    if (!isHostRef.current) return;
    absentRef.current = new Set(state.players.filter((p) => p.absent).map((p) => p.userId));
  };

  const onRestart = () => {
    if (isHostRef.current) return;
    holeCardsRef.current = [];
    sock.emit('game:sync', { roomId: sess.roomId });
  };

  const onHost = (data: { hostId: string | null }) => {
    onHostChange(data.hostId ?? null);
  };

  const onResumeEvent = (data: { snapshot: PokerSaveData | null }) => {
    onResume(data?.snapshot ?? null);
  };

  sock.on('game:state', onState);
  sock.on('game:holecards', onHole);
  sock.on('game:peer-action', onPeerAction);
  sock.on('game:sync-request', onSyncRequest);
  sock.on('game:peer-left', onPeerLeft);
  sock.on('game:peer-expelled', onPeerExpelled);
  sock.on('room:state', onRoomState);
  sock.on('game:restart', onRestart);
  sock.on('room:host', onHost);
  sock.on('game:resume', onResumeEvent);

  return () => {
    sock.off('game:state', onState);
    sock.off('game:holecards', onHole);
    sock.off('game:peer-action', onPeerAction);
    sock.off('game:sync-request', onSyncRequest);
    sock.off('game:peer-left', onPeerLeft);
    sock.off('game:peer-expelled', onPeerExpelled);
    sock.off('room:state', onRoomState);
    sock.off('game:restart', onRestart);
    sock.off('room:host', onHost);
    sock.off('game:resume', onResumeEvent);
  };
}
