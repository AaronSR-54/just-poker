import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Button from '../components/Button';
import { AnimatePresence } from 'framer-motion';
import RankBadge from '../components/RankBadge';
import { FadeIn } from '../components/Animated';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useUserStore } from '../store/userStore';
import { connectSocket, emitAck } from '../net/socket';

type OnlineMode = 'main' | 'create' | 'join' | 'join-typing' | 'busy';

const CodeDigit: React.FC<{ digit?: string; focused?: boolean }> = ({ digit, focused = false }) => {
  const hasDigit = digit !== undefined && digit !== '';
  return (
    <div
      className={[
        'flex h-16 w-14 items-center justify-center rounded-lg bg-ink sm:h-20 sm:w-16',
        'font-display font-bold text-[1.625rem] leading-none sm:text-[2rem]',
        'transition-[border-color] duration-200',
        focused
          ? 'border-2 border-bone'
          : 'border-[1.5px] border-bone/20',
        hasDigit ? 'text-bone' : '',
      ].join(' ')}
    >
      {hasDigit ? digit : <span className="opacity-[0.18]">0</span>}
    </div>
  );
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

const KeypadKey: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex size-13 cursor-pointer items-center justify-center rounded-full border border-bone/20 bg-ink font-display font-bold text-fs-600 text-bone transition-[transform,background-color,border-color] duration-[240ms] ease-brand hover:-translate-y-0.5 hover:border-bone/40 hover:bg-ink-600 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone md:size-14"
  >
    {children}
  </button>
);

