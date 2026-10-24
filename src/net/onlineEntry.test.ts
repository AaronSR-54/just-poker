import { describe, it, expect } from 'vitest';
import { resolveOnlineEntry } from './onlineEntry';
import type { OnlineSession } from './onlineSession';

function makeSession(code: string, roomId = `room-${code}`): OnlineSession {
  return {
    roomId,
    code,
    hostId: null,
    seats: [],
    mySeat: 0,
    isHost: false,
    playerId: 'me',
    playerName: 'Me',
    started: false,
    savedAt: Date.now(),
  };
}

describe('resolveOnlineEntry — invitación sin partida en curso', () => {
  it('rellena el formulario de unirse aunque el dispositivo tenga nombre guardado', () => {
    // El nombre guardado no participa en la decisión: solo rellena el campo.
    const entry = resolveOnlineEntry({ code: 'ABCD', session: null, room: null });
    expect(entry).toEqual({ kind: 'prefill', code: 'ABCD' });
  });

  it('rellena el formulario sin nombre guardado', () => {
    const entry = resolveOnlineEntry({ code: 'wxyz', session: null, room: null });
    expect(entry).toEqual({ kind: 'prefill', code: 'WXYZ' });
  });

  it('normaliza el código antes de rellenarlo', () => {
    const entry = resolveOnlineEntry({ code: ' ab-cd1 ', session: null, room: null });
    expect(entry).toEqual({ kind: 'prefill', code: 'ABCD' });
  });

  it('no une nunca por sí solo', () => {
    const entry = resolveOnlineEntry({ code: 'ABCD', session: null, room: null });
    expect(entry.kind).toBe('prefill');
  });
});

describe('resolveOnlineEntry — sesión en curso', () => {
  it('se reincorpora cuando la invitación es de la misma sala', () => {
    const session = makeSession('ABCD');
    const entry = resolveOnlineEntry({ code: 'abcd', session, room: null });
    expect(entry).toEqual({ kind: 'rejoin', session });
  });

  it('pide confirmación cuando la invitación es de otra sala', () => {
    const entry = resolveOnlineEntry({ code: 'WXYZ', session: makeSession('ABCD'), room: null });
    expect(entry).toEqual({ kind: 'confirm', code: 'WXYZ' });
  });

  it('reanuda la sesión al entrar sin código', () => {
    const session = makeSession('ABCD');
    expect(resolveOnlineEntry({ code: null, session, room: null })).toEqual({
      kind: 'rejoin',
      session,
    });
  });

  it('no reanuda la sesión si se pide una partida nueva', () => {
    expect(
      resolveOnlineEntry({ code: null, session: makeSession('ABCD'), room: null, wantsNewGame: true }),
    ).toEqual({ kind: 'ignore' });
  });
});

describe('resolveOnlineEntry — sala abierta en pantalla', () => {
  it('pide confirmación al abrir otra sala', () => {
    const entry = resolveOnlineEntry({ code: 'WXYZ', session: null, room: { code: 'ABCD' } });
    expect(entry).toEqual({ kind: 'confirm', code: 'WXYZ' });
  });

  it('no hace nada si el código es el de la sala abierta', () => {
    const entry = resolveOnlineEntry({ code: 'abcd', session: null, room: { code: 'ABCD' } });
    expect(entry).toEqual({ kind: 'ignore' });
  });

  it('la sala abierta manda sobre una sesión de otra sala', () => {
    const entry = resolveOnlineEntry({
      code: 'WXYZ',
      session: makeSession('ZZZZ'),
      room: { code: 'ABCD' },
    });
    expect(entry).toEqual({ kind: 'confirm', code: 'WXYZ' });
  });
});

describe('resolveOnlineEntry — casos límite', () => {
  it('ignora un código vacío o inválido sin sesión', () => {
    expect(resolveOnlineEntry({ code: '', session: null, room: null })).toEqual({ kind: 'ignore' });
    expect(resolveOnlineEntry({ code: '!!', session: null, room: null })).toEqual({ kind: 'ignore' });
    expect(resolveOnlineEntry({ code: undefined, session: null, room: null })).toEqual({ kind: 'ignore' });
  });

  it('no repite la entrada con un código ya gestionado', () => {
    const entry = resolveOnlineEntry({
      code: 'ABCD',
      session: null,
      room: null,
      handledCode: 'ABCD',
    });
    expect(entry).toEqual({ kind: 'ignore' });
  });

  it('permite gestionar un código distinto al ya gestionado', () => {
    const entry = resolveOnlineEntry({
      code: 'WXYZ',
      session: null,
      room: null,
      handledCode: 'ABCD',
    });
    expect(entry).toEqual({ kind: 'prefill', code: 'WXYZ' });
  });
});
