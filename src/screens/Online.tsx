import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import { AnimatePresence } from 'framer-motion';
import { FadeIn } from '../components/Animated';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useI18n } from '../i18n';
import { connectSocket, emitAck } from '../net/socket';
import { getPlayerName, setPlayerName, getActiveOnlineSession } from '../net/onlineSession';
import { randomName } from '../utils/randomName';
import { onlineError } from '../utils/onlineError';

type OnlineMode = 'main' | 'join';

const CodeDigit: React.FC<{ digit?: string; focused?: boolean }> = ({ digit, focused = false }) => {
  const hasDigit = digit !== undefined && digit !== '';
  return (
    <div
      className={[
        'flex h-16 w-14 items-center justify-center rounded-[14px] bg-ink-700 sm:h-20 sm:w-16',
        'font-display font-bold text-fs-600 leading-none sm:text-fs-700',
        'transition-[border-color] duration-200',
        focused ? 'border-2 border-bone' : 'border-[1.5px] border-bone/20',
        hasDigit ? 'text-bone' : '',
      ].join(' ')}
    >
      {hasDigit ? digit : <span className="opacity-[0.18]">0</span>}
    </div>
  );
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

const KeypadKey: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="flex size-13 cursor-pointer items-center justify-center rounded-full border border-bone/20 bg-ink font-display font-bold text-fs-600 text-bone transition-[transform,background-color,border-color] duration-[240ms] ease-brand hover:-translate-y-0.5 hover:border-bone/40 hover:bg-ink-600 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone md:size-14"
  >
    {children}
  </button>
);

