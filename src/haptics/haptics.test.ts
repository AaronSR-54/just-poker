import { describe, it, expect, vi, beforeEach } from 'vitest';

const storage = new Map<string, string>();
vi.stubGlobal('window', {
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => void storage.set(key, value),
    removeItem: (key: string) => void storage.delete(key),
  },
});

vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    impact: vi.fn(() => Promise.resolve()),
    notification: vi.fn(() => Promise.resolve()),
  },
  ImpactStyle: { Heavy: 'HEAVY', Medium: 'MEDIUM', Light: 'LIGHT' },
  NotificationType: { Success: 'SUCCESS', Warning: 'WARNING', Error: 'ERROR' },
}));

const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
const { playHaptic } = await import('./haptics');
const { useSettingsStore } = await import('../store/settingsStore');
const { useCapabilityStore } = await import('../store/capabilityStore');

describe('playHaptic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({ hapticsEnabled: true });
    useCapabilityStore.setState({ haptics: true });
  });

  it('no invoca el plugin cuando el dispositivo no puede vibrar', () => {
    useCapabilityStore.setState({ haptics: false });
    playHaptic('tap');
    playHaptic('win');
    expect(Haptics.impact).not.toHaveBeenCalled();
    expect(Haptics.notification).not.toHaveBeenCalled();
  });

  it('no invoca el plugin cuando la vibración está desactivada', () => {
    useSettingsStore.setState({ hapticsEnabled: false });
    playHaptic('tap');
    playHaptic('turn');
    playHaptic('expire');
    playHaptic('win');
    expect(Haptics.impact).not.toHaveBeenCalled();
    expect(Haptics.notification).not.toHaveBeenCalled();
  });

  it('mapea cada nombre al estilo esperado', () => {
    playHaptic('tap');
    expect(Haptics.impact).toHaveBeenCalledWith({ style: ImpactStyle.Light });

    playHaptic('turn');
    expect(Haptics.impact).toHaveBeenCalledWith({ style: ImpactStyle.Medium });

    playHaptic('tick');
    expect(Haptics.impact).toHaveBeenCalledWith({ style: ImpactStyle.Light });

    playHaptic('expire');
    expect(Haptics.notification).toHaveBeenCalledWith({ type: NotificationType.Warning });

    playHaptic('win');
    expect(Haptics.notification).toHaveBeenCalledWith({ type: NotificationType.Success });
  });

  it('no lanza si el plugin rechaza', () => {
    vi.mocked(Haptics.impact).mockRejectedValueOnce(new Error('no soportado'));
    expect(() => playHaptic('tap')).not.toThrow();
  });
});
