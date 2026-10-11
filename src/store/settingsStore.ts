import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clamp01 } from '../utils/math';

/** Multiplicadores de velocidad de juego disponibles. */
export type GameSpeed = 0.5 | 1 | 2 | 4;

export const GAME_SPEEDS: GameSpeed[] = [0.5, 1, 2, 4];

interface SettingsState {
  /** Volumen de la música, 0..1. */
  musicVolume: number;
  /** Volumen de los efectos de sonido, 0..1. */
  sfxVolume: number;
  /** Intensidad del efecto CRT (scanlines, viñeta y parpadeo), 0..1. */
  crtAmount: number;
  /** Velocidad general de la partida. */
  gameSpeed: GameSpeed;
  /** Vibración háptica en pulsaciones, turno, tiempo agotado y victoria. */
  hapticsEnabled: boolean;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setCrtAmount: (v: number) => void;
  setGameSpeed: (v: GameSpeed) => void;
  setHapticsEnabled: (v: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      musicVolume: 0.6,
      sfxVolume: 0.8,
      crtAmount: 0,
      gameSpeed: 1,
      hapticsEnabled: true,
      setMusicVolume: (v) => set({ musicVolume: clamp01(v) }),
      setSfxVolume: (v) => set({ sfxVolume: clamp01(v) }),
      setCrtAmount: (v) => set({ crtAmount: clamp01(v) }),
      setGameSpeed: (v) => set({ gameSpeed: v }),
      setHapticsEnabled: (v) => set({ hapticsEnabled: v }),
    }),
    { name: 'just-poker-settings' }
  )
);

/** Factor para convertir una duración base en duración efectiva según la velocidad. */
export const speedFactor = (speed: GameSpeed): number => 1 / speed;
