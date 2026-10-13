import { useEffect, useMemo, useRef } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { createDurationTracker, resolveInitialElapsed, type DurationTracker } from '../../../utils/duration';
import { useGameDurationStore } from '../../../store/gameDurationStore';

interface UseGameDurationOptions {
  /** Clave de la partida (`local:<gameId>` / `online:<roomId>`). */
  key: string;
  /** Si es `true`, conserva el total guardado; si no, reinicia a cero. */
  isResume: boolean;
  /** No inicializa hasta que la partida está lista (evita resetear durante la carga). */
  ready: boolean;
}

export interface GameDurationApi {
  /** Total jugado en ms, leído en el momento de llamar. */
  getElapsedMs: () => number;
  /** Reinicia el cómputo (revancha o partida nueva sin remontar). */
  reset: () => void;
}

/**
 * Acumula el tiempo jugado de una partida mientras su pantalla está abierta y en
 * primer plano. Se pausa al ocultar la app o salir al menú, y se reanuda desde el
 * valor guardado. Compartido por la partida local y la online.
 */
export function useGameDuration({ key, isResume, ready }: UseGameDurationOptions): GameDurationApi {
  const trackerRef = useRef<DurationTracker | null>(null);
  const initKeyRef = useRef<string | null>(null);

  // Inicializa el contador una sola vez por partida, cuando ya está lista.
  useEffect(() => {
    if (!ready || initKeyRef.current === key) return;
    initKeyRef.current = key;
    const store = useGameDurationStore.getState();
    const initial = resolveInitialElapsed(store.elapsedByKey[key], isResume);
    if (!isResume) store.resetKey(key);
    trackerRef.current = createDurationTracker(initial);
  }, [ready, key, isResume]);

  // Acumula mientras la pantalla está visible en primer plano.
  useEffect(() => {
    if (!ready) return;
    const tracker = trackerRef.current;
    if (!tracker) return;

    const persist = () => useGameDurationStore.getState().setElapsed(key, tracker.value());
    const resume = () => tracker.start();
    const pause = () => {
      tracker.pause();
      persist();
    };

    const onVisibility = () => (document.hidden ? pause() : resume());
    const onPageHide = () => pause();

    resume();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', onPageHide);
    const nativeListener = Capacitor.isNativePlatform()
      ? CapacitorApp.addListener('appStateChange', ({ isActive }) => (isActive ? resume() : pause()))
      : null;

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', onPageHide);
      pause();
      if (nativeListener) void nativeListener.then((handle) => handle.remove());
    };
  }, [ready, key]);

  return useMemo<GameDurationApi>(
    () => ({
      getElapsedMs: () => trackerRef.current?.elapsed() ?? 0,
      reset: () => {
        trackerRef.current?.reset();
        useGameDurationStore.getState().resetKey(key);
        trackerRef.current?.start();
      },
    }),
    [key]
  );
}
