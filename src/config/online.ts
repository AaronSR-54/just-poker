/**
 * Límite de longitud del nombre del jugador.
 *
 * Se usa tanto para el perfil local como para el nombre del multijugador online:
 * un nombre más largo desborda las fichas y asientos de la mesa. El servidor
 * mantiene su propio `MAX_NAME_LENGTH` (build target separado).
 */
export const MAX_PLAYER_NAME_LENGTH = 16;
