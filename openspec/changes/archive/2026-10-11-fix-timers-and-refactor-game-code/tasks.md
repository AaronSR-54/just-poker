# Tasks

## 1. Núcleo de la cuenta atrás (fuente de verdad en ms)

- [x] 1.1 Cambiar `useTurnCountdown` para exponer `remainingMs` como salida principal (conservando lo necesario para los avisos) y eliminar el `useState(initialSeconds)`; verificar que el valor inicial parte de la duración efectiva.
- [x] 1.2 Guardar `turnDurationMs` en un ref y quitarlo de las dependencias de `startTimer` y del efecto de pausa/reanudación, que solo debe reaccionar a `active`, `turnKey` y `settingsOpen`; verificar con Ajustes abierto/cerrado que no se reinicia la cuenta.
- [x] 1.3 Añadir el reescalado al cambiar la duración: preservar la fracción consumida (`remaining * newDuration / oldDuration`) cuando el turno está activo y sin pausa; verificar que ×1→×4 y ×1→×0.5 ajustan el tiempo restante en lugar de reiniciar.
- [x] 1.4 Registrar el `turnKey` de arranque y solo reanudar si coincide, y reiniciar `lastTimerCue` al cambiar `turnKey`/`active` o al pausar; verificar que no se captura un tiempo obsoleto y que el aviso vuelve a sonar en cada turno.
- [x] 1.5 Ejecutar `npx oxlint src/` y `npx tsc --noEmit` y verificar que pasan sin errores.

## 2. Barra visible del turno propio

- [x] 2.1 Reescribir `TimerBar` como primitiva dirigida por estado (`remainingMs` + `durationMs`, `paused?`) que pinta el ancho con `style` y deja de depender de `animate-timer-drain`; verificar visualmente que la barra refleja el tiempo restante.
- [x] 2.2 Pasar `remainingMs`/`durationMs` desde los layouts y eliminar `gameSpeed` de la `key` de la barra; verificar que cambiar la velocidad no remonta ni reinicia la barra.
- [x] 2.3 Verificar que la barra visible y la resolución del turno coinciden (la expiración ocurre cuando la barra llega a cero), en ×0.5/×1/×2/×4.
- [x] 2.4 Ejecutar `npx oxlint src/` y `npx tsc --noEmit` y verificar que pasan sin errores.

## 3. Barra del rival y estabilidad del turno de la IA

- [x] 3.1 Exponer el `remainingMs` del turno del rival desde `useAiTurns` (cadencia de 100 ms, congelado con `settingsOpen`) y reutilizar `TimerBar` en `RivalSlot`; verificar que la barra del rival se pausa y reanuda con Ajustes.
- [x] 3.2 Quitar `speed`/`turnDurationMs` de las dependencias del efecto de `useAiTurns` (leerlos desde refs) y evitar observaciones duplicadas de la mano; verificar que cambiar la velocidad en el turno del rival no reinicia su decisión ni extiende el turno.
- [x] 3.3 Hacer cancelable el `setTimeout` de `getAIAction` (`src/ai/aiPlayer.ts`) y usarlo en la limpieza del efecto; verificar que no quedan timeouts colgados ni acciones dobles.
- [x] 3.4 Ejecutar `npx oxlint src/` y `npx tsc --noEmit` y verificar que pasan sin errores.

## 4. Pausas de resolución (calle y game over)

- [x] 4.1 Cambiar `useCommitState` para guardar el instante objetivo y reprogramar la espera al cambiar `gameSpeed` sin reiniciarla; verificar que un cambio de velocidad durante `streetPending` ajusta el tiempo restante.
- [x] 4.2 Aplicar el mismo patrón de instante objetivo al temporizador de game over en `Game.tsx`; verificar que un cambio de velocidad no reinicia la espera desde el principio.
- [x] 4.3 Ejecutar `npx oxlint src/` y `npx tsc --noEmit` y verificar que pasan sin errores.

## 5. Helpers y constantes duplicados

- [x] 5.1 Extraer `clamp`/`clamp01` a `src/utils/` y sustituir las cuatro definiciones (`ai/aiMath.ts`, `store/settingsStore.ts`, `audio/sfx.ts`, `ai/emotion.ts`); verificar por búsqueda que solo queda una definición.
- [x] 5.2 Unificar `rankValue` (una sola definición) y la derivación de asientos/ciegas (`nextAlive`/blinds) en un módulo compartido usado por engine, IA y `gameView`; verificar por búsqueda que no quedan copias.
- [x] 5.3 Unificar `initials` y los nombres por defecto (`DEFAULT_NAMES`) en un único origen; verificar por búsqueda que no quedan copias y que la app arranca con los mismos nombres.
- [x] 5.4 Renombrar el export `t` de `src/animations/motion.ts` a `motionT` y actualizar los imports/alias; verificar que ya no hay aliasing de `t` en los consumidores.
- [x] 5.5 Ejecutar `npx oxlint src/` y `npx tsc --noEmit` y verificar que pasan sin errores.

