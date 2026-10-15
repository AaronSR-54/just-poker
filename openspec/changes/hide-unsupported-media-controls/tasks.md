# Tasks

## 1. Detección de capacidades

- [x] 1.1 Crear `src/utils/mediaSupport.ts` con `detectSfxSupport()` (basado en `canPlayType('audio/webm; codecs="opus"')`) y `detectHapticsSupport()` (nativo de Capacitor, o `navigator.vibrate` más heurística móvil/táctil), con guardas para entornos sin `window`/`navigator`/`Audio`; verificar con `npx tsc --noEmit`.
- [x] 1.2 Añadir `src/utils/mediaSupport.test.ts` (entorno node) cubriendo: sin `Audio`/`navigator` → sin soporte; `canPlayType` vacío → efectos sin soporte; escritorio con `vibrate` y puntero fino → vibración sin soporte; móvil o nativo → con soporte; verificar con `npx vitest run src/utils/mediaSupport.test.ts`.
- [x] 1.3 Crear `src/store/capabilityStore.ts` (zustand, sin `persist`) con `{ music, sfx, haptics }` inicializados desde los detectores y `setMusicSupported(bool)`; verificar con `src/store/capabilityStore.test.ts` que `setMusicSupported(false)` cambia `music` sin alterar `sfx`/`haptics`.

## 2. El motor de música reporta formato no soportado

- [x] 2.1 Añadir `onDecodeUnsupported?: () => void` a `MusicDeps` en `src/audio/musicController.ts` e invocarlo una sola vez cuando `decodeTrack` rechaza, marcando el formato como no soportado para dejar de reintentar; no invocarlo ante un fallo de `fetch`; verificar con casos en `src/audio/music.test.ts` (decode rechazado → callback 1 vez y sin reintentos; fetch rechazado → callback 0 veces y sigue reintentando) con `npx vitest run src/audio/music.test.ts`.
- [x] 2.2 Cablear en `src/audio/music.ts` el callback hacia `useCapabilityStore.getState().setMusicSupported(false)` y hacer que el arranque salga si la capacidad de música es falsa; verificar con `npx tsc --noEmit` y con la suite de música en verde (`npx vitest run src/audio/music.test.ts`).

## 3. Ajustes: ocultar los controles sin soporte

- [x] 3.1 En `src/components/GameSettings.tsx`, suscribir `capabilityStore` y renderizar el deslizador de música solo si hay soporte, el de efectos solo si hay soporte y la sección de vibración solo si hay soporte; reutilizar `SettingSlider`, `Section` y `SegmentedControl` sin recrear controles y sin añadir textos (no hay claves i18n nuevas); verificar por inspección y con `npx tsc --noEmit`.
- [x] 3.2 Verificación observable en dispositivo/navegador: en escritorio (sin vibración) no aparece el control de vibración; en un entorno sin audio reproducible (emulando iOS Safari) no aparecen los deslizadores de música ni de efectos; en un entorno con soporte (Android/Chrome) aparecen todos.

## 4. No reproducir sin soporte

- [x] 4.1 En `src/audio/sfx.ts`, salir en `preloadSounds` y en `playSfx`/`fire` cuando no haya soporte de efectos; verificar con una prueba unitaria (mockeando `Audio` y el store) que sin soporte no se reproduce nada y con soporte sí.
- [x] 4.2 En `src/haptics/haptics.ts`, salir en `playHaptic` cuando no haya soporte de vibración (además de respetar `hapticsEnabled`); verificar con una prueba unitaria que sin soporte no se invoca el plugin.

## 5. Verificación de integración

- [x] 5.1 Revisar la checklist de reutilización de `AGENTS.md`: confirmar que no se recrean `SettingSlider`/`Section`/`SegmentedControl`, que la detección tiene una sola definición (`src/utils/mediaSupport.ts`, sin helpers duplicados) y que no hay strings hardcodeados nuevos; verificar por inspección.
- [x] 5.2 Ejecutar `npx oxlint src/`, `npx tsc --noEmit` y `npm run build` sin errores.
- [x] 5.3 Ejecutar `npm test` en verde.

## Workflow follow-up

- Archivar el change cuando se cumplan los requisitos de revisión del proyecto.
