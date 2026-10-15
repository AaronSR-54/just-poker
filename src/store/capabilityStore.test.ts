import { describe, it, expect, beforeEach } from 'vitest';
import { useCapabilityStore } from './capabilityStore';

describe('capabilityStore', () => {
  beforeEach(() => {
    useCapabilityStore.setState({ music: true, sfx: true, haptics: true });
  });

  it('cambia music sin alterar sfx ni haptics', () => {
    useCapabilityStore.getState().setMusicSupported(false);
    const state = useCapabilityStore.getState();
    expect(state.music).toBe(false);
    expect(state.sfx).toBe(true);
    expect(state.haptics).toBe(true);
  });
});
