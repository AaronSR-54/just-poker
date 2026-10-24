# Tasks

## 1. Base compartida: espera y textos

- [x] 1.1 Sustituir `GAME_OVER_DELAY` por `SHOWDOWN_HOLD_MS` (3,5 s) en `src/screens/Game/gameConfig.ts` y actualizar `Game.tsx` (manteniendo la escala por `speed`) y `OnlineGame.tsx` (fijo); verificar con `grep -rn "GAME_OVER_DELAY" src` sin resultados y `npx tsc --noEmit`.
- [x] 1.2 Añadir las claves `game.eliminatedSupport`, `game.watchGame` y `game.spectating` en `src/i18n/locales/es/game.ts` y `src/i18n/locales/en/game.ts`; verificar que el tipo `Dict` compila con ambas locales (`npx tsc --noEmit`) y que no queda ningún texto visible sin `t(...)`.
- [x] 1.3 Extraer el helper `isHumanEliminated(state)` en `src/screens/Game/gameView.ts` y añadir tests unitarios en `src/screens/Game/gameView.test.ts` (sin fichas tras la mano, marcado como eliminado y jugador aún vivo); verificar con `npx vitest run src/screens/Game/gameView.test.ts`.

## 2. Modal de eliminación y modo espectador

- [x] 2.1 Crear `src/screens/Game/components/EliminationOverlay.tsx` con `Modal` y `Button`, título «Has perdido», apoyo de eliminación y las acciones «Quedarse a ver la partida» / «Volver al menú»; verificar que usa solo utilidades nativas y tokens y que `npx tsc --noEmit` pasa.
- [x] 2.2 Añadir a `GameTail` la prop opcional `elimination` (visible solo si se aporta) y pasarla desde `MobileGameLayout` y `DesktopGameLayout` a través de `GameLayoutProps`; verificar que la partida local sigue compilando y renderizando sin el modal (`npx tsc --noEmit`).
- [x] 2.3 Añadir `spectating` a `ActionButtonsProps` y `ActionButtonInput`, y pintar el aviso «Has perdido» en `ActionButtons` en lugar de «Nueva mano»/«Esperando al anfitrión»; verificar que el botón de repartir no aparece en modo espectador y que `npx tsc --noEmit` pasa.
- [x] 2.4 En `OnlineGame.tsx`, separar `gameOverForAll` de `eliminatedForHuman` con `isHumanEliminated`, abrir el `EliminationOverlay` tras la pausa de showdown y no abrir el modal de fin de partida mientras la partida siga; verificar manualmente con una partida de 3 jugadores que el eliminado ve el aviso y la mesa sigue viva.
- [x] 2.5 Recordar la decisión de «quedarse a mirar» para que el aviso no se repita en manos posteriores y el área de acciones mantenga «Has perdido»; verificar que tras varias manos el modal no vuelve a abrirse.
- [x] 2.6 Mantener el modal de fin real para el espectador: al quedar un solo jugador con fichas se abre `GameOverOverlay` con clasificación, revancha solo del anfitrión y volver al inicio; verificar en una partida de 3–4 jugadores que el espectador lo ve al final.

## 3. Reparto automático del anfitrión eliminado

- [x] 3.1 En `OnlineGame.tsx`, programar `startNewHand()` tras `SHOWDOWN_HOLD_MS` cuando el anfitrión está en modo espectador y la mano ha terminado sin fin de partida, con guard por `handNumber` y limpieza del temporizador al cambiar de mano, desmontar o salir; verificar que el resto de jugadores recibe la siguiente mano sin pulsar nada.
- [x] 3.2 Verificar que la salida del anfitrión eliminado usa el `leave()` actual (sesión conservada, `room:leave`) y que el rol pasa a otro jugador; comprobar que el menú ofrece continuar y que al volver se entra como espectador.

## 4. Verificación de reutilización y calidad

- [x] 4.1 Revisar la checklist de `AGENTS.md`: reutilización de `Modal`, `Button`, `GameOverOverlay`, `GameTail` y `ActionButtons`; ausencia de clases CSS nuevas, valores crudos, textos sin `t(...)` y helpers o markup duplicados; corregir lo que aparezca.
- [x] 4.2 Ejecutar `npx oxlint src/` y corregir los avisos introducidos por el cambio.
- [x] 4.3 Ejecutar `npx tsc --noEmit` y `npm run build`; verificar que ambos terminan sin errores.
- [x] 4.4 Ejecutar `npm test` y verificar que la suite sigue en verde, incluidos los tests nuevos de `isHumanEliminated`.

## Workflow follow-up

- Revisar el cambio con el usuario antes de archivarlo.
- Archivar el cambio cuando la implementación esté validada.
