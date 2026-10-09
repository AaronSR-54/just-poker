import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import Badge from '../components/Badge';
import PageHeader from '../components/PageHeader';
import QrCode from '../components/QrCode';
import { Stagger, StaggerItem } from '../components/Animated';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useI18n } from '../i18n';
import { connectSocket, getSocket } from '../net/socket';
import {
  setOnlineSession,
  getPlayerId,
  getPlayerName,
  setPlayerName,
  type RoomState,
  type StartingPayload,
} from '../net/onlineSession';
import { randomName } from '../utils/randomName';
import { markPlayed } from '../utils/lastPlayed';
import { onlineError } from '../utils/onlineError';

const PulseDot: React.FC = () => (
  <span className="relative inline-block size-2 rounded-full bg-bone">
    <span className="absolute inset-0 animate-lobby-pulse rounded-full bg-bone" />
  </span>
);

interface LobbySlotProps {
  occupied?: boolean;
  name?: string;
  isHost?: boolean;
  isYou?: boolean;
}

const LobbySlot: React.FC<LobbySlotProps> = ({ occupied = false, name, isHost = false, isYou = false }) => {
  const { t } = useI18n();
  if (occupied && name) {
    return (
      <div
        className={`flex min-w-40 flex-col items-center gap-2 rounded-[14px] border-[1.5px] bg-ink-700 px-7 py-6 ${
          isYou ? 'border-bone' : 'border-bone/[0.18]'
        }`}
      >
        <Avatar name={name} size={64} />
        <div className="mt-1 font-display font-bold leading-none text-fs-400">
          {name}{isYou ? ` (${t('online.youBadge')})` : ''}
        </div>
        {isHost && <Badge variant="neutral">{t('online.hostBadge')}</Badge>}
      </div>
    );
  }

  return (
    <div className="flex min-h-40 min-w-40 flex-col items-center justify-center gap-3 rounded-[14px] border-2 border-dashed border-bone/[0.18] bg-ink px-7 py-6">
      <PulseDot />
      <div className="font-body text-fs-200 tracking-[0.04em] opacity-70">{t('online.waitingPlayers')}</div>
    </div>
  );
};

