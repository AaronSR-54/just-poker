import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import RankBadge from '../components/RankBadge';
import Badge from '../components/Badge';
import { Stagger, StaggerItem } from '../components/Animated';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useUserStore } from '../store/userStore';
import { connectSocket, getSocket } from '../net/socket';
import {
  setOnlineSession,
  type RoomState,
  type OnlineSeat,
} from '../net/onlineSession';

const PulseDot: React.FC = () => (
  <span className="relative inline-block size-2 rounded-full bg-bone">
    <span className="absolute inset-0 animate-lobby-pulse rounded-full bg-bone" />
  </span>
);

interface LobbySlotProps {
  occupied?: boolean;
  name?: string;
  points?: number;
  isHost?: boolean;
  isYou?: boolean;
}

const LobbySlot: React.FC<LobbySlotProps> = ({
  occupied = false, name, points = 0, isHost = false, isYou = false,
}) => {
  if (occupied && name) {
    return (
      <div
        className={`flex min-w-40 flex-col items-center gap-2 rounded-[14px] border-[1.5px] bg-ink-700 px-7 py-6 ${
          isYou ? 'border-bone' : 'border-bone/[0.18]'
        }`}
      >
        <Avatar name={name} size={64} />
        <div className="mt-1 font-display font-bold leading-none text-fs-400">
          {name}{isYou ? ' (tú)' : ''}
        </div>
        <RankBadge points={points} />
        {isHost && <Badge variant="neutral">Anfitrión</Badge>}
      </div>
    );
  }

  return (
    <div className="flex min-h-40 min-w-40 flex-col items-center justify-center gap-3 rounded-[14px] border-2 border-dashed border-bone/[0.18] bg-ink px-7 py-6">
      <PulseDot />
      <div className="font-body tracking-[0.04em] opacity-70 text-fs-200">Esperando…</div>
    </div>
  );
};

