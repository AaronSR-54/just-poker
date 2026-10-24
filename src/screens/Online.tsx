import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams, useBlocker, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import Badge from '../components/Badge';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import CtaButton from '../components/CtaButton';
import NameField from '../components/NameField';
import PageHeader from '../components/PageHeader';
import Panel from '../components/Panel';
import PersonCard from '../components/PersonCard';
import QrCode from '../components/QrCode';
import QrDialog from '../components/QrDialog';
import Screen from '../components/Screen';
import ScreenTitle from '../components/ScreenTitle';
import SelectableCard from '../components/SelectableCard';
import { container, fadeDown, fadeUp, slideSwap, motionT } from '../animations/motion';
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
  isOtherRoomJoin,
  normalizeRoomCode,
  lobbySessionFromRoom,
  type OnlineSession,
  type RoomState,
  type StartingPayload,
} from '../net/onlineSession';
import { resolveOnlineEntry } from '../net/onlineEntry';
import { randomName } from '../utils/randomName';
import { markPlayed } from '../utils/lastPlayed';
import { onlineError } from '../utils/onlineError';
import { MAX_PLAYER_NAME_LENGTH, onlineOrigin } from '../config/online';

type Mode = 'create' | 'join';

const MAX_SLOTS = 4;

/** Reparte un código normalizado (máx. 4) en las cuatro casillas. */
const codeToChars = (code: string): string[] => [0, 1, 2, 3].map((i) => code[i] ?? '');

/**
 * Entrada/salida de una plaza. Con `popLayout` la plaza que sale deja su hueco
 * de inmediato (no retiene el espacio) y las demás se reacomodan con `layout`.
 * La entrada y la salida son un fundido en la misma posición (sin desplazar),
 * para que ocupar/liberar un asiento no muestre dos filas superpuestas.
 */
const seatRow: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1, transition: motionT(0.22) },
  exit: { opacity: 0, scale: 0.98, transition: motionT(0.16) },
};

/**
 * Pantalla única de «juego con amigos»: en la columna izquierda el titular y las
 * tarjetas seleccionables de crear/unirse; en la derecha, el paso activo (nombre,
 * código o lobby). En móvil se apila en una columna.
 */
