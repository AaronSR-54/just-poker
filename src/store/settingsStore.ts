import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Multiplicadores de velocidad de juego disponibles. */
export type GameSpeed = 0.5 | 1 | 2 | 4;

export const GAME_SPEEDS: GameSpeed[] = [0.5, 1, 2, 4];

export const SPEED_LABELS: Record<GameSpeed, string> = {
  0.5: '×0,5',
  1: '×1',
  2: '×2',
  4: '×4',
};

interface SettingsState {
  /** Volumen de la música, 0..1. */
  musicVolume: number;
  /** Volumen de los efectos de sonido, 0..1. */
  sfxVolume: number;
  /** Intensidad del efecto CRT (scanlines, viñeta y parpadeo), 0..1. */
  crtAmount: number;
  /** Velocidad general de la partida. */
  gameSpeed: GameSpeed;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setCrtAmount: (v: number) => void;
  setGameSpeed: (v: GameSpeed) => void;
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      musicVolume: 0.6,
      sfxVolume: 0.8,
      crtAmount: 0,
      gameSpeed: 1,
      setMusicVolume: (v) => set({ musicVolume: clamp01(v) }),
      setSfxVolume: (v) => set({ sfxVolume: clamp01(v) }),
      setCrtAmount: (v) => set({ crtAmount: clamp01(v) }),
      setGameSpeed: (v) => set({ gameSpeed: v }),
    }),
    { name: 'just-poker-settings' }
  )
);

/** Factor para convertir una duración base en duración efectiva según la velocidad. */
export const speedFactor = (speed: GameSpeed): number => 1 / speed;