## 6. Motor de coach compartido

- [x] 6.1 Extraer `useCoachPositioning` (medición con rAF + `ResizeObserver`, cálculo de posición) y reutilizarlo desde `OnboardingCoach` y `TutorialCoach`; verificar que la posición del panel coincide en ambos.
- [x] 6.2 Extraer `CoachPanel` y `Spotlight` (incluido el `boxShadow` con tokens, sin `rgba`) y sustituir el markup duplicado en ambos coaches; verificar onboarding y tutorial completos.
- [x] 6.3 Verificar que el motor extraído no altera la secuencia de pasos ni el resaltado de anclas `data-tour`.
- [x] 6.4 Ejecutar `npx oxlint src/` y `npx tsc --noEmit` y verificar que pasan sin errores.

## 7. Layouts, overlays y primitivas reutilizables

- [x] 7.1 Extraer `buildGameLayoutProps` y usarlo desde `Game.tsx` y `OnlineGame.tsx`; verificar key por key que no cambia ningún flag y que la partida online sigue igual.
- [x] 7.2 Extraer los subcomponentes compartidos de la lista de rivales y del bloque final y usarlos en ambos layouts; verificar móvil y escritorio.
- [x] 7.3 Extraer `ChipStackRow` desde `HumanSeat`/`RivalSlot` y sustituir ambas copias; verificar el render de fichas, ALL-IN y delta.
- [x] 7.4 Extraer el contenedor `Screen` y sustituir la receta repetida de pantalla; verificar las pantallas afectadas (Menú, Local, HandsGuide, Online, layouts, ScreenMessage).
- [x] 7.5 Enrutar `GameSettings`, `GameOverOverlay` y la hoja de subida por `Modal` y reforzar `Modal` (focus trap, restauración de foco, bloqueo de scroll y `aria`); verificar apertura/cierre con teclado y con Escape.
- [x] 7.6 Reutilizar `ScreenTitle` en `HandsGuide` y `SegmentedControl`/`SelectableCard` en las píldoras reinventadas; verificar la selección y el foco por teclado.
- [x] 7.7 Ejecutar `npx oxlint src/` y `npx tsc --noEmit` y verificar que pasan sin errores.

## 8. i18n, tokens y limpieza

- [x] 8.1 Pasar por `t(...)` los textos visibles hardcodeados: alt de `PokerCard`, la marca en `GameSettings` y la decisión de "You" en `HumanSeat` sin comparar con la cadena `'Tú'`; añadir claves en `es` y `en`.
- [x] 8.2 Sustituir valores crudos por tokens (`rgba(...)`, `bg-black`, `text-[…]`) en coaches, `RaiseControls`, `PotAward` y `Wordmark`; verificar por búsqueda que no quedan en UI.
- [x] 8.3 Corregir el ternario redundante de `Avatar` y verificar el render con y sin `ring`.
- [x] 8.4 Eliminar código muerto tras comprobar que no tiene importadores: `Logo`, `RankBadge`, `JFigure`/`KFigure`/`QFigure`, y exports sin uso (`SPEED_LABELS`, `isRed`, `slideInLeft`/`slideInRight`/`scaleIn`/`swap`, tipos sin uso); verificar que `npx tsc --noEmit` sigue pasando.
- [x] 8.5 Ejecutar `npx oxlint src/` y `npx tsc --noEmit` y verificar que pasan sin errores.

## 9. Verificación de integración

- [x] 9.1 Verificación de reutilización y ausencia de duplicación: recorrer la checklist de `AGENTS.md` (primitivas reinventadas, JSX/lógica duplicados, helpers duplicados, tokens crudos, textos sin `t`).
- [x] 9.2 Ejecutar `npm run build` y verificar que completa sin errores.
- [x] 9.3 Reproducir el bug reportado (cambiar velocidad en mitad del turno propio) y verificar que el tiempo ya no se desincroniza, además de una partida completa local y una online de humo.

## Workflow follow-up

- Archivar el cambio cuando se cumplan los requisitos de revisión del proyecto.
- Verificar el resultado archivado (`openspec validate` y specs principales actualizados).
