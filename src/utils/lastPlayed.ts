type EntryMode = 'local' | 'online';

const STORAGE_KEY = 'just-poker-last-played';

let cache: Partial<Record<EntryMode, number>> | null = null;

function read(): Partial<Record<EntryMode, number>> {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as Partial<Record<EntryMode, number>>) : {};
  } catch {
    cache = {};
  }
  return cache;
}

function write(next: Partial<Record<EntryMode, number>>): void {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // almacenamiento no disponible (modo privado, cuota, etc.)
  }
}

/** Registra la última vez que se jugó en una modalidad. */
export function markPlayed(mode: EntryMode, at: number = Date.now()): void {
  write({ ...read(), [mode]: at });
}

/** Devuelve la última actividad de una modalidad, o `null` si no hay registro. */
export function getLastPlayed(mode: EntryMode): number | null {
  const at = read()[mode];
  return typeof at === 'number' ? at : null;
}

/** Borra el registro de actividad de una modalidad (o de todas). */
export function clearLastPlayed(mode?: EntryMode): void {
  if (!mode) {
    cache = {};
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // noop
    }
    return;
  }
  const next = { ...read() };
  delete next[mode];
  write(next);
}