/** Hub de juego con amigos: crear una partida privada o unirse con un código. */
const Online: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const { t } = useI18n();

  const [mode, setMode] = useState<OnlineMode>('main');
  const [code, setCode] = useState<string[]>(['', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [session] = useState(() => getActiveOnlineSession());

  const ensureName = () => {
    const name = getPlayerName() ?? randomName();
    setPlayerName(name);
    return name;
  };

  const handleCodeInput = (val: string) => {
    const next = [...code];
    if (val === '') {
      for (let i = 3; i >= 0; i--) {
        if (next[i] !== '') {
          next[i] = '';
          break;
        }
      }
    } else if (/^\d$/.test(val)) {
      const idx = next.findIndex((d) => d === '');
      if (idx >= 0) next[idx] = val;
    }
    setCode(next);
  };

  const codeFilled = code.every((d) => d !== '');

  const createPrivate = async () => {
    setBusy(true);
    setError(null);
    try {
      await connectSocket();
      const res = await emitAck<{ ok: boolean; roomId?: string; error?: string }>('room:create', {
        name: ensureName(),
      });
      if (!res?.ok || !res.roomId) {
        setError(onlineError(res?.error));
        return;
      }
      navigate(`/lobby/${res.roomId}`);
    } catch {
      setError(t('online.serverError'));
    } finally {
      setBusy(false);
    }
  };

  const joinWithCode = () => {
    if (!codeFilled) return;
    ensureName();
    navigate(`/join/${code.join('')}`);
  };

  const errorLine = error && (
    <div className="max-w-[320px] text-center font-body text-fs-100 tracking-[0.04em] text-danger opacity-70">
      {error}
    </div>
  );

  const keypad = (
    <div className="flex flex-col items-center gap-2">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex gap-2">
          {KEYS.slice(row * 3, row * 3 + 3).map((k) => (
            <KeypadKey key={k} onClick={() => handleCodeInput(k)}>
              {k}
            </KeypadKey>
          ))}
        </div>
      ))}
      <div className="flex gap-2">
        <KeypadKey onClick={() => handleCodeInput('0')}>0</KeypadKey>
        <KeypadKey onClick={() => handleCodeInput('')}>⌫</KeypadKey>
      </div>
    </div>
  );

  const hubTitle = (cls: string) => (
    <div className={`font-display font-bold leading-[0.96] tracking-[-0.015em] ${cls}`}>
      {t('online.hubTitleRest')} <em className="font-light italic tracking-normal">{t('online.hubTitleEm')}</em>
    </div>
  );

  const joinTitle = (cls: string) => (
    <div className={`font-display font-bold leading-[0.96] tracking-[-0.015em] ${cls}`}>
      {t('online.joinTitleRest')} <em className="font-light italic tracking-normal">{t('online.joinTitleEm')}</em>
    </div>
  );

  const actionsBox = (extra: string) => (
    <div className={`flex w-full flex-col items-center gap-3 rounded-[14px] bg-ink-900 text-center ${extra}`}>
      {session && (
        <>
          <Button variant="primary" block onClick={() => navigate(`/game/online-${session.roomId}`)}>
            {t('online.resume')}
          </Button>
          <div className="font-body text-fs-100 tracking-[0.04em] opacity-70">
            {t('online.roomContext', { code: session.code, count: session.seats.length })}
          </div>
        </>
      )}
      <Button variant={session ? 'outline' : 'primary'} block disabled={busy} onClick={createPrivate}>
        {busy ? t('online.creating') : t('online.create')}
      </Button>
      <Button variant="outline" block onClick={() => { setError(null); setMode('join'); }}>
        {t('online.join')}
      </Button>
    </div>
  );

  if (isMobile) {
    return (
      <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-[1.375rem] pb-7 pt-8">
          <PageHeader
            onBack={() => navigate('/')}
            backLabel={t('common.backToMenu')}
            className="flex w-full items-start justify-between gap-4"
            wordmarkClassName="text-fs-600"
          />
          <AnimatePresence mode="wait">
            {mode === 'main' && (
              <FadeIn key="main" className="flex min-h-0 flex-1 flex-col items-center gap-5 [justify-content:safe_center] py-6">
                {hubTitle('text-center text-fs-700')}
                <div className="mx-auto max-w-[280px] text-center font-body text-fs-200 leading-[1.45] opacity-70">
                  {t('online.hubHint')}
                </div>
                {actionsBox('p-7')}
                {errorLine}
              </FadeIn>
            )}

            {mode === 'join' && (
              <FadeIn key="join" className="flex min-h-0 flex-1 flex-col items-center gap-5 [justify-content:safe_center] py-6">
                {joinTitle('text-center text-fs-700')}
                <div className="max-w-[280px] text-center font-body text-fs-200 leading-[1.45] opacity-70">{t('online.joinHint')}</div>
                <div className="flex gap-3">
                  {code.map((d, i) => (
                    <CodeDigit key={i} digit={d || undefined} focused={d === ''} />
                  ))}
                </div>
                {keypad}
                <div className="flex w-full flex-col gap-2">
                  <Button variant="primary" block disabled={!codeFilled} onClick={joinWithCode}>
                    {t('online.joinAction')}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setMode('main')}>{t('online.cancel')}</Button>
                </div>
              </FadeIn>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
      <PageHeader onBack={() => navigate('/')} backLabel={t('common.backToMenu')} />

      <div className="mx-auto flex min-h-0 w-full max-w-[87.5rem] flex-1 items-center justify-center px-10 pb-[3.5rem] pt-4 lg:px-20">
        <AnimatePresence mode="wait">
          {mode === 'main' && (
            <FadeIn key="main" className="flex w-full items-stretch justify-center gap-8 lg:gap-12">
              <div className="flex min-h-0 flex-[48] flex-col justify-center gap-4">
                {hubTitle('text-fs-800')}
                <p className="max-w-[440px] font-body leading-[1.45] opacity-70">{t('online.hubHint')}</p>
              </div>
              <div className="flex flex-[52] flex-col justify-center">
                {actionsBox('max-w-[420px] p-12')}
                {errorLine}
              </div>
            </FadeIn>
          )}

          {mode === 'join' && (
            <FadeIn key="join" className="flex w-full items-stretch justify-center gap-8 lg:gap-12">
              <div className="flex min-h-0 flex-[48] flex-col justify-center gap-4">
                {joinTitle('text-fs-700')}
                <p className="max-w-[440px] font-body leading-[1.45] opacity-70">{t('online.joinHint')}</p>
              </div>
              <div className="flex flex-[52] flex-col items-center justify-center gap-6">
                <div className="flex gap-4">
                  {code.map((d, i) => (
                    <CodeDigit key={i} digit={d || undefined} focused={d === ''} />
                  ))}
                </div>
                {keypad}
                <div className="mt-2 flex gap-4">
                  <Button variant="ghost" onClick={() => setMode('main')}>{t('online.cancel')}</Button>
                  <Button variant="primary" disabled={!codeFilled} onClick={joinWithCode}>
                    {t('online.joinAction')}
                  </Button>
                </div>
              </div>
            </FadeIn>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Online;
