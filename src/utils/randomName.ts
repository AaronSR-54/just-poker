import { t } from '../i18n';

/**
 * Devuelve un nombre temporal aleatorio desde el catálogo i18n (`online.namePool`,
 * palabras separadas por `|`). El generador es inyectable para poder probarlo
 * de forma determinista.
 */
export function randomName(random: () => number = Math.random): string {
  const pool = t('online.namePool')
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean);
  if (pool.length === 0) return 'Player';
  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  return pool[index];
}
