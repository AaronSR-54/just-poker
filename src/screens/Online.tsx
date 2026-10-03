import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Button from '../components/Button';
import RankBadge from '../components/RankBadge';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useUserStore } from '../store/userStore';
import { connectSocket, emitAck } from '../net/socket';

type OnlineMode = 'main' | 'create' | 'join' | 'join-typing' | 'busy';

const CodeDigit: React.FC<{ digit?: string; focused?: boolean }> = ({ digit, focused = false }) => {
  const hasDigit = digit !== undefined && digit !== '';
  return (
    <div
      style={{
        width: 64,
        height: 80,
        borderRadius: 8,
        border: focused ? '2px solid var(--bone)' : '1.5px solid rgba(205,197,183,0.20)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-display)',
        fontWeight: 700,
        fontSize: 32,
        lineHeight: 1,
        color: hasDigit ? 'var(--bone)' : undefined,
        background: 'transparent',
        boxShadow: focused ? '0 0 0 6px rgba(205,197,183,0.10)' : 'none',
        transition: 'border-color 200ms, box-shadow 200ms',
      }}
    >
      {hasDigit ? digit : <span style={{ opacity: 0.18 }}>0</span>}
    </div>
  );
};

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

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

  const keypad = (
    <div className="col gap-2" style={{ alignItems: 'center' }}>
      {[0, 1, 2].map(row => (
        <div key={row} className="row gap-2">
          {KEYS.slice(row * 3, row * 3 + 3).map(k => (
            <button
              key={k}
              type="button"
              className="jp-keypad-key"
              onClick={() => handleCodeInput(k)}
            >
              {k}
            </button>
          ))}
        </div>
      ))}
      <div className="row gap-2">
        <button type="button" className="jp-keypad-key" onClick={() => handleCodeInput('0')}>0</button>
        <button type="button" className="jp-keypad-key" onClick={() => handleCodeInput('')}>⌫</button>
      </div>
    </div>
  );

  const errorLine = error && (
    <div className="jp-caption" style={{ color: '#e8734a', textAlign: 'center', maxWidth: 320 }}>
      {error}
      <br />
      <span style={{ opacity: 0.7 }}>¿Está el servidor en marcha? (npm run dev en /server)</span>
    </div>
  );

  // ------- MOBILE -------
  if (isMobile) {
    return (
      <div className="jp-screen">
        {mode !== 'main' && (
          <div className="jp-bar">
            <div className="brand" style={{ fontSize: 14 }}>Just <em>Poker</em></div>
          </div>
        )}

        {mode === 'main' && (
          <div className="col gap-5" style={{ flex: 1, padding: '30px 20px', justifyContent: 'center' }}>
            <div className="brand" style={{ textAlign: 'center', marginBottom: 10 }}>
              Just <em>Poker</em>
            </div>
            <div className="jp-h2" style={{ textAlign: 'center', fontSize: 24 }}>Jugar en línea</div>

            <div
              className="col gap-3"
              style={{
                padding: 28, borderRadius: 14, background: 'var(--bone)', color: 'var(--ink)',
                alignItems: 'center', textAlign: 'center',
              }}
            >
              <div className="jp-eyebrow" style={{ opacity: 0.7 }}>Pública</div>
              <div className="jp-h3" style={{ fontSize: 18 }}>Unirse a una mesa aleatoria</div>
              <RankBadge points={user.points} />
              <Button variant="primary" block glow disabled={busy} onClick={findPublic}>
                {busy ? 'Conectando…' : 'Buscar partida'}
              </Button>
            </div>

            <div
              className="col gap-3"
              style={{
                padding: 28, borderRadius: 14, border: '1.5px solid var(--bone)',
                background: 'transparent', alignItems: 'center', textAlign: 'center',
              }}
            >
              <div className="jp-eyebrow">Privada</div>
              <div className="jp-h3" style={{ fontSize: 18 }}>Partida privada</div>
              <div className="jp-caption" style={{ maxWidth: 260 }}>
                Crea una sala con código o únete a una existente.
              </div>
              <Button variant="outline" block disabled={busy} onClick={createPrivate}>
                Crear partida
              </Button>
              <Button variant="outline" block onClick={() => { setMode('join-typing'); setCode(['', '', '', '']); setError(null); }}>
                Unirse a partida
              </Button>
            </div>

            {errorLine}
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>← Menú</Button>
          </div>
        )}

        {mode === 'create' && (
          <div className="col gap-5" style={{ flex: 1, padding: '30px 20px', justifyContent: 'center', alignItems: 'center' }}>
            <div className="jp-eyebrow">Código de sala</div>
            <div className="row gap-3">
              {createdCode.split('').map((d, i) => <CodeDigit key={i} digit={d} />)}
            </div>
            <div className="jp-caption" style={{ textAlign: 'center', maxWidth: 280 }}>
              Comparte este código. Las privadas no cuentan para el ranking.
            </div>
            <div className="col gap-2" style={{ width: '100%' }}>
              <Button variant="primary" block glow onClick={goToCreatedLobby}>
                Ir al lobby
              </Button>
              <Button variant="outline" block onClick={() => navigator.clipboard.writeText(createdCode)}>
                Copiar código
              </Button>
              <Button variant="ghost" block onClick={() => setMode('main')}>Cancelar</Button>
            </div>
          </div>
        )}

        {mode === 'join-typing' && (
          <div className="col gap-5" style={{ flex: 1, padding: '30px 20px', justifyContent: 'center', alignItems: 'center' }}>
            <div className="jp-eyebrow">Código de 4 dígitos</div>
            <div className="row gap-3">
              {code.map((d, i) => (
                <CodeDigit key={i} digit={d || undefined} focused={d === ''} />
              ))}
            </div>
            {keypad}
            {errorLine}
            <div className="col gap-2" style={{ width: '100%' }}>
              <Button variant="primary" block glow disabled={!codeFilled || busy} onClick={joinWithCode}>
                {busy ? 'Uniéndose…' : 'Unirse'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setMode('main')}>Cancelar</Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ------- DESKTOP -------
  return (
    <div className="jp-screen">
      <TopBar
        right={
          <Button size="sm" variant="ghost" onClick={() => navigate('/')}>← Menú</Button>
        }
      />

      {mode === 'main' && (
        <div className="row" style={{ flex: 1, padding: '40px 60px', gap: 48, alignItems: 'stretch', justifyContent: 'center' }}>
          <div
            className="col gap-5"
            style={{
              flex: 1, maxWidth: 420, padding: 48, borderRadius: 14,
              background: 'var(--bone)', color: 'var(--ink)', justifyContent: 'space-between',
            }}
          >
            <div className="col gap-4">
              <div className="jp-eyebrow" style={{ opacity: 0.7 }}>Pública</div>
              <div className="jp-h2" style={{ fontSize: 36 }}>Unirse a una mesa aleatoria</div>
              <div style={{ alignSelf: 'flex-start' }}>
                <RankBadge points={user.points} />
              </div>
            </div>
            <div className="col gap-3">
              <div className="jp-caption" style={{ color: 'var(--ink)', opacity: 0.7 }}>
                Las partidas públicas cuentan para el ranking global.
              </div>
              <Button variant="primary" block glow disabled={busy} onClick={findPublic}>
                {busy ? 'Conectando…' : 'Buscar partida'}
              </Button>
            </div>
          </div>

          <div
            className="col gap-5"
            style={{
              flex: 1, maxWidth: 420, padding: 48, borderRadius: 14,
              border: '1.5px solid var(--bone)', background: 'transparent', justifyContent: 'space-between',
            }}
          >
            <div className="col gap-4">
              <div className="jp-eyebrow">Privada</div>
              <div className="jp-h2" style={{ fontSize: 36 }}>Partida privada</div>
              <div className="jp-body" style={{ maxWidth: 320, opacity: 0.8 }}>
                Crea una sala con un código de 4 dígitos o únete a una existente.
              </div>
            </div>
            <div className="col gap-3">
              <div className="jp-caption">Las partidas privadas no cuentan para el ranking.</div>
              <Button variant="outline" block disabled={busy} onClick={createPrivate}>
                Crear partida
              </Button>
              <Button variant="outline" block onClick={() => { setMode('join-typing'); setCode(['', '', '', '']); setError(null); }}>
                Unirse a partida
              </Button>
            </div>
          </div>

          {error && (
            <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
              {errorLine}
            </div>
          )}
        </div>
      )}

      {mode === 'create' && (
        <div className="col gap-6" style={{ flex: 1, padding: '40px 60px', justifyContent: 'center', alignItems: 'center' }}>
          <div className="jp-eyebrow">Tu código de sala</div>
          <div className="row gap-4" style={{ alignItems: 'center', marginTop: 8 }}>
            {createdCode.split('').map((d, i) => <CodeDigit key={i} digit={d} />)}
          </div>
          <div className="jp-caption" style={{ textAlign: 'center', maxWidth: 360 }}>
            Comparte este código con tus amigos. Las privadas no cuentan para el ranking.
          </div>
          <div className="row gap-4" style={{ marginTop: 8 }}>
            <Button variant="ghost" onClick={() => setMode('main')}>Cancelar</Button>
            <Button variant="outline" onClick={() => navigator.clipboard.writeText(createdCode)}>
              Copiar código
            </Button>
            <Button variant="primary" glow onClick={goToCreatedLobby}>
              Ir al lobby
            </Button>
          </div>
        </div>
      )}

      {mode === 'join-typing' && (
        <div className="col gap-6" style={{ flex: 1, padding: '40px 60px', justifyContent: 'center', alignItems: 'center' }}>
          <div className="jp-eyebrow">Código de 4 dígitos</div>
          <div className="row gap-4">
            {code.map((d, i) => (
              <CodeDigit key={i} digit={d || undefined} focused={d === ''} />
            ))}
          </div>
          {keypad}
          {errorLine}
          <div className="row gap-4" style={{ marginTop: 8 }}>
            <Button variant="ghost" onClick={() => setMode('main')}>Cancelar</Button>
            <Button variant="primary" glow disabled={!codeFilled || busy} onClick={joinWithCode}>
              {busy ? 'Uniéndose…' : 'Unirse'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Online;
