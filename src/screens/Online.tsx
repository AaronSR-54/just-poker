import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Avatar from '../components/Avatar';
import Badge from '../components/Badge';
import Button from '../components/Button';
import CtaButton from '../components/CtaButton';
import NameField from '../components/NameField';
import PageHeader from '../components/PageHeader';
import Panel from '../components/Panel';
import PersonCard from '../components/PersonCard';
import QrDialog from '../components/QrDialog';
import ScreenTitle from '../components/ScreenTitle';
import SelectableCard from '../components/SelectableCard';
import { container, fadeUp, slideSwap } from '../animations/motion';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useI18n } from '../i18n';
import { connectSocket, getSocket } from '../net/socket';
import {
  setOnlineSession,
  getPlayerId,
  getPlayerName,
  setPlayerName,
  getActiveOnlineSession,
  clearOnlineSession,
  type RoomState,
  type StartingPayload,
} from '../net/onlineSession';
import { randomName } from '../utils/randomName';
import { markPlayed } from '../utils/lastPlayed';
import { onlineError } from '../utils/onlineError';

type Mode = 'create' | 'join';

const MAX_SLOTS = 4;

/**
 * Pantalla única de «juego con amigos»: en la columna izquierda el titular y las
 * tarjetas seleccionables de crear/unirse; en la derecha, el paso activo (nombre,
 * código o lobby). En móvil se apila en una columna.
 */
