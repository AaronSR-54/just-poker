import { describe, it, expect, vi, beforeEach } from 'vitest';

const storage = new Map<string, string>();
vi.stubGlobal('window', {
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => void storage.set(key, value),
    removeItem: (key: string) => void storage.delete(key),
  },
});

const audioInstances: Array<{ play: ReturnType<typeof vi.fn> }> = [];
class FakeAudio {
  volume = 0;
  preload = '';
  play = vi.fn(() => Promise.resolve());
  canPlayType = () => 'probably';
  constructor(_src: string) {
    audioInstances.push(this);
  }
}
vi.stubGlobal('Audio', FakeAudio);

const { playSfx, preloadSounds } = await import('./sfx');
const { useCapabilityStore } = await import('../store/capabilityStore');
const { useSettingsStore } = await import('../store/settingsStore');

describe('efectos de sonido según soporte', () => {
  beforeEach(() => {
    audioInstances.length = 0;
    useSettingsStore.setState({ sfxVolume: 0.8 });
    useCapabilityStore.setState({ sfx: true });
  });

  it('no reproduce ni precarga sin soporte', () => {
    useCapabilityStore.setState({ sfx: false });
    playSfx('ui_click');
    preloadSounds();
    expect(audioInstances).toHaveLength(0);
  });

  it('reproduce con soporte', () => {
    playSfx('ui_click');
    expect(audioInstances).toHaveLength(1);
    expect(audioInstances[0].play).toHaveBeenCalledTimes(1);
  });
});
