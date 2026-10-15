import { describe, it, expect, vi, afterEach } from 'vitest';

const native = vi.hoisted(() => ({ value: false }));
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => native.value },
}));

const { detectSfxSupport, detectHapticsSupport } = await import('./mediaSupport');

afterEach(() => {
  vi.unstubAllGlobals();
  native.value = false;
});

describe('detectSfxSupport', () => {
  it('sin Audio no hay soporte', () => {
    vi.stubGlobal('Audio', undefined);
    expect(detectSfxSupport()).toBe(false);
  });

  it('canPlayType vacío no hay soporte', () => {
    vi.stubGlobal('Audio', class { canPlayType = () => ''; });
    expect(detectSfxSupport()).toBe(false);
  });

  it('con canPlayType válido hay soporte', () => {
    vi.stubGlobal('Audio', class { canPlayType = () => 'probably'; });
    expect(detectSfxSupport()).toBe(true);
  });
});

describe('detectHapticsSupport', () => {
  it('sin navigator no hay soporte', () => {
    vi.stubGlobal('navigator', undefined);
    expect(detectHapticsSupport()).toBe(false);
  });

  it('en nativo hay soporte', () => {
    native.value = true;
    vi.stubGlobal('navigator', undefined);
    expect(detectHapticsSupport()).toBe(true);
  });

  it('sin Vibration API no hay soporte', () => {
    vi.stubGlobal('navigator', {});
    expect(detectHapticsSupport()).toBe(false);
  });

  it('escritorio con vibrate y puntero fino no hay soporte', () => {
    vi.stubGlobal('navigator', { vibrate: () => true, userAgentData: { mobile: false } });
    expect(detectHapticsSupport()).toBe(false);
  });

  it('móvil con vibrate hay soporte', () => {
    vi.stubGlobal('navigator', { vibrate: () => true, userAgentData: { mobile: true } });
    expect(detectHapticsSupport()).toBe(true);
  });

  it('con puntero táctil hay soporte', () => {
    vi.stubGlobal('navigator', { vibrate: () => true });
    vi.stubGlobal('window', { matchMedia: () => ({ matches: true }) });
    expect(detectHapticsSupport()).toBe(true);
  });

  it('sin puntero táctil ni señal móvil no hay soporte', () => {
    vi.stubGlobal('navigator', { vibrate: () => true });
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });
    expect(detectHapticsSupport()).toBe(false);
  });
});
