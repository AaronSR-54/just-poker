/**
 * Límite de longitud del nombre del jugador.
 *
 * Se usa tanto para el perfil local como para el nombre del multijugador online:
 * un nombre más largo desborda las fichas y asientos de la mesa. El servidor
 * mantiene su propio `MAX_NAME_LENGTH` (build target separado).
 */
export const MAX_PLAYER_NAME_LENGTH = 16;

/**
 * Origen del servidor online (vacío = mismo origen).
 *
 * En la app nativa apunta al despliegue de producción (`VITE_ONLINE_URL`); en la
 * web, vacío para usar el mismo origen que sirve la app.
 */
export function onlineOrigin(): string {
  return (import.meta.env.VITE_ONLINE_URL as string | undefined) ?? '';
}
