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
