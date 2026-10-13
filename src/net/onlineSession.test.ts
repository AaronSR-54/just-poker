import { describe, it, expect, beforeEach, vi } from 'vitest';

function installStorage(): void {
  const store = new Map<string, string>();
  const stub: Storage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (index) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };
  (globalThis as { localStorage: Storage }).localStorage = stub;
}

describe('onlineSession — ventana de reanudación', () => {
  beforeEach(() => {
    installStorage();
    vi.resetModules();
  });

  it('alinea la ventana con la expulsión por inactividad (120 s)', async () => {
    const mod = await import('./onlineSession');
    expect(mod.ONLINE_RESUME_WINDOW_MS).toBe(120 * 1000);
  });

  it('descarta la sesión pasada la ventana', async () => {
    const mod = await import('./onlineSession');
    const { markPlayed } = await import('../utils/lastPlayed');

    mod.setOnlineSession({
      roomId: 'r1',
      code: 'ABCD',
      hostId: 'a',
      seats: [],
      mySeat: 0,
      isHost: true,
      playerId: 'a',
      playerName: 'A',
    });
    markPlayed('online', Date.now());
    expect(mod.getActiveOnlineSession()).not.toBeNull();

    markPlayed('online', Date.now() - mod.ONLINE_RESUME_WINDOW_MS - 1000);
    expect(mod.getActiveOnlineSession()).toBeNull();
    expect(mod.getOnlineSession()).toBeNull();
  });
});

describe('onlineSession — isOtherRoomJoin', () => {
  beforeEach(() => {
    installStorage();
    vi.resetModules();
  });

  it('detecta entrar en otra sala con una partida en curso', async () => {
    const { isOtherRoomJoin } = await import('./onlineSession');
    expect(isOtherRoomJoin({ code: 'ABCD' }, 'WXYZ')).toBe(true);
  });

  it('no avisa con el mismo código (normalizado)', async () => {
    const { isOtherRoomJoin } = await import('./onlineSession');
    expect(isOtherRoomJoin({ code: 'ABCD' }, 'aBcD')).toBe(false);
  });

  it('no avisa sin partida en curso', async () => {
    const { isOtherRoomJoin } = await import('./onlineSession');
    expect(isOtherRoomJoin(null, 'ABCD')).toBe(false);
  });

  it('no avisa con un código vacío', async () => {
    const { isOtherRoomJoin } = await import('./onlineSession');
    expect(isOtherRoomJoin({ code: 'ABCD' }, '')).toBe(false);
  });

  it('normaliza el código (mayúsculas, sin caracteres extraños, hasta 4)', async () => {
    const { isOtherRoomJoin, normalizeRoomCode } = await import('./onlineSession');
    expect(normalizeRoomCode(' ab-cd1 ')).toBe('ABCD');
    expect(isOtherRoomJoin({ code: 'ABCD' }, 'wxyz9')).toBe(true);
  });
});

describe('onlineSession — lobbySessionFromRoom', () => {
  beforeEach(() => {
    installStorage();
    vi.resetModules();
  });

  it('construye la sesión de un lobby sin empezar (anfitrión)', async () => {
    const { lobbySessionFromRoom } = await import('./onlineSession');
    const session = lobbySessionFromRoom(
      {
        roomId: 'r1',
        code: 'ABCD',
        hostId: 'me',
        started: false,
        players: [
          { userId: 'me', username: 'Me' },
          { userId: 'you', username: 'You' },
        ],
      },
      'me',
      'Me',
    );
    expect(session.started).toBe(false);
    expect(session.isHost).toBe(true);
    expect(session.mySeat).toBe(0);
    expect(session.seats).toEqual([
      { seat: 0, userId: 'me', username: 'Me' },
      { seat: 1, userId: 'you', username: 'You' },
    ]);
  });

  it('marca mySeat según el jugador y no anfitrión', async () => {
    const { lobbySessionFromRoom } = await import('./onlineSession');
    const session = lobbySessionFromRoom(
      {
        roomId: 'r2',
        code: 'WXYZ',
        hostId: 'host',
        started: false,
        players: [
          { userId: 'host', username: 'Host' },
          { userId: 'me', username: 'Me' },
        ],
      },
      'me',
      'Me',
    );
    expect(session.isHost).toBe(false);
    expect(session.mySeat).toBe(1);
    expect(session.playerId).toBe('me');
  });
});