const Online: React.FC = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const isMobile = useMediaQuery('(max-width: 767px)');
  /** Pantallas muy estrechas (<300px). */
  const isTiny = useMediaQuery('(max-width: 299px)');
  /** Pantallas bajas (móviles 16:9): se compacta para evitar scroll vertical. */
  const isShort = useMediaQuery('(max-height: 720px)');
  const dense = isMobile && (isTiny || isShort);
  const { t } = useI18n();

  const [mode, setMode] = useState<Mode>('create');
  const [dir, setDir] = useState(1);
  const [code, setCode] = useState<string[]>(['', '', '', '']);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [name, setName] = useState('');
  const [placeholderName] = useState(() => getPlayerName() ?? randomName());

  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);
  const nameRef = useRef(placeholderName);
  const codeRef = useRef('');
  const startedRef = useRef(false);

  // Conexión, listeners de sala y resolución de la entrada (?code= o sesión activa).
  useEffect(() => {
    let cancelled = false;
    const codeParam = params.get('code');
    const session = getActiveOnlineSession();

    (async () => {
      try {
        const sock = await connectSocket();
        if (cancelled) return;
        setMyId(getPlayerId());

        const onId = (data: { playerId?: string }) => {
          if (data?.playerId) setMyId(data.playerId);
        };
        const onState = (state: RoomState) => {
          codeRef.current = state.code;
          setRoom(state);
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
            code: codeRef.current,
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
        const onClosed = () => {
          clearOnlineSession();
          startedRef.current = false;
          setRoom(null);
          setError(t('online.roomClosed'));
        };

        sock.on('session:id', onId);
        sock.on('room:state', onState);
        sock.on('room:host', onHost);
        sock.on('room:starting', onStarting);
        sock.on('room:closed', onClosed);

        if (session) {
          setMode(session.isHost ? 'create' : 'join');
          setRoom({
            roomId: session.roomId,
            code: session.code,
            hostId: session.hostId,
            started: false,
            players: session.seats.map((s) => ({ userId: s.userId, username: s.username })),
          });
          sock.emit(
            'room:join',
            { roomId: session.roomId, name: session.playerName },
            (res: { ok: boolean; error?: string } | undefined) => {
              if (cancelled) return;
              if (!res?.ok) {
                clearOnlineSession();
                setRoom(null);
                setError(onlineError(res?.error, 'online.roomGone'));
              }
            },
          );
        } else if (codeParam) {
          const digits = codeParam.replace(/\D/g, '').slice(0, 4);
          setCode([0, 1, 2, 3].map((i) => digits[i] ?? ''));
          setMode('join');
        }
      } catch {
        if (!cancelled) {
          setError(t('online.serverError'));
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
    // La entrada se resuelve una sola vez al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const codeValue = code.join('');
  const codeFilled = code.every((d) => d !== '');

  const setCodeDigits = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 4);
    setCode([0, 1, 2, 3].map((i) => digits[i] ?? ''));
  };

  const handleCodeChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) {
      setCode((prev) => prev.map((d, i) => (i === index ? '' : d)));
      return;
    }
    const next = [...code];
    let idx = index;
    for (const ch of digits) {
      if (idx > 3) break;
      next[idx] = ch;
      idx += 1;
    }
    setCode(next);
    codeRefs.current[Math.min(idx, 3)]?.focus();
  };

  const handleCodeKey = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      e.preventDefault();
      setCode((prev) => prev.map((d, i) => (i === index - 1 ? '' : d)));
      codeRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      codeRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      e.preventDefault();
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!text) return;
    e.preventDefault();
    setCodeDigits(text);
    codeRefs.current[Math.min(text.length, 3)]?.focus();
  };

  const copy = (value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  const selectMode = (next: Mode) => {
    if (room || next === mode) return;
    setDir(next === 'join' ? 1 : -1);
    setMode(next);
    setError(null);
  };

  const submitName = (chosenName: string) => {
    setPlayerName(chosenName);
    nameRef.current = chosenName;
  };

  const doCreate = () => {
    const chosenName = (name.trim() || placeholderName).slice(0, 24);
    setBusy(true);
    setError(null);
    submitName(chosenName);
    getSocket()?.emit('room:create', { name: chosenName }, (res: { ok: boolean; error?: string } | undefined) => {
      setBusy(false);
      if (!res?.ok) setError(onlineError(res?.error));
    });
  };

  const doJoin = () => {
    if (!codeFilled) {
      setError(t('online.invalidCode'));
      return;
    }
    const chosenName = (name.trim() || placeholderName).slice(0, 24);
    setBusy(true);
    setError(null);
    submitName(chosenName);
    getSocket()?.emit(
      'room:join',
      { code: codeValue, name: chosenName },
      (res: { ok: boolean; error?: string } | undefined) => {
        setBusy(false);
        if (!res?.ok) setError(onlineError(res?.error));
      },
    );
  };

  const leave = () => {
    if (room) getSocket()?.emit('room:leave', { roomId: room.roomId });
    clearOnlineSession();
    startedRef.current = false;
    setMode('create');
    setDir(-1);
    setRoom(null);
    setCode(['', '', '', '']);
    setError(null);
  };

  const goMenu = () => {
    if (room) leave();
    else clearOnlineSession();
    navigate('/');
  };

  const start = () => {
    if (!room) return;
    getSocket()?.emit('room:start', { roomId: room.roomId }, (res: { ok: boolean; error?: string } | undefined) => {
      if (!res?.ok) setError(onlineError(res?.error));
    });
  };

  const host = room ? room.hostId === myId : false;
  const count = room?.players.length ?? 0;
  const hostName = room?.players.find((p) => p.userId === room.hostId)?.username ?? t('online.hostBadge');
  const inviteUrl = room ? `${window.location.origin}/online?code=${room.code}` : '';
  const emptyCount = room ? Math.max(0, MAX_SLOTS - count) : 0;
  const cardSize = isMobile ? 'sm' : 'lg';

  const modeCards = (
    <>
      <SelectableCard
        label={t('online.create')}
        secondary={t('online.createDesc')}
        selected={mode === 'create'}
        disabled={Boolean(room)}
        size={cardSize}
        stretch={false}
        stacked={isMobile}
        dense={dense}
        onClick={() => selectMode('create')}
      />
      <SelectableCard
        label={t('online.join')}
        secondary={t('online.joinDesc')}
        selected={mode === 'join'}
        disabled={Boolean(room)}
        size={cardSize}
        stretch={false}
        stacked={isMobile}
        dense={dense}
        onClick={() => selectMode('join')}
      />
    </>
  );

  const createPanel = (
    <Panel compact={dense}>
      <div className="flex flex-col gap-1">
        <div className="font-display font-bold leading-none text-fs-700">{t('online.createPanelTitle')}</div>
        <div className="font-body leading-[1.45] mt-1 opacity-70">{t('online.createHint')}</div>
      </div>
      <NameField
        label={t('online.nameLabel')}
        value={name}
        onChange={setName}
        placeholder={placeholderName}
        compact={dense}
      />
      <CtaButton disabled={busy} onClick={doCreate}>
        {t('online.create')}
      </CtaButton>
    </Panel>
  );

  const joinPanel = (
    <Panel compact={dense}>
      <div className="flex flex-col gap-1">
        <div className="font-display font-bold leading-none text-fs-700">{t('online.joinPanelTitle')}</div>
        <div className="font-body leading-[1.45] mt-1 opacity-70">{t('online.joinHint')}</div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">
          {t('online.codeLabel')}
        </div>
        <div className={`flex justify-center ${dense ? 'gap-2' : 'gap-3'}`}>
          {code.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                codeRefs.current[i] = el;
              }}
              value={d}
              inputMode="numeric"
              autoComplete="off"
              maxLength={1}
              placeholder="0"
              aria-label={`${t('online.codeLabel')} ${i + 1}`}
              onChange={(e) => handleCodeChange(i, e.target.value)}
              onKeyDown={(e) => handleCodeKey(i, e)}
              onPaste={handleCodePaste}
              className={[
                'rounded-[14px] border-[1.5px] border-bone/20 bg-ink-700 text-center font-display font-bold leading-none text-bone outline-none transition-[border-color] duration-200 placeholder:opacity-[0.18] focus:border-2 focus:border-bone',
                dense ? 'h-14 w-12 text-fs-500' : 'h-16 w-14 text-fs-600 sm:h-20 sm:w-16 sm:text-fs-700',
              ].join(' ')}
            />
          ))}
        </div>
      </div>
      <NameField
        label={t('online.nameLabel')}
        value={name}
        onChange={setName}
        placeholder={placeholderName}
        compact={dense}
      />
      <CtaButton disabled={!codeFilled || busy} onClick={doJoin}>
        {t('online.joinAction')}
      </CtaButton>
    </Panel>
  );

  const roomPanel = room && (
    <Panel compact={dense}>
      <div className="flex flex-col gap-1">
        <div className="font-display font-bold leading-none text-fs-700">{t('online.roomTitle')}</div>
        <div className="font-body text-fs-100 tracking-[0.04em] mt-1 opacity-70">
          {t('online.roomContext', { code: room.code, count })}
        </div>
        <div className="font-body leading-[1.45] opacity-70">
          {host ? t('online.roomHostHint') : t('online.roomGuestHint')}
        </div>
      </div>

      <div className={`flex flex-col ${dense ? 'gap-4' : 'gap-5'}`}>
        {room.players.map((p) => (
          <PersonCard
            key={p.userId}
            name={p.username}
            secondary={p.userId === myId ? t('online.youBadge') : undefined}
            trailing={p.userId === room.hostId ? <Badge variant="neutral">{t('online.hostBadge')}</Badge> : undefined}
            compact={dense}
          />
        ))}
        {Array.from({ length: emptyCount }).map((_, i) => (
          <div key={`empty-${i}`} className={`flex items-center opacity-40 ${dense ? 'gap-3' : 'gap-4'}`}>
            <Avatar name="?" size={dense ? 40 : 56} muted />
          </div>
        ))}
        {emptyCount > 0 && (
          <div className="font-body text-fs-100 tracking-[0.04em] opacity-70">{t('online.waitingPlayers')}</div>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">
          {t('online.codeLabel')}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-baseline gap-2">
            {room.code.split('').map((c, i) => (
              <span key={i} className="font-display font-bold text-fs-700">{c}</span>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={() => copy(room.code)}>
            {copied ? t('online.copied') : t('online.copy')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => copy(inviteUrl)}>
            {t('online.copyLink')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setQrOpen(true)}>
            {t('online.viewQr')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {host ? (
          <CtaButton disabled={count < 2} onClick={start}>
            {count < 2 ? t('online.needPlayers') : t('online.start')}
          </CtaButton>
        ) : (
          <Button variant="outline" block disabled>
            {t('online.waitingHostName', { name: hostName })}
          </Button>
        )}
        <Button variant="ghost" block onClick={leave}>
          {t('online.leave')}
        </Button>
      </div>
    </Panel>
  );

  const activePanel = room ? roomPanel : mode === 'join' ? joinPanel : createPanel;

  const errorLine = error && (
    <div className="text-center font-body text-fs-100 tracking-[0.04em] text-danger opacity-70">{error}</div>
  );

  const overlays = (
    <QrDialog
      open={qrOpen}
      title={t('online.inviteTitle')}
      value={inviteUrl}
      hint={t('online.inviteHint')}
      closeLabel={t('common.close')}
      onClose={() => setQrOpen(false)}
    />
  );

  if (isMobile) {
    return (
      <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
        <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto px-[1.375rem] ${dense ? 'pb-5 pt-5' : 'pb-7 pt-8'}`}>
          <PageHeader
            onBack={goMenu}
            backLabel={t('common.backToMenu')}
            className="flex w-full items-start justify-between gap-4"
            wordmarkClassName={isTiny ? 'text-fs-500' : 'text-fs-600'}
          />
          <motion.div
            variants={container(0.07, 0.05)}
            initial="hidden"
            animate="visible"
            className={dense ? 'mt-auto flex flex-col gap-3 pt-3' : 'mt-auto flex flex-col gap-4 pt-5'}
          >
            <motion.div variants={fadeUp}>
              <ScreenTitle
                em={t('online.titleEm')}
                rest={t('online.titleRest')}
                className={isTiny ? 'text-fs-600' : 'text-[clamp(2rem,8.5vw,2.75rem)]'}
              />
            </motion.div>
            <motion.div variants={container(0.06)} className="flex flex-col gap-2">
              {modeCards}
            </motion.div>
            <motion.div variants={fadeUp}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={room ? 'room' : mode}
                  variants={slideSwap(dir, 28)}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="flex flex-col gap-3"
                >
                  {activePanel}
                  {errorLine}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </div>
        {overlays}
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
      <PageHeader onBack={goMenu} backLabel={t('common.backToMenu')} />

      <div className="mx-auto flex w-full max-w-[87.5rem] flex-1 items-center justify-center px-10 pb-[3.5rem] pt-4 lg:px-20">
        <div className="flex w-full items-center justify-center gap-8 lg:gap-12">
          <motion.div
            variants={container(0.07, 0.05)}
            initial="hidden"
            animate="visible"
            className="flex flex-[48] min-h-0 flex-col gap-6"
          >
            <motion.div variants={fadeUp}>
              <ScreenTitle
                em={t('online.titleEm')}
                rest={t('online.titleRest')}
                className="text-[clamp(2rem,4.5vw,3.25rem)]"
              />
            </motion.div>
            <motion.div variants={container(0.06)} className="flex min-h-0 flex-1 flex-col gap-3">
              {modeCards}
            </motion.div>
          </motion.div>
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex flex-[52] flex-col justify-center"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={room ? 'room' : mode}
                variants={slideSwap(dir, 28)}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col gap-3"
              >
                {activePanel}
                {errorLine}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
      {overlays}
    </div>
  );
};

export default Online;
