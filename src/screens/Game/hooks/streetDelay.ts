import type { PokerGame } from '../../../game/poker';
import { STREET_DELAY } from '../gameConfig';

/**
 * Pausa entre rondas de apuestas: si el estado quedó en `streetPending`,
 * programa `resolveStreet()` tras `delayMs` y llama a `onResolved` al repartir
 * la calle. Devuelve el temporizador (o `null` si no había calle pendiente).
 *
 * Compartido por la partida local (`useCommitState`) y el anfitrión online
 * (`useOnlineGame`): solo cambia lo que se hace al resolver (re-render vs
 * difusión), no el retardo.
 */
export function scheduleStreetResolve(
  gameRef: { current: PokerGame | null },
  onResolved: () => void,
  delayMs: number = STREET_DELAY,
): number | null {
  const g = gameRef.current;
  if (!g || !g.getState().streetPending) return null;
  return window.setTimeout(() => {
    const current = gameRef.current;
    if (!current) return;
    current.resolveStreet();
    onResolved();
  }, delayMs);
}