const Lobby: React.FC = () => {
  const { roomId, code } = useParams<{ roomId?: string; code?: string }>();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const { t } = useI18n();

  const [room, setRoom] = useState<RoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);
  const [name, setName] = useState(() => getPlayerName() ?? randomName());
  const [copied, setCopied] = useState(false);
  const startedRef = useRef(false);
  const nameRef = useRef(name);
  const roomCodeRef = useRef<string | undefined>(code);

  useEffect(() => {
    if (!roomId && !code) return;
    let cancelled = false;
    setPlayerName(nameRef.current);

    (async () => {
      try {
        await connectSocket();
        if (cancelled) return;
        const sock = getSocket()!;
        setMyId(getPlayerId());

        sock.emit(
          'room:join',
          { roomId, code, name: nameRef.current },
          (res: { ok: boolean; error?: string; started?: boolean } | undefined) => {
            if (cancelled) return;
            if (!res?.ok) {
              setError(onlineError(res?.error));
              setConnecting(false);
            }
          },
        );

        const onId = (data: { playerId?: string }) => {
          if (data?.playerId) setMyId(data.playerId);
        };
        const onState = (state: RoomState) => {
          roomCodeRef.current = state.code;
          setRoom(state);
          setConnecting(false);
        };
        const onHost = (data: { hostId: string | null }) => {
          setRoom((prev) => (prev ? { ...prev, hostId: data.hostId } : prev));
        };
        const onStarting = (data: StartingPayload) => {
          if (startedRef.current) return;
          startedRef.current = true;
          const id = getPlayerId() ?? '';
          const mySeat = Math.max(0, data.seats.findIndex((s) => s.userId === id));
          setOnlineSession({
            roomId: data.roomId,
            code: roomCodeRef.current ?? '',
            hostId: data.hostId,
            seats: data.seats,
            mySeat,
            isHost: data.hostId === id,
            playerId: id,
            playerName: nameRef.current,
          });
          markPlayed('online');
          navigate(`/game/online-${data.roomId}`);
        };
        const onClosed = () => setError(t('online.roomClosed'));

        sock.on('session:id', onId);
        sock.on('room:state', onState);
        sock.on('room:host', onHost);
        sock.on('room:starting', onStarting);
        sock.on('room:closed', onClosed);
      } catch {
        if (!cancelled) {
          setError(t('online.serverError'));
          setConnecting(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      const sock = getSocket();
      sock?.off('session:id');
      sock?.off('room:state');
      sock?.off('room:host');
      sock?.off('room:starting');
      sock?.off('room:closed');
    };
    // El nombre se fija al entrar; no queremos re-unirse a cada pulsación.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, code]);

  const leave = () => {
    if (roomId) getSocket()?.emit('room:leave', { roomId });
    navigate('/');
  };

  const saveName = () => {
    const next = name.trim().slice(0, 24);
    if (!next || !roomId) return;
    nameRef.current = next;
    setPlayerName(next);
    setName(next);
    getSocket()?.emit('room:rename', { roomId, name: next });
  };

  const changeName = (value: string) => {
    nameRef.current = value;
    setName(value);
  };

  const start = () => {
    if (!roomId) return;
    getSocket()?.emit('room:start', { roomId }, (res: { ok: boolean; error?: string } | undefined) => {
      if (!res?.ok) setError(onlineError(res?.error));
    });
  };

  const copy = (value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  const isHost = room?.hostId === myId;
  const count = room?.players.length ?? 0;
  const inviteUrl = room?.code ? `${window.location.origin}/join/${room.code}` : '';

  const titleText = connecting
    ? t('online.connecting')
    : count >= 4
      ? t('online.roomFull')
      : t('online.waitingPlayers');

  const slotsData: LobbySlotProps[] = Array.from({ length: 4 }).map((_, i) => {
    const p = room?.players[i];
    if (!p) return { occupied: false };
    return {
      occupied: true,
      name: p.username,
      isHost: p.userId === room?.hostId,
      isYou: p.userId === myId,
    };
  });

  const codeBlock = room?.code && (
    <div className="flex flex-col items-center gap-3 rounded-[14px] bg-ink-900 px-8 py-6">
      <div className="font-body text-fs-100 tracking-[0.04em] opacity-70">{t('online.codeLabel')}</div>
      <div className="flex items-baseline gap-2">
        {room.code.split('').map((c, i) => (
          <span key={i} className="font-display font-bold text-fs-700">{c}</span>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => copy(room.code!)}>
          {copied ? t('online.copied') : t('online.copy')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => copy(inviteUrl)}>
          {t('online.copyLink')}
        </Button>
      </div>
    </div>
  );

  const nameBlock = (
    <div className="flex w-full max-w-[320px] flex-col gap-2 rounded-[14px] bg-ink-900 p-5">
      <label className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65" htmlFor="jp-online-name">
        {t('online.nameLabel')}
      </label>
      <div className="flex gap-2">
        <input
          id="jp-online-name"
          value={name}
          maxLength={24}
          onChange={(e) => changeName(e.target.value)}
          onBlur={saveName}
          className="min-h-12 flex-1 rounded-pill border-[1.5px] border-bone/40 bg-ink px-4 font-body text-fs-300 text-bone outline-none focus-visible:border-bone"
        />
        <Button size="sm" variant="outline" onClick={saveName}>{t('online.save')}</Button>
      </div>
    </div>
  );

  const qrBlock = room?.code && (
    <div className="flex flex-col items-center gap-3">
      <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">{t('online.inviteTitle')}</div>
      <div className="rounded-[14px] bg-bone p-3">
        <QrCode value={inviteUrl} size={isMobile ? 160 : 200} label={t('online.inviteTitle')} />
      </div>
      <div className="max-w-[220px] text-center font-body text-fs-100 tracking-[0.04em] opacity-70">{t('online.inviteHint')}</div>
    </div>
  );

  const footer = (
    <div className={isMobile ? 'mt-6 flex flex-col gap-3' : 'mt-4 flex items-center justify-between'}>
      <Button variant="ghost" size={isMobile ? 'sm' : undefined} onClick={leave} className={isMobile ? 'self-start' : undefined}>
        {t('online.leave')}
      </Button>
      {isHost ? (
        <Button variant="primary" block={isMobile} disabled={count < 2} onClick={start}>
          {count < 2 ? t('online.needPlayers') : t('online.start')}
        </Button>
      ) : (
        <Button variant="outline" block={isMobile} disabled>
          {t('online.waitingHost')}
        </Button>
      )}
    </div>
  );

  if (error && !room) {
    return (
      <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
        <PageHeader onBack={() => navigate('/')} backLabel={t('common.backToMenu')} />
        <div className="mx-auto flex w-full max-w-[87.5rem] flex-1 flex-col items-center justify-center gap-4 px-10 pb-[3.5rem] pt-4 lg:px-20">
          <div className="font-display font-bold leading-[0.96] tracking-[-0.015em] text-fs-700">{t('online.notFound')}</div>
          <div className="font-body leading-[1.45] text-fs-300 opacity-40">{error}</div>
          <Button variant="outline" onClick={() => navigate('/')}>{t('online.back')}</Button>
        </div>
      </div>
    );
  }

  const slots = (
    <Stagger className={isMobile ? 'flex w-full max-w-[260px] flex-col gap-3' : 'flex flex-wrap justify-center gap-4'} stagger={0.08} delay={0.1}>
      {slotsData.map((s, i) => (
        <StaggerItem key={i}>
          <LobbySlot {...s} />
        </StaggerItem>
      ))}
    </Stagger>
  );

  if (isMobile) {
    return (
      <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-[1.375rem] pb-7 pt-8">
          <PageHeader
            onBack={leave}
            backLabel={t('common.backToMenu')}
            className="flex w-full items-start justify-between gap-4"
            wordmarkClassName="text-fs-600"
            right={<Avatar name={name} size={32} />}
          />
          <div className="flex min-h-0 flex-1 flex-col justify-between">
            <div className="flex flex-1 flex-col items-center justify-center gap-4 py-6">
              <div className="text-center font-display font-bold leading-[0.96] tracking-[-0.015em] text-fs-500">{titleText}</div>
              {error && <div className="font-body text-fs-100 tracking-[0.04em] text-danger opacity-70">{error}</div>}
              {slots}
              {codeBlock}
              {qrBlock}
              {nameBlock}
            </div>
            {footer}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
      <PageHeader
        onBack={leave}
        backLabel={t('common.backToMenu')}
        right={<Avatar name={name} size={40} />}
      />
      <div className="mx-auto flex w-full max-w-[87.5rem] flex-1 flex-col justify-between px-10 pb-[3.5rem] pt-4 lg:px-20">
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="text-center font-display font-bold leading-[0.96] tracking-[-0.015em] text-fs-700">{titleText}</div>
          {error && <div className="font-body text-fs-100 tracking-[0.04em] text-danger opacity-70">{error}</div>}
          {slots}
          <div className="flex items-start gap-12">
            {codeBlock}
            {qrBlock}
          </div>
          {nameBlock}
        </div>
        {footer}
      </div>
    </div>
  );
};

export default Lobby;
