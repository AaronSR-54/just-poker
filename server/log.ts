/**
 * Logger mínimo para los runtime logs de Vercel.
 *
 * Todos los mensajes llevan el prefijo `[jp:<scope>]` para poder filtrarlos
 * (dashboard de Vercel o `npx vercel logs <url>`), y un JSON con campos.
 */
type Fields = Record<string, unknown>;

function serialize(fields?: Fields): string {
  if (!fields) return '';
  try {
    return ` ${JSON.stringify(fields)}`;
  } catch {
    return '';
  }
}

export function log(scope: string, message: string, fields?: Fields): void {
  console.log(`[jp:${scope}] ${message}${serialize(fields)}`);
}

export function logError(scope: string, message: string, error: unknown, fields?: Fields): void {
  const detail = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
  console.error(`[jp:${scope}] ${message} ${detail}${serialize(fields)}`);
}
