# Tasks

## 1. Extraer el controlador de música testeable

- [x] 1.1 Crear `createMusicController(deps)` en `src/audio/music.ts` (o `src/audio/musicController.ts`) que reciba las dependencias del navegador (`createContext`, `fetch`, `decode`, `setTimeout`/`clearTimeout`) y exponga `handleGesture`, `handleVisibility`, `handleVolume`, `handleStateChange` y `dispose`; mantener la API pública (`initMusic`, `startMusic`, `duckMusic`) delegando en él. Verificar `npx tsc -b` y `npx oxlint src/` sin errores.
- [x] 1.2 Añadir `src/audio/music.test.ts` con fakes de `AudioContext`/`fetch`/`decode` que cubra el estado inicial y `handleVolume` (volumen 0 no arranca; pasar a > 0 arranca). Verificar `npm test` en verde.

## 2. Carga del búfer recuperable

- [x] 2.1 Implementar la carga en el controlador de modo que un fallo de `fetch`/`decode` limpie `loading`/`buffer` y el siguiente intento vuelva a solicitarla, reutilizando el `AudioBuffer` ya decodificado. Verificar `npx tsc -b` y `npx oxlint src/`.
- [x] 2.2 Añadir test unitario: una carga fallida seguida de un nuevo `handleGesture` reintenta, decodifica y arranca la reproducción. Verificar `npm test` en verde.

## 3. Arranque reintentable

- [x] 3.1 Quitar `{ once: true }` de los listeners de gesto en `initMusic`, añadir un `unlock()` síncrono (crea el contexto y llama a `resume()` dentro del gesto) y `ensurePlaying()`; eliminar los listeners solo cuando `started` sea verdadero. Verificar `npx tsc -b`.
- [x] 3.2 Añadir test unitario: si el primer gesto no arranca (contexto bloqueado), un segundo gesto vuelve a intentarlo y arranca. Verificar `npm test` en verde.
- [ ] 3.3 Verificar (manual, desktop) que la música arranca en el primer clic/tecla y sigue el deslizador de volumen, incluido silenciar y reactivar.

## 4. Recuperación del contexto y ciclo de vida

- [x] 4.1 Manejar `statechange` y la reanudación: si el contexto queda suspendido/interrumpido estando visible se intenta `resume()`, y al reanudar tras una interrupción se recrea el `BufferSource` con el búfer cacheado si la fuente ya no es válida. Verificar `npx tsc -b` y `npx oxlint src/`.
- [x] 4.2 Añadir tests unitarios: `handleStateChange` a suspendido con app visible deja el estado reintentable; un gesto posterior reanuda y, si la fuente quedó inválida, la recrea. Verificar `npm test` en verde.
- [x] 4.3 Escuchar el ciclo de vida nativo con `App.addListener('appStateChange')` cuando `Capacitor.isNativePlatform()`, convergiendo en un `handleVisibility` idempotente junto a `visibilitychange`, y limpiar el listener en `dispose`. Verificar `npx tsc -b`.
- [x] 4.4 Añadir test unitario de idempotencia: eventos duplicados (visibility + appState) no provocan doble reproducción ni cortes. Verificar `npm test` en verde.

## 5. Integración y verificación

- [x] 5.1 Cablear `initMusic` con los listeners web y nativos, conservando `startMusic`/`duckMusic` y el `dispose` que usa `src/App.tsx`; verificar `npx tsc -b`, `npx oxlint src/`, `npm test` y `npm run build` en verde.
- [ ] 5.2 Smoke manual en Android (APK debug): reproducir la música, pasar a segundo plano y volver, y simular una interrupción; verificar que la música se recupera sin recargar la app.

## 6. Arranque automático al abrir

- [x] 6.1 Exponer `attemptAutoplay()` en el controlador (comparte `unlock()` + `ensurePlaying()` con `handleGesture`) y llamarlo desde `initMusic` al inicializar, conservando el respaldo del primer gesto; verificar `npx tsc -b` y `npx oxlint src/`.
- [x] 6.2 Añadir tests unitarios: `attemptAutoplay()` arranca sin gesto cuando la plataforma lo permite, y si el contexto está bloqueado no suena hasta un gesto posterior que lo reanuda; verificar `npm test` en verde.

## Workflow follow-up

- Archivar el cambio cuando se cumplan los requisitos de revisión del proyecto.
- Verificar el resultado archivado.
