import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Tiempo jugado acumulado por partida (clave `local:<gameId>` / `online:<roomId>`).
 * Persistido para que al reanudar una partida aparcada el cómputo continúe.
 */
interface GameDurationState {
  elapsedByKey: Record<string, number>;
  setElapsed: (key: string, ms: number) => void;
  resetKey: (key: string) => void;
}

export const useGameDurationStore = create<GameDurationState>()(
  persist(
    (set) => ({
      elapsedByKey: {},
      setElapsed: (key, ms) =>
        set((s) => {
          const next = Math.max(0, ms);
          if (s.elapsedByKey[key] === next) return s;
          return { elapsedByKey: { ...s.elapsedByKey, [key]: next } };
        }),
      resetKey: (key) =>
        set((s) => {
          if (!(key in s.elapsedByKey)) return s;
          const next = { ...s.elapsedByKey };
          delete next[key];
          return { elapsedByKey: next };
        }),
    }),
    { name: 'just-poker-durations' }
  )
);
