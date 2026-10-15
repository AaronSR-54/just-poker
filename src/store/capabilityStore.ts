import { create } from 'zustand';
import { detectHapticsSupport, detectSfxSupport } from '../utils/mediaSupport';

interface CapabilityState {
  /** Música de fondo: optimista; baja a false si la pista no se puede decodificar. */
  music: boolean;
  /** Efectos de sonido soportados por la plataforma. */
  sfx: boolean;
  /** Vibración disponible en el dispositivo. */
  haptics: boolean;
  setMusicSupported: (supported: boolean) => void;
}

export const useCapabilityStore = create<CapabilityState>()((set) => {
  const containerSupported = detectSfxSupport();
  return {
    music: containerSupported,
    sfx: containerSupported,
    haptics: detectHapticsSupport(),
    setMusicSupported: (supported) => set((state) => (state.music === supported ? state : { music: supported })),
  };
});
