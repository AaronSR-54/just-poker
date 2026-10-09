/**
 * Interruptores de producto.
 *
 * `ONLINE_ENABLED` oculta el multijugador privado (entrada del menú y ruta
 * `/online`; los enlaces antiguos `/join/:code` y `/lobby/:roomId` redirigen a
 * ella). Se activará cuando la funcionalidad online salga de su change
 * OpenSpec; por ahora la app se distribuye como 100 % offline.
 */
export const ONLINE_ENABLED = true;
