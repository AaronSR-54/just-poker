import { onlineOrigin } from '../config/online';

/** Rutas de invitación que abren la app (la heredada `/join` redirige a `/online`). */
const INVITE_PREFIXES = ['/online', '/join'];

/**
 * Resuelve un enlace entrante de invitación a una ruta interna de la SPA.
 *
 * Solo acepta enlaces `https` del origen online configurado (`onlineOrigin`) y las
 * rutas de invitación (`/online`, `/join`). Devuelve `pathname + search`, listo
 * para navegar, o `null` si el enlace no es una invitación.
 */
export function resolveDeepLink(rawUrl: string, origin = onlineOrigin()): string | null {
  if (!origin) return null;

  let url: URL;
  let base: URL;
  try {
    url = new URL(rawUrl);
    base = new URL(origin);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' || url.host !== base.host) return null;

  const isInvite = INVITE_PREFIXES.some(
    (prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`),
  );
  if (!isInvite) return null;

  return `${url.pathname}${url.search}`;
}
