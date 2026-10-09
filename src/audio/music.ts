import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useSettingsStore } from '../store/settingsStore';
import { createMusicController, type MusicController, type MusicDeps } from './musicController';

/** Pista de fondo: un único tema global que suena en bucle. */
const TRACK_URL = '/music/theme.webm';

let controller: MusicController | null = null;

function browserDeps(): MusicDeps {
  return {
    createContext: () => {
      const Ctor =
        window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      return new Ctor();
    },
    fetchTrack: (url) => fetch(url).then((res) => res.arrayBuffer()),
    decodeTrack: (ctx, data) => ctx.decodeAudioData(data),
    getVolume: () => useSettingsStore.getState().musicVolume,
    setTimeout: (handler, ms) => window.setTimeout(handler, ms),
    clearTimeout: (id) => window.clearTimeout(id),
  };
}

function ensureController(): MusicController {
  if (!controller) controller = createMusicController(browserDeps(), TRACK_URL);
  return controller;
}

/** Baja momentáneamente la música para que el efecto se oiga con claridad. */
export function duckMusic(): void {
  controller?.duck();
}

/** Arranca la música de fondo. Idempotente; seguro de llamar en cada gesto. */
export function startMusic(): Promise<void> {
  ensureController().handleGesture();
  return Promise.resolve();
}

/**
 * Prepara la música de fondo: arranca en el primer gesto (política de autoplay),
 * reintenta mientras no suene, sigue el volumen de ajustes y se pausa/reanuda con
 * el ciclo de vida de la pestaña o de la app.
 */
export function initMusic(): () => void {
  const active = ensureController();

  const start = (): void => {
    active.handleGesture();
    if (active.isStarted()) {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
    }
  };
  window.addEventListener('pointerdown', start);
  window.addEventListener('keydown', start);

  const onVisibility = (): void => {
    active.handleVisibility(!document.hidden);
  };
  document.addEventListener('visibilitychange', onVisibility);
  active.handleVisibility(!document.hidden);
  active.attemptAutoplay();

  const nativeListener = Capacitor.isNativePlatform()
    ? CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        active.handleVisibility(isActive);
      })
    : null;

  const unsubscribe = useSettingsStore.subscribe((state, prev) => {
    if (state.musicVolume === prev.musicVolume) return;
    active.handleVolume();
  });

  return () => {
    window.removeEventListener('pointerdown', start);
    window.removeEventListener('keydown', start);
    document.removeEventListener('visibilitychange', onVisibility);
    if (nativeListener) void nativeListener.then((handle) => handle.remove());
    unsubscribe();
  };
}
