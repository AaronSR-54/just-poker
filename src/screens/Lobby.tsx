import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import RankBadge from '../components/RankBadge';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useUserStore } from '../store/userStore';
import { connectSocket, getSocket } from '../net/socket';
import {
  setOnlineSession,
  type RoomState,
  type OnlineSeat,
} from '../net/onlineSession';

const PulseDot: React.FC = () => (
  <span className="jp-pulse-dot" />
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
        className="col gap-2"
        style={{
          alignItems: 'center',
          padding: '24px 28px',
          borderRadius: 14,
          border: isYou ? '1.5px solid var(--bone)' : 'var(--jp-stroke-hair)',
          background: 'rgba(205,197,183,0.04)',
          minWidth: 160,
        }}
      >
        <Avatar name={name} size={64} />
        <div className="jp-h3" style={{ fontSize: 16, marginTop: 4 }}>
          {name}{isYou ? ' (tú)' : ''}
        </div>
        <RankBadge points={points} />
        {isHost && <span className="jp-badge neutral">Anfitrión</span>}
      </div>
    );
  }

  return (
    <div
      className="col gap-3"
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 28px',
        borderRadius: 14,
        border: '2px dashed rgba(205,197,183,0.18)',
        minWidth: 160,
        minHeight: 160,
      }}
    >
      <PulseDot />
      <div className="jp-caption" style={{ fontSize: 12 }}>Esperando…</div>
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
    <div className={isMobile ? 'col gap-3' : 'row'} style={isMobile ? { marginTop: 24 } : { justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
      <Button variant="ghost" size={isMobile ? 'sm' : undefined} onClick={leave} style={isMobile ? { alignSelf: 'flex-start' } : undefined}>
        ← Abandonar sala
      </Button>
      {isHost ? (
        <Button
          variant="primary"
          block={isMobile}
          glow
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
    <div className="col gap-2" style={{ alignItems: 'center', marginTop: 4 }}>
      <div className="jp-caption">Código de sala</div>
      <div className="row gap-2" style={{ alignItems: 'baseline' }}>
        {room.code.split('').map((c, i) => (
          <span key={i} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: isMobile ? 24 : 28 }}>{c}</span>
        ))}
      </div>
      <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(room.code || '')}>
        Copiar
      </Button>
    </div>
  );

  if (error && !room) {
    return (
      <div className="jp-screen">
        <div className="col center grow gap-4">
          <div className="jp-h2">No se pudo entrar</div>
          <div className="jp-body faint">{error}</div>
          <Button variant="outline" onClick={() => navigate('/online')}>← Volver</Button>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="jp-screen">
        <div className="jp-bar">
          <div className="brand" style={{ fontSize: 14 }}>Just <em>Poker</em></div>
          <div className="row gap-3" style={{ alignItems: 'center' }}>
            <Avatar name={user.username} size={32} />
            <RankBadge points={user.points} compact />
          </div>
        </div>

        <div className="col" style={{ flex: 1, padding: '24px 18px', justifyContent: 'space-between' }}>
          <div className="col gap-4" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <div className="jp-h3" style={{ textAlign: 'center', fontSize: 18 }}>{titleText}</div>
            {error && <div className="jp-caption" style={{ color: '#e8734a' }}>{error}</div>}
            <div className="col gap-3" style={{ width: '100%', maxWidth: 260 }}>
              {slotsData.map((s, i) => (
                <LobbySlot key={i} {...s} />
              ))}
            </div>
            {codeBlock}
          </div>
          {footer}
        </div>
      </div>
    );
  }

  return (
    <div className="jp-screen">
      <TopBar
        right={
          <div className="row gap-3" style={{ alignItems: 'center' }}>
            <Avatar name={user.username} size={40} />
            <RankBadge points={user.points} />
          </div>
        }
      />

      <div className="col" style={{ flex: 1, padding: '40px 60px', justifyContent: 'space-between' }}>
        <div className="col gap-6" style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <div className="jp-h2" style={{ textAlign: 'center' }}>{titleText}</div>
          {error && <div className="jp-caption" style={{ color: '#e8734a' }}>{error}</div>}
          <div className="row gap-4" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
            {slotsData.map((s, i) => (
              <LobbySlot key={i} {...s} />
            ))}
          </div>
          {codeBlock}
        </div>
        {footer}
      </div>
    </div>
  );
};

export default Lobby;
