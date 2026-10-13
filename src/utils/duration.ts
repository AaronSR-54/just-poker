/**
 * Utilidades de duración: un contador de tiempo por segmentos (arranca/pausa sin
 * usar `setInterval`) y un formateador legible.
 */

export interface DurationTracker {
  /** Reanuda la acumulación si estaba en pausa. */
  start: () => void;
  /** Pausa la acumulación y consolida el segmento en curso. */
  pause: () => void;
  /** Total transcurrido (incluye el segmento en curso si está en marcha). */
  elapsed: () => number;
  /** Total consolidado, sin el segmento en curso. */
  value: () => number;
  /** Reinicia el total a cero. */
  reset: () => void;
}

/**
 * Contador de duración por marcas de tiempo. Nunca usa intervalos, de modo que
 * el throttling del navegador en pestañas ocultas no falsea el total. `now` es
 * inyectable para poder probarlo de forma determinista.
 */
export function createDurationTracker(initialMs = 0, now: () => number = Date.now): DurationTracker {
  let accumulated = Math.max(0, initialMs);
  let runningSince: number | null = null;

  return {
    start: () => {
      if (runningSince === null) runningSince = now();
    },
    pause: () => {
      if (runningSince !== null) {
        accumulated += Math.max(0, now() - runningSince);
        runningSince = null;
      }
    },
    elapsed: () =>
      runningSince === null ? accumulated : accumulated + Math.max(0, now() - runningSince),
    value: () => accumulated,
    reset: () => {
      accumulated = 0;
      runningSince = null;
    },
  };
}

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Valor inicial del cómputo: conserva lo guardado al reanudar, cero si es nueva. */
export function resolveInitialElapsed(stored: number | undefined, isResume: boolean): number {
  return isResume ? Math.max(0, stored ?? 0) : 0;
}

/**
 * Formatea una duración en ms con unidades de minutos y segundos (`0m 40s`), o
 * horas y minutos (`1h 05m`) a partir de una hora. Los negativos se tratan como cero.
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0 ? `${hours}h ${pad2(minutes)}m` : `${minutes}m ${pad2(seconds)}s`;
}