const Online: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const user = useUserStore(s => s.user);

  const [mode, setMode] = useState<OnlineMode>('main');
  const [code, setCode] = useState<string[]>(['', '', '', '']);
  const [createdCode, setCreatedCode] = useState('');
  const [createdRoomId, setCreatedRoomId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleCodeInput = (val: string) => {
    const next = [...code];
    if (val === '') {
      // backspace
      for (let i = 3; i >= 0; i--) {
        if (next[i] !== '') {
          next[i] = '';
          break;
        }
      }
    } else if (/^[A-Za-z0-9]$/.test(val)) {
      const idx = next.findIndex(d => d === '');
      if (idx >= 0) next[idx] = val.toUpperCase();
    }
    setCode(next);
  };

  const codeFilled = code.every(d => d !== '');

  const withSocket = async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    setBusy(true);
    setError(null);
    try {
      await connectSocket();
      return await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo conectar al servidor');
      return null;
    } finally {
      setBusy(false);
    }
  };

  const findPublic = async () => {
    const res = await withSocket(() =>
      emitAck<{ ok: boolean; roomId?: string; error?: string }>('room:quick')
    );
    if (!res) return;
    if (!res.ok || !res.roomId) {
      setError(res?.error ?? 'No se pudo unir a una mesa');
      return;
    }
    navigate(`/lobby/${res.roomId}`);
  };

  const createPrivate = async () => {
    const res = await withSocket(() =>
      emitAck<{ ok: boolean; roomId?: string; code?: string; error?: string }>('room:create', {
        type: 'private',
      })
    );
    if (!res) return;
    if (!res.ok || !res.roomId) {
      setError(res?.error ?? 'No se pudo crear la sala');
      return;
    }
    setCreatedCode(res.code ?? '');
    setCreatedRoomId(res.roomId);
    setMode('create');
  };

  const goToCreatedLobby = () => {
    if (createdRoomId) navigate(`/lobby/${createdRoomId}`);
  };

  const joinWithCode = async () => {
    const joined = code.join('');
    const res = await withSocket(() =>
      emitAck<{ ok: boolean; roomId?: string; error?: string }>('room:join', { code: joined })
    );
    if (!res) return;
    if (!res.ok || !res.roomId) {
      setError(res?.error ?? 'Código inválido o sala llena');
      return;
    }
    navigate(`/lobby/${res.roomId}`);
  };

  const resetToJoin = () => { setMode('join-typing'); setCode(['', '', '', '']); setError(null); };

  const keypad = (
    <div className="flex flex-col items-center gap-2">
      {[0, 1, 2].map(row => (
        <div key={row} className="flex gap-2">
          {KEYS.slice(row * 3, row * 3 + 3).map(k => (
            <KeypadKey key={k} onClick={() => handleCodeInput(k)}>{k}</KeypadKey>
          ))}
        </div>
      ))}
      <div className="flex gap-2">
        <KeypadKey onClick={() => handleCodeInput('0')}>0</KeypadKey>
        <KeypadKey onClick={() => handleCodeInput('')}>⌫</KeypadKey>
      </div>
    </div>
  );

  const errorLine = error && (
    <div className="flex max-w-[320px] flex-col text-center font-body text-fs-100 tracking-[0.04em] text-danger opacity-70">
      <div>{error}</div>
      <div className="opacity-70">¿Está el servidor en marcha? (npm run dev en /server)</div>
    </div>
  );

  const brandBar = (
    <div className="flex shrink-0 items-center justify-between border-b border-bone/10 bg-ink px-[1.125rem] py-[0.875rem] font-display font-bold tracking-[0.02em]">
      <div className="font-display font-bold text-fs-300 uppercase tracking-[0.08em]">Just <em className="font-light italic tracking-normal">Poker</em></div>
    </div>
  );

  // ------- MOBILE -------
  if (isMobile) {
    return (
      <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
        {mode !== 'main' && brandBar}

        <AnimatePresence mode="wait">
        {mode === 'main' && (
          <FadeIn key="main" className="flex min-h-0 flex-1 flex-col [justify-content:safe_center] gap-5 overflow-y-auto px-5 py-[1.875rem]">
            <div className="mb-2.5 text-center font-display font-bold text-fs-400 uppercase tracking-[0.08em]">
              Just <em className="font-light italic tracking-normal">Poker</em>
            </div>
            <div className="text-center font-display font-bold leading-none text-[1.5rem]">Jugar en línea</div>

            <div className="flex flex-col items-center gap-3 rounded-[14px] bg-bone p-7 text-center text-ink">
              <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-70">Pública</div>
              <div className="font-display font-bold leading-none text-[1.125rem]">Unirse a una mesa aleatoria</div>
              <RankBadge points={user.points} />
              <Button variant="primary" block disabled={busy} onClick={findPublic}>
                {busy ? 'Conectando…' : 'Buscar partida'}
              </Button>
            </div>

            <div className="flex flex-col items-center gap-3 rounded-[14px] border-[1.5px] border-bone bg-ink p-7 text-center">
              <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">Privada</div>
              <div className="font-display font-bold leading-none text-[1.125rem]">Partida privada</div>
              <div className="font-body text-fs-100 tracking-[0.04em] opacity-70 max-w-[260px]">
                Crea una sala con código o únete a una existente.
              </div>
              <Button variant="outline" block disabled={busy} onClick={createPrivate}>
                Crear partida
              </Button>
              <Button variant="outline" block onClick={resetToJoin}>
                Unirse a partida
              </Button>
            </div>

            {errorLine}
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>← Menú</Button>
          </FadeIn>
        )}

        {mode === 'create' && (
          <FadeIn key="create" className="flex min-h-0 flex-1 flex-col items-center [justify-content:safe_center] gap-5 overflow-y-auto px-5 py-[1.875rem]">
            <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">Código de sala</div>
            <div className="flex gap-3">
              {createdCode.split('').map((d, i) => <CodeDigit key={i} digit={d} />)}
            </div>
            <div className="font-body text-fs-100 tracking-[0.04em] opacity-70 max-w-[280px] text-center">
              Comparte este código. Las privadas no cuentan para el ranking.
            </div>
            <div className="flex w-full flex-col gap-2">
              <Button variant="primary" block onClick={goToCreatedLobby}>
                Ir al lobby
              </Button>
              <Button variant="outline" block onClick={() => navigator.clipboard.writeText(createdCode)}>
                Copiar código
              </Button>
              <Button variant="ghost" block onClick={() => setMode('main')}>Cancelar</Button>
            </div>
          </FadeIn>
        )}

        {mode === 'join-typing' && (
          <FadeIn key="join-typing" className="flex min-h-0 flex-1 flex-col items-center [justify-content:safe_center] gap-5 overflow-y-auto px-5 py-[1.875rem]">
            <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">Código de 4 dígitos</div>
            <div className="flex gap-3">
              {code.map((d, i) => (
                <CodeDigit key={i} digit={d || undefined} focused={d === ''} />
              ))}
            </div>
            {keypad}
            {errorLine}
            <div className="flex w-full flex-col gap-2">
              <Button variant="primary" block disabled={!codeFilled || busy} onClick={joinWithCode}>
                {busy ? 'Uniéndose…' : 'Unirse'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setMode('main')}>Cancelar</Button>
            </div>
          </FadeIn>
        )}
        </AnimatePresence>
      </div>
    );
  }

  // ------- DESKTOP -------
  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
      <TopBar
        right={
          <Button size="sm" variant="ghost" onClick={() => navigate('/')}>← Menú</Button>
        }
      />

      <AnimatePresence mode="wait">
      {mode === 'main' && (
        <FadeIn key="main" className="flex flex-1 items-stretch justify-center gap-12 px-[3.75rem] py-10">
          <div className="flex max-w-[420px] flex-1 flex-col justify-between gap-5 rounded-[14px] bg-bone p-12 text-ink">
            <div className="flex flex-col gap-4">
              <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-70">Pública</div>
              <div className="font-display font-bold leading-none text-[2.25rem]">Unirse a una mesa aleatoria</div>
              <div className="self-start">
                <RankBadge points={user.points} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="font-body text-fs-100 tracking-[0.04em] text-ink opacity-70">
                Las partidas públicas cuentan para el ranking global.
              </div>
              <Button variant="primary" block disabled={busy} onClick={findPublic}>
                {busy ? 'Conectando…' : 'Buscar partida'}
              </Button>
            </div>
          </div>

          <div className="flex max-w-[420px] flex-1 flex-col justify-between gap-5 rounded-[14px] border-[1.5px] border-bone bg-ink p-12">
            <div className="flex flex-col gap-4">
              <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">Privada</div>
              <div className="font-display font-bold leading-none text-[2.25rem]">Partida privada</div>
              <div className="font-body leading-[1.45] max-w-[320px] opacity-80">
                Crea una sala con un código de 4 dígitos o únete a una existente.
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="font-body text-fs-100 tracking-[0.04em] opacity-70">Las partidas privadas no cuentan para el ranking.</div>
              <Button variant="outline" block disabled={busy} onClick={createPrivate}>
                Crear partida
              </Button>
              <Button variant="outline" block onClick={resetToJoin}>
                Unirse a partida
              </Button>
            </div>
          </div>

          {error && (
            <div className="absolute bottom-10 left-0 right-0 flex justify-center">
              {errorLine}
            </div>
          )}
        </FadeIn>
      )}

      {mode === 'create' && (
        <FadeIn key="create" className="flex flex-1 flex-col items-center justify-center gap-6 px-[3.75rem] py-10">
          <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">Tu código de sala</div>
          <div className="mt-2 flex items-center gap-4">
            {createdCode.split('').map((d, i) => <CodeDigit key={i} digit={d} />)}
          </div>
          <div className="font-body text-fs-100 tracking-[0.04em] opacity-70 max-w-[360px] text-center">
            Comparte este código con tus amigos. Las privadas no cuentan para el ranking.
          </div>
          <div className="mt-2 flex gap-4">
            <Button variant="ghost" onClick={() => setMode('main')}>Cancelar</Button>
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(createdCode)}>
              Copiar código
            </Button>
            <Button variant="primary" onClick={goToCreatedLobby}>
              Ir al lobby
            </Button>
          </div>
        </FadeIn>
      )}

      {mode === 'join-typing' && (
        <FadeIn key="join-typing" className="flex flex-1 flex-col items-center justify-center gap-6 px-[3.75rem] py-10">
          <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">Código de 4 dígitos</div>
          <div className="flex gap-4">
            {code.map((d, i) => (
              <CodeDigit key={i} digit={d || undefined} focused={d === ''} />
            ))}
          </div>
          {keypad}
          {errorLine}
          <div className="mt-2 flex gap-4">
            <Button variant="ghost" onClick={() => setMode('main')}>Cancelar</Button>
            <Button variant="primary" disabled={!codeFilled || busy} onClick={joinWithCode}>
              {busy ? 'Uniéndose…' : 'Unirse'}
            </Button>
          </div>
        </FadeIn>
      )}
      </AnimatePresence>
    </div>
  );
};

export default Online;