const Lobby: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const user = useUserStore(s => s.user);

  const [room, setRoom] = useState<RoomState | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    const countdownIntervals: ReturnType<typeof setInterval>[] = [];

    (async () => {
      try {
        await connectSocket();
        if (cancelled) return;
        const sock = getSocket()!;

        // Unirse a la sala (por si llegamos directo por URL / tras crear)
        sock.emit('room:join', { roomId }, (res: { ok: boolean; error?: string; type?: string; code?: string }) => {
          if (cancelled) return;
          if (!res?.ok) {
            setError(res?.error ?? 'No se pudo unir a la sala');
            setConnecting(false);
            return;
          }
          setConnecting(false);
        });

        const onState = (state: RoomState) => {
          setRoom(state);
          setConnecting(false);
        };

        const onCountdown = (data: { seconds: number }) => {
          setCountdown(data.seconds);
          let left = data.seconds;
          const iv = setInterval(() => {
            left -= 1;
            setCountdown(left > 0 ? left : null);
            if (left <= 0) clearInterval(iv);
          }, 1000);
          countdownIntervals.push(iv);
        };

        const onStarting = (data: {
          roomId: string;
          hostId: string | null;
          type: 'public' | 'private';
          seats: OnlineSeat[];
        }) => {
          if (startedRef.current) return;
          startedRef.current = true;
          const myUserId = useUserStore.getState().user.id;
          const mySeat = data.seats.find(s => s.userId === myUserId)?.seat ?? 0;
          setOnlineSession({
            roomId: data.roomId,
            hostId: data.hostId,
            type: data.type,
            seats: data.seats,
            mySeat,
            isHost: data.hostId === myUserId,
          });
          navigate(`/game/online-${data.roomId}`);
        };

        const onClosed = () => {
          setError('La sala se ha cerrado');
        };

        sock.on('room:state', onState);
        sock.on('room:countdown', onCountdown);
        sock.on('room:starting', onStarting);
        sock.on('room:closed', onClosed);

        return () => {
          sock.off('room:state', onState);
          sock.off('room:countdown', onCountdown);
          sock.off('room:starting', onStarting);
          sock.off('room:closed', onClosed);
        };
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error de conexión');
          setConnecting(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      for (const iv of countdownIntervals) clearInterval(iv);
    };
  }, [roomId, navigate]);

  const leave = () => {
    if (roomId) getSocket()?.emit('room:leave', { roomId });
    navigate('/online');
  };

  const start = () => {
    if (!roomId) return;
    getSocket()?.emit('room:start', { roomId }, (res: { ok: boolean; error?: string }) => {
      if (!res?.ok) setError(res?.error ?? 'No se pudo empezar');
    });
  };

  const isHost = room?.hostId === user.id;
  const count = room?.players.length ?? 0;
  const isPrivate = room?.type === 'private';

  const titleText = (() => {
    if (countdown !== null) return `La partida empieza en ${countdown}s`;
    if (connecting) return 'Conectando…';
    if (count >= 4) return 'Sala completa';
    if (isPrivate) return 'Sala privada — esperando jugadores';
    return 'Buscando jugadores…';
  })();

  const slotsData: LobbySlotProps[] = Array.from({ length: 4 }).map((_, i) => {
    const p = room?.players[i];
    if (!p) return { occupied: false };
    return {
      occupied: true,
      name: p.username,
      points: p.points,
      isHost: p.userId === room?.hostId,
      isYou: p.userId === user.id,
    };
  });

  const footer = (
    <div className={isMobile ? 'mt-6 flex flex-col gap-3' : 'mt-4 flex items-center justify-between'}>
      <Button variant="ghost" size={isMobile ? 'sm' : undefined} onClick={leave} className={isMobile ? 'self-start' : undefined}>
        ← Abandonar sala
      </Button>
      {isHost ? (
        <Button
          variant="primary"
          block={isMobile}
          disabled={count < 1 || countdown !== null}
          onClick={start}
        >
          {count >= 2 ? 'Empezar ahora' : 'Empezar (con IA)'}
        </Button>
      ) : (
        <Button variant="outline" block={isMobile} disabled>
          {countdown !== null ? `Empieza en ${countdown}s` : 'Esperando al anfitrión…'}
        </Button>
      )}
    </div>
  );

  const codeBlock = isPrivate && room?.code && (
    <div className="mt-1 flex flex-col items-center gap-2">
      <div className="font-body text-fs-100 tracking-[0.04em] opacity-70">Código de sala</div>
      <div className="flex items-baseline gap-2">
        {room.code.split('').map((c, i) => (
          <span key={i} className={`font-display font-bold ${isMobile ? 'text-[1.5rem]' : 'text-[1.75rem]'}`}>{c}</span>
        ))}
      </div>
      <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(room.code || '')}>
        Copiar
      </Button>
    </div>
  );

  if (error && !room) {
    return (
      <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="font-display font-bold leading-none tracking-[-0.01em] text-fs-700">No se pudo entrar</div>
          <div className="font-body leading-[1.45] text-fs-300 opacity-40">{error}</div>
          <Button variant="outline" className="rounded-[0.875rem]!" onClick={() => navigate('/online')}>← Volver</Button>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
        <div className="flex shrink-0 items-center justify-between border-b border-bone/10 bg-ink px-[1.125rem] py-[0.875rem] font-display font-bold tracking-[0.02em]">
          <div className="font-display font-bold text-fs-300 uppercase tracking-[0.08em]">Just <em className="font-light italic tracking-normal">Poker</em></div>
          <div className="flex items-center gap-3">
            <Avatar name={user.username} size={32} />
            <RankBadge points={user.points} compact />
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-between overflow-y-auto px-[1.125rem] py-6">
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <div className="text-center font-display font-bold leading-none text-[1.125rem]">{titleText}</div>
            {error && <div className="font-body text-fs-100 tracking-[0.04em] opacity-70 text-danger">{error}</div>}
            <Stagger className="flex w-full max-w-[260px] flex-col gap-3" stagger={0.08} delay={0.1}>
              {slotsData.map((s, i) => (
                <StaggerItem key={i}>
                  <LobbySlot {...s} />
                </StaggerItem>
              ))}
            </Stagger>
            {codeBlock}
          </div>
          {footer}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
      <TopBar
        right={
          <div className="flex items-center gap-3">
            <Avatar name={user.username} size={40} />
            <RankBadge points={user.points} />
          </div>
        }
      />

      <div className="flex flex-1 flex-col justify-between px-[3.75rem] py-10">
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="font-display font-bold leading-none tracking-[-0.01em] text-center text-fs-700">{titleText}</div>
          {error && <div className="font-body text-fs-100 tracking-[0.04em] opacity-70 text-danger">{error}</div>}
          <Stagger className="flex flex-wrap justify-center gap-4" stagger={0.08} delay={0.1}>
            {slotsData.map((s, i) => (
              <StaggerItem key={i}>
                <LobbySlot {...s} />
              </StaggerItem>
            ))}
          </Stagger>
          {codeBlock}
        </div>
        {footer}
      </div>
    </div>
  );
};

export default Lobby;
