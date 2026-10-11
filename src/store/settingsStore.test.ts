import { describe, it, expect, beforeEach, vi } from 'vitest';

const storage = new Map<string, string>();
const localStorageShim = {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => void storage.set(key, value),
  removeItem: (key: string) => void storage.delete(key),
};
vi.stubGlobal('window', { localStorage: localStorageShim });

const { useSettingsStore } = await import('./settingsStore');

describe('settingsStore hapticsEnabled', () => {
  beforeEach(() => {
    storage.clear();
    useSettingsStore.setState({ hapticsEnabled: true });
  });

  it('viene activado por defecto', () => {
    expect(useSettingsStore.getState().hapticsEnabled).toBe(true);
  });

  it('persiste el valor bajo just-poker-settings', () => {
    useSettingsStore.getState().setHapticsEnabled(false);
    const raw = storage.get('just-poker-settings');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw as string).state.hapticsEnabled).toBe(false);
  });

  it('lee el valor guardado al rehidratar', async () => {
    storage.set(
      'just-poker-settings',
      JSON.stringify({ state: { hapticsEnabled: false }, version: 0 })
    );
    await useSettingsStore.persist.rehydrate();
    expect(useSettingsStore.getState().hapticsEnabled).toBe(false);
  });
});
