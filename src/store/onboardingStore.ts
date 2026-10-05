import { create } from 'zustand';

/**
 * Estado efímero del tour de bienvenida. No se persiste: sirve para compartir
 * lo que el usuario va eligiendo entre las pantallas que recorre el tour.
 */
interface OnboardingState {
  /** Dificultad seleccionada en la pantalla de mesas (null si aún no eligió). */
  difficulty: string | null;
  setDifficulty: (id: string) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  difficulty: null,
  setDifficulty: (id) => set({ difficulty: id }),
  reset: () => set({ difficulty: null }),
}));
