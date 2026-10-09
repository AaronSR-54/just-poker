import { t } from '../i18n';

const KNOWN_CODES = new Set([
  'notFound',
  'full',
  'started',
  'name',
  'rename',
  'host',
  'players',
  'max',
]);

/** Traduce un código de error del servidor online; si no se conoce, usa el genérico. */
export function onlineError(code: string | undefined, fallbackKey = 'online.joinError'): string {
  if (code && KNOWN_CODES.has(code)) return t(`online.errors.${code}`);
  return t(fallbackKey);
}