const Online: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 767px)');
  /** Pantallas estrechas (móviles pequeños ~320px): se compacta para evitar recortes. */
  const isNarrow = useMediaQuery('(max-width: 359px)');
  /** Pantallas bajas (móviles y ventanas 16:9): se compacta para evitar scroll vertical. */
  const isShort = useMediaQuery('(max-height: 720px)');
  /** Ventana pequeña (baja o estrecha): compacta en móvil y escritorio, no solo en móvil. */
  const compact = isShort || isNarrow;
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
  const [savedName] = useState(() => getPlayerName() ?? '');
  /** Último nombre usado: valor inicial editable del campo. */
  const [name, setName] = useState(savedName);
  /** Nombre generado de respaldo: se calcula una sola vez al montar. */
  const [placeholderName] = useState(() => randomName());
  const [pendingMode, setPendingMode] = useState<Mode | null>(null);
  /** Código de otra sala pendiente de confirmación (enlace o escrito). */
  const [pendingJoin, setPendingJoin] = useState<{ code: string; fromLink: boolean } | null>(null);
  const [connected, setConnected] = useState(true);
  const [reconnected, setReconnected] = useState(false);
  /** La conexión y los listeners ya están listos (habilitan resolver la entrada). */
  const [ready, setReady] = useState(false);

  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);
  const nameRef = useRef(savedName || placeholderName);
  const codeRef = useRef('');
  const roomRef = useRef<RoomState | null>(null);
  const wasDisconnectedRef = useRef(false);
  const bypassBlockRef = useRef(false);
  const startedRef = useRef(false);
  const copyTimerRef = useRef<number | null>(null);
  /** Último código de la dirección ya gestionado (evita repetir el aviso). */
  const handledCodeRef = useRef<string | null>(null);

  // Bloquea la salida de la pantalla mientras hay sala (atrás del navegador/Android,
  // acción de volver, enlaces…). Se permiten las escrituras `replace` del `?code=`
  // y los enlaces de invitación a **otra** sala, que resuelve el efecto reactivo.
  const blocker = useBlocker(({ currentLocation, nextLocation, historyAction }) => {
    if (!roomRef.current || bypassBlockRef.current || historyAction === 'REPLACE') return false;
    const currentCode = new URLSearchParams(currentLocation.search).get('code');
    const joinCode = /^\/join\/([^/]+)$/.exec(nextLocation.pathname)?.[1] ?? null;
    const nextCode = new URLSearchParams(nextLocation.search).get('code') ?? joinCode;
    const isInvite = Boolean(nextCode) && (nextCode !== currentCode || nextLocation.pathname !== currentLocation.pathname);
    return !isInvite;
  });
  const blockerRef = useRef(blocker);
  blockerRef.current = blocker;

  /** Retira el código de la dirección (al abandonar la sala o cerrarse). */
  const clearCodeParam = () => {
    setParams(
      (prev) => {
        if (!prev.get('code')) return prev;
        const next = new URLSearchParams(prev);
        next.delete('code');
        return next;
      },
      { replace: true },
    );
  };

  const codeParam = params.get('code');

  /** Reanuda la sala de una sesión activa (reincorpora al lobby o reentra en la partida). */
  const attachSession = (session: OnlineSession) => {
    setMode(session.isHost ? 'create' : 'join');
    setRoom({
      roomId: session.roomId,
      code: session.code,
      hostId: session.hostId,
      started: false,
      players: session.seats.map((s) => ({ userId: s.userId, username: s.username })),
    });
    getSocket()?.emit(
      'room:join',
      { roomId: session.roomId, name: session.playerName },
      (res: { ok: boolean; error?: string } | undefined) => {
        if (!res?.ok) {
          clearOnlineSession();
          setRoom(null);
          setError(onlineError(res?.error, 'online.roomGone'));
          // El código se conserva: no poder entrar no es abandonar la sala y
          // el humano debe poder reintentar sin volver a abrir la invitación.
        }
      },
    );
  };

  // Conexión y listeners de sala. La entrada (`?code=` o sesión activa) la
  // resuelve el efecto de más abajo, ya con la conexión lista.
  useEffect(() => {
    let cancelled = false;
    // Quita solo los listeners propios; `off(evento)` sin handler borraría
    // también los de otros módulos (p. ej. `session:id` en `socket.ts`).
    let detach: (() => void) | null = null;

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
          // Persiste la sala en curso (aún sin empezar) para reincorporarse al
          // recargar sin perder el rastro. Una partida ya empezada la fija
          // `room:starting`.
          if (!state.started) {
            const id = getPlayerId() ?? '';
            setOnlineSession(lobbySessionFromRoom(state, id, nameRef.current));
            markPlayed('online');
          }
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
            started: true,
          });
          markPlayed('online');
          bypassBlockRef.current = true;
          navigate(`/game/online-${data.roomId}`);
        };
        const onClosed = () => {
          clearOnlineSession();
          startedRef.current = false;
          setRoom(null);
          setError(t('online.roomClosed'));
          clearCodeParam();
        };
        const handleConnect = () => {
          setConnected(true);
          if (wasDisconnectedRef.current && roomRef.current) {
            setReconnected(true);
            window.setTimeout(() => setReconnected(false), 2500);
          }
          wasDisconnectedRef.current = false;
          const activeRoom = roomRef.current;
          if (activeRoom) {
            sock.emit(
              'room:join',
              { roomId: activeRoom.roomId, name: nameRef.current },
              (res: { ok: boolean; error?: string } | undefined) => {
                if (cancelled) return;
                if (!res?.ok) {
                  clearOnlineSession();
                  setRoom(null);
                  setError(onlineError(res?.error, 'online.roomGone'));
                  clearCodeParam();
                }
              },
            );
          }
        };
        const handleDisconnect = () => {
          wasDisconnectedRef.current = true;
          setConnected(false);
        };

        sock.on('session:id', onId);
        sock.on('room:state', onState);
        sock.on('room:host', onHost);
        sock.on('room:starting', onStarting);
        sock.on('room:closed', onClosed);
        sock.on('connect', handleConnect);
        sock.on('disconnect', handleDisconnect);
        detach = () => {
          sock.off('session:id', onId);
          sock.off('room:state', onState);
          sock.off('room:host', onHost);
          sock.off('room:starting', onStarting);
          sock.off('room:closed', onClosed);
          sock.off('connect', handleConnect);
          sock.off('disconnect', handleDisconnect);
        };

        setReady(true);
      } catch {
        if (!cancelled) {
          setError(t('online.serverError'));
        }
      }
    })();

    return () => {
      cancelled = true;
      detach?.();
    };
    // La entrada se resuelve una sola vez al montar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  // Resuelve la entrada por enlace/código de forma reactiva (también cuando ya
  // se está en `/online`). La decisión vive en `resolveOnlineEntry`: abrir una
  // invitación nunca une por sí solo; con otra sala o partida en curso se pide
  // confirmación antes de abandonarla.
  useEffect(() => {
    if (!ready) return;
    const normalized = normalizeRoomCode(codeParam);
    if (!normalized) handledCodeRef.current = null;

    // Intención explícita de empezar una partida nueva: no reanudar la sesión.
    const wantsNewGame = Boolean((location.state as { newGame?: boolean } | null)?.newGame);
    const entry = resolveOnlineEntry({
      code: normalized,
      wantsNewGame,
      session: getActiveOnlineSession(),
      room: roomRef.current,
      handledCode: handledCodeRef.current,
    });
    if (entry.kind === 'ignore') return;

    if (entry.kind === 'rejoin') {
      handledCodeRef.current = normalized || null;
      setCode(codeToChars(entry.session.code));
      attachSession(entry.session);
      return;
    }

    handledCodeRef.current = entry.code;
    setCode(codeToChars(entry.code));
    setMode('join');
    if (entry.kind === 'confirm') setPendingJoin({ code: entry.code, fromLink: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, codeParam]);

  // Refleja el código de la sala en la dirección (replace para no apilar historial).
  const roomCode = room?.code ?? null;
  useEffect(() => {
    if (!roomCode) return;
    if (params.get('code') === roomCode) return;
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('code', roomCode);
        return next;
      },
      { replace: true },
    );
  }, [roomCode, params, setParams]);

  // En carga directa (enlace de invitación) no hay una entrada previa en el
  // mismo documento, así que el atrás del navegador saldría sin pasar por el
  // blocker. Empujamos una entrada idéntica para que ese atrás sea un POP que
  // `useBlocker` pueda confirmar (y así emitir `room:leave` sin fantasmas).
  const roomId = room?.roomId ?? null;
  useEffect(() => {
    if (!roomId) return;
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) return;
    bypassBlockRef.current = true;
    const done = navigate(`${window.location.pathname}${window.location.search}`, { replace: false });
    void Promise.resolve(done).finally(() => {
      bypassBlockRef.current = false;
    });
  }, [roomId, navigate]);

  const codeValue = code.join('');
  const codeFilled = code.every((d) => d !== '');

  const setCodeChars = (raw: string) => {
    setCode(codeToChars(normalizeRoomCode(raw)));
  };

  const handleCodeChange = (index: number, raw: string) => {
    const chars = normalizeRoomCode(raw);
    if (!chars) {
      setCode((prev) => prev.map((d, i) => (i === index ? '' : d)));
      return;
    }
    const next = [...code];
    let idx = index;
    for (const ch of chars) {
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
    const text = normalizeRoomCode(e.clipboardData.getData('text'));
    if (!text) return;
    e.preventDefault();
    setCodeChars(text);
    codeRefs.current[Math.min(text.length, 3)]?.focus();
  };

  const copy = (value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  const selectMode = (next: Mode) => {
    // Con una sala abierta, cambiar (o repetir) de modo pide confirmación:
    // saldrás de la sala actual antes de crear o unirte a otra.
    if (room) {
      setPendingMode(next);
      return;
    }
    if (next === mode) return;
    setDir(next === 'join' ? 1 : -1);
    setMode(next);
    setError(null);
  };

  const submitName = (chosenName: string) => {
    setPlayerName(chosenName);
    nameRef.current = chosenName;
  };

  const doCreate = () => {
    const chosenName = (name.trim() || placeholderName).slice(0, MAX_PLAYER_NAME_LENGTH);
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
    const chosenName = (name.trim() || placeholderName).slice(0, MAX_PLAYER_NAME_LENGTH);
    setError(null);
    submitName(chosenName);
    // Con una partida en curso, un código de otra sala pide confirmación antes
    // de abandonarla.
    if (isOtherRoomJoin(getActiveOnlineSession() ?? room, codeValue)) {
      setPendingJoin({ code: codeValue, fromLink: false });
      return;
    }
    setBusy(true);
    getSocket()?.emit(
      'room:join',
      { code: codeValue, name: chosenName },
      (res: { ok: boolean; error?: string } | undefined) => {
        setBusy(false);
        if (!res?.ok) setError(onlineError(res?.error));
      },
    );
  };

  const detachRoom = () => {
    if (room) getSocket()?.emit('room:leave', { roomId: room.roomId });
    clearOnlineSession();
    startedRef.current = false;
    roomRef.current = null;
    setRoom(null);
    setCode(['', '', '', '']);
    setError(null);
  };

  const resetRoom = () => {
    detachRoom();
    clearCodeParam();
  };

  const goMenu = () => {
    if (room) {
      // La navegación la bloquea `useBlocker`, que abre la confirmación.
      navigate('/');
      return;
    }
    clearOnlineSession();
    navigate('/');
  };

  /** Confirma entrar en otra sala: el servidor abandona la anterior al unir y
   * publica el estado de la nueva (que pasa a ser la sesión persistida). Si
   * falla el ingreso, se conserva la partida en curso. */
  const confirmJoin = () => {
    const target = pendingJoin;
    if (!target) return;
    setPendingJoin(null);
    setError(null);
    getSocket()?.emit(
      'room:join',
      { code: target.code, name: nameRef.current },
      (res: { ok: boolean; error?: string } | undefined) => {
        if (!res?.ok) setError(onlineError(res?.error, 'online.roomGone'));
      },
    );
  };

  /** Cancela la entrada en otra sala: mantiene la partida en curso. */
  const cancelJoin = () => {
    const target = pendingJoin;
    setPendingJoin(null);
    if (!target?.fromLink) return;
    handledCodeRef.current = null;
    if (roomRef.current) {
      setMode(roomRef.current.hostId === (getPlayerId() ?? '') ? 'create' : 'join');
      clearCodeParam();
      return;
    }
    const session = getActiveOnlineSession();
    clearCodeParam();
    if (session) attachSession(session);
  };

  const cancelExit = () => {
    if (pendingJoin) {
      cancelJoin();
      return;
    }
    setPendingMode(null);
    if (blockerRef.current.state === 'blocked') blockerRef.current.reset();
  };

  const confirmExit = () => {
    if (pendingJoin) {
      confirmJoin();
      return;
    }
    if (blockerRef.current.state === 'blocked') {
      // Salida controlada al menú: limpiamos la sala (emite `room:leave`) y
      // descartamos la navegación bloqueada, que en carga directa apuntaría a
      // una entrada ya sin sala.
      detachRoom();
      blockerRef.current.reset();
      navigate('/', { replace: true });
      return;
    }
    const next = pendingMode;
    setPendingMode(null);
    resetRoom();
    setDir(next === 'join' ? 1 : -1);
    setMode(next ?? 'create');
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
  const inviteUrl = room ? `${onlineOrigin() || window.location.origin}/online?code=${room.code}` : '';
  const emptyCount = room ? Math.max(0, MAX_SLOTS - count) : 0;
  const cardSize = isMobile ? 'sm' : 'lg';

  const modeCards = (
    <>
      <SelectableCard
        label={t('online.create')}
        secondary={t('online.createDesc')}
        selected={mode === 'create'}
        size={cardSize}
        stretch={!isMobile}
        stacked={isMobile}
        dense={compact}
        onClick={() => selectMode('create')}
      />
      <SelectableCard
        label={t('online.join')}
        secondary={t('online.joinDesc')}
        selected={mode === 'join'}
        size={cardSize}
        stretch={!isMobile}
        stacked={isMobile}
        dense={compact}
        onClick={() => selectMode('join')}
      />
    </>
  );

  const createPanel = (
    <Panel compact={compact}>
      <div className="flex flex-col gap-1">
        <div className="font-display font-bold text-fs-700">{t('online.createPanelTitle')}</div>
        <div className="font-body leading-[1.45] mt-1 opacity-70">{t('online.createHint')}</div>
      </div>
      <NameField
        label={t('online.nameLabel')}
        value={name}
        onChange={setName}
        placeholder={placeholderName}
        compact={compact}
      />
      <CtaButton disabled={busy} onClick={doCreate}>
        {t('online.create')}
      </CtaButton>
    </Panel>
  );

  const joinPanel = (
    <Panel compact={compact}>
      <div className="flex flex-col gap-1">
        <div className="font-display font-bold text-fs-700">{t('online.joinPanelTitle')}</div>
        <div className="font-body leading-[1.45] mt-1 opacity-70">{t('online.joinHint')}</div>
      </div>
      <div className="flex flex-col gap-3">
        <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">
          {t('online.codeLabel')}
        </div>
        <div className={`flex justify-center ${compact ? 'gap-2' : 'gap-3'}`}>
          {code.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                codeRefs.current[i] = el;
              }}
              value={d}
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              maxLength={1}
              placeholder="-"
              aria-label={`${t('online.codeLabel')} ${i + 1}`}
              onChange={(e) => handleCodeChange(i, e.target.value)}
              onKeyDown={(e) => handleCodeKey(i, e)}
              onPaste={handleCodePaste}
              className={[
                'rounded-[14px] border-[1.5px] border-bone/20 bg-ink-700 text-center font-display font-bold text-bone outline-none transition-[border-color] duration-200 placeholder:opacity-[0.18] focus:border-2 focus:border-bone',
                compact ? 'h-14 w-12 text-fs-500' : 'h-16 w-14 text-fs-600 sm:h-20 sm:w-16 sm:text-fs-700',
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
        compact={compact}
      />
      <CtaButton disabled={!codeFilled || busy} onClick={doJoin}>
        {t('online.joinAction')}
      </CtaButton>
    </Panel>
  );

  const roomPanel = room && (
    <Panel compact={compact} className={compact ? undefined : 'gap-5! sm:gap-5! sm:p-7!'}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-display font-bold text-fs-700">{t('online.roomTitle')}</div>
        <div className="flex flex-wrap items-center gap-2">
          {host && <Badge variant="info">{t('online.hostBadge')}</Badge>}
          <Badge variant="neutral">{t('online.playerCount', { count, max: MAX_SLOTS })}</Badge>
        </div>
      </div>
      <div className="font-body leading-[1.45] opacity-70">
        {host ? t('online.roomHostHint') : t('online.roomGuestHint')}
      </div>

      {(!connected || reconnected) && (
        <motion.div
          variants={fadeDown}
          initial="hidden"
          animate="visible"
          role="status"
          aria-live="polite"
          className={[
            'rounded-[12px] px-4 py-3 font-body text-fs-100 tracking-[0.04em]',
            connected ? 'bg-success/15 text-success' : 'bg-danger/20 text-danger',
          ].join(' ')}
        >
          {connected ? t('online.connectionRestored') : t('online.connectionLost')}
        </motion.div>
      )}

      <div className="flex flex-col gap-2">
        <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">
          {t('online.codeLabel')}
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => copy(inviteUrl)}
            aria-label={t('online.copyLink')}
            className="flex h-8 cursor-pointer items-center gap-2 rounded-[10px] transition-opacity duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone"
          >
            {room.code.split('').map((c, i) => (
              <span key={i} className="font-body font-bold leading-none text-fs-700">{c}</span>
            ))}
          </button>
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            aria-label={t('online.viewQr')}
            className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-[8px] bg-bone p-1 transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone"
          >
            <QrCode value={inviteUrl} size={96} className="size-6" label={t('online.inviteTitle')} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false} mode="popLayout">
          {room.players.map((p) => (
            <motion.div
              key={p.userId}
              variants={seatRow}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout="position"
            >
              <PersonCard
                name={p.userId === myId ? `${p.username} (${t('online.youBadge')})` : p.username}
                avatarName={p.userId === myId ? p.username : undefined}
                strong={p.userId === myId}
                avatarSize={compact ? 32 : 36}
                compact={compact}
              />
            </motion.div>
          ))}
          {Array.from({ length: emptyCount }).map((_, i) => (
            <motion.div
              key={`empty-seat-${count + i}`}
              variants={seatRow}
              initial="hidden"
              animate="visible"
              exit="exit"
              layout="position"
            >
              <PersonCard
                name={t('online.emptySeat')}
                avatarName="?"
                strong={false}
                avatarSize={compact ? 32 : 36}
                muted
                compact={compact}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-2">
        {host ? (
          <Button variant="primary" block disabled={count < 2} onClick={start}>
            {t('online.start')}
          </Button>
        ) : (
          <Button variant="outline" block disabled>
            {t('online.waitingHostName', { name: hostName })}
          </Button>
        )}
        {host && (
          <div
            className={[
              'text-center font-body text-fs-100 tracking-[0.04em] opacity-60',
              count < 2 ? '' : 'invisible',
            ].join(' ')}
            aria-hidden={count >= 2}
          >
            {t('online.needPlayers')}
          </div>
        )}
      </div>
    </Panel>
  );

  const activePanel = room ? roomPanel : mode === 'join' ? joinPanel : createPanel;

  const errorLine = error && (
    <div className="text-center font-body text-fs-100 tracking-[0.04em] text-danger opacity-70">{error}</div>
  );

  const copiedLine = copied && (
    <motion.div
      variants={fadeDown}
      initial="hidden"
      animate="visible"
      role="status"
      aria-live="polite"
      className="text-center font-body text-fs-100 tracking-[0.04em] text-success"
    >
      {t('online.copied')}
    </motion.div>
  );

  const confirmCopy = pendingJoin
    ? { title: t('online.leaveForAnotherTitle'), message: t('online.leaveForAnotherMessage'), confirm: t('online.leaveForAnotherConfirm') }
    : pendingMode === 'create'
      ? { title: t('online.newGameTitle'), message: t('online.newGameMessage'), confirm: t('online.newGameConfirm') }
      : pendingMode === 'join'
        ? { title: t('online.joinAnotherTitle'), message: t('online.joinAnotherMessage'), confirm: t('online.joinAnotherConfirm') }
        : { title: t('online.leaveTitle'), message: t('online.leaveMessage'), confirm: t('online.leaveConfirm') };

  const overlays = (
    <>
      <QrDialog
        open={qrOpen}
        title={t('online.inviteTitle')}
        value={inviteUrl}
        hint={t('online.inviteHint')}
        closeLabel={t('common.close')}
        onClose={() => setQrOpen(false)}
      />
      <ConfirmDialog
        open={blocker.state === 'blocked' || pendingMode !== null || pendingJoin !== null}
        title={confirmCopy.title}
        message={confirmCopy.message}
        confirmLabel={confirmCopy.confirm}
        cancelLabel={t('common.cancel')}
        danger
        onConfirm={confirmExit}
        onCancel={cancelExit}
      />
    </>
  );

  if (isMobile) {
    return (
      <Screen>
        <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto px-[1.375rem] ${compact ? 'pb-5 pt-5' : 'pb-7 pt-8'}`}>
          <PageHeader
            onBack={goMenu}
            backLabel={t('common.backToMenu')}
            className="flex w-full items-baseline justify-between gap-4"
            wordmarkClassName={isNarrow ? 'text-fs-500' : 'text-fs-600'}
          />
          <motion.div
            variants={container(0.07, 0.05)}
            initial="hidden"
            animate="visible"
            className={compact ? 'mt-auto flex flex-col gap-3 pt-3' : 'mt-auto flex flex-col gap-4 pt-5'}
          >
            <motion.div variants={fadeUp}>
              <ScreenTitle
                em={t('online.titleEm')}
                rest={t('online.titleRest')}
                className={compact ? 'text-fs-600' : 'text-[clamp(2rem,8.5vw,2.75rem)]'}
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
                  {copiedLine}
                  {errorLine}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </motion.div>
        </div>
        {overlays}
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader onBack={goMenu} backLabel={t('common.backToMenu')} />

      <div
        className={
          compact
            ? 'mx-auto flex w-full max-w-[87.5rem] flex-1 min-h-0 justify-center overflow-y-auto px-10 pb-6 pt-2 lg:px-20'
            : 'mx-auto flex w-full max-w-[87.5rem] flex-1 min-h-0 justify-center overflow-y-auto px-10 pb-[3.5rem] pt-4 lg:px-20'
        }
      >
        <div className={`m-auto flex w-full items-center justify-center ${compact ? 'gap-6' : 'gap-8 lg:gap-12'}`}>
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
                className={compact ? 'text-fs-700' : 'text-[clamp(2rem,4.5vw,3.25rem)]'}
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
                {copiedLine}
                {errorLine}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
      {overlays}
    </Screen>
  );
};

export default Online;
