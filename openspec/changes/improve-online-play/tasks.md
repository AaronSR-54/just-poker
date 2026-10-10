# Tasks

## 1. Consistencia de estado y reparto del bote

- [x] 1.1 Rotar `committed` en `rotateState` (`src/net/onlineGameState.ts`) igual que `winAmounts`, y verificar que `humanNet` y los deltas de `RivalSlot` coinciden en ambos dispositivos al terminar una mano.
- [x] 1.2 Conectar `usePotAward` en `OnlineGame` (props `potAward`, `awardProgress`, `potRemaining`, `handlePotAwardLanded`, `finishPotAward`, `resetPotAward`) y llamar a `resetPotAward()` al empezar mano; verificar que el bote se vacía y el montón del ganador muestra lo ganado (Playwright: partida de 2 a showdown, comparar fichas/bote en ambas pantallas).
- [x] 1.3 Verificar que ninguna otra parte del código depende de `committed` sin rotar (`rg "committed" src/`) y que el modo local no cambia.

## 2. Transición entre calles

- [x] 2.1 Extraer el retardo de calle de `useCommitState` a un helper/hook compartido y usarlo también en el anfitrión online; verificar que la partida local sigue mostrando la pausa entre calles.
- [x] 2.2 Crear el motor online con `setAutoDeal(false)` y, tras cada `hostPush` con `streetPending`, programar `resolveStreet()` tras `STREET_DELAY` y volver a difundir; verificar que la calle no se reparte de golpe y que todos ven la misma calle y turno (Playwright).

## 3. Temporizador de turno

- [x] 3.1 Extraer el núcleo de cuenta atrás de `useTurnTimer` a un hook compartido (`onExpire` inyectable) y hacer que `useTurnTimer` lo use; verificar que el modo local mantiene avisos y reanudación al cerrar Ajustes.
- [x] 3.2 Usar el hook compartido en `OnlineGame` (con `onExpire` que emite la acción) y unificar la duración con el timeout del anfitrión a `TURN_DURATION * 1000`; verificar que la duración es la misma para todos y coincide con la resolución automática.
- [x] 3.3 Verificar los avisos sonoros de los últimos segundos y la reanudación del turno al cerrar Ajustes en online (Playwright/observación).

## 4. Fin de partida y revancha

- [x] 4.1 Generalizar `GameOverOverlay` con props opcionales (`restartLabel`, `restartDisabled`+texto de espera, `onSelectDifficulty` opcional) sin cambiar el modo local; verificar que local sigue igual.
- [x] 4.2 Mostrar el overlay en `OnlineGame` a partir de `state.gameOver` (con `GAME_OVER_DELAY`) con revancha del anfitrión y "esperando al anfitrión" para el resto; verificar que la partida deja de quedar bloqueada y que la revancha reinicia fichas para todos (Playwright).

## 5. Sonidos y ajustes

- [x] 5.1 Llamar a `useGameSounds(state)` en `OnlineGame` y verificar que se oyen reparto, acciones, cartas y turno, y que a volumen 0 no suena nada.
- [x] 5.2 Pasar `onTutorial`/`onHandsGuide` como `undefined` en los ajustes online; verificar que no aparecen Tutorial ni Guía de manos y que volumen/idioma/salir funcionan.

## 6. Integración y verificación

- [x] 6.1 Partida online completa de 2 jugadores (Playwright): crear/unirse, jugar varias manos con reparto del bote, pausa entre calles, fin de partida y revancha; comprobar que las pantallas coinciden en fichas, bote, netos y turno.
- [x] 6.2 Revisar la checklist de reutilización de AGENTS.md: no hay componentes ni helpers duplicados, se usan tokens y todo texto visible pasa por `t(...)`; verificar con `rg` que no se reintroducen patrones locales duplicados.
- [x] 6.3 Ejecutar `npx oxlint src/`, `npx tsc -b` y `npm run build`, y `npx vitest run`; todos en verde.

## Workflow follow-up

- Archivar el change tras cumplir los requisitos de revisión del proyecto.
- Verificar el resultado archivado (specs sincronizadas).
