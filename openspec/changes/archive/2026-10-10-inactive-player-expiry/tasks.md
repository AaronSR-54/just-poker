# Tasks

## 1. Expulsión en el servidor

- [x] 1.1 Añadir una marca de ausencia (`absentSince`) a `RoomPlayer` (`server/game/types.ts`) y registrarla al salir o desconectarse en `GameManager` (`markDisconnected`); verificar con `server/game/GameManager.test.ts` que el asiento se conserva y la marca queda fijada.
- [x] 1.2 Implementar la expiración en `server/socket/handlers.ts` con `X = 120 s` (constante): temporizador por sala más comprobación perezosa en cada evento; al expirar, eliminar al jugador de la sala, liberar el asiento y emitir un aviso de expulsión con su `userId` (o cerrar la sala si queda vacía). Verificar con un test de servidor que pasados `X` el jugador ya no está y un reingreso es rechazado.

## 2. Eliminación del asiento en el motor y en la mesa

- [x] 2.1 Añadir al motor (`src/game/engine/pokerGame.ts`) un método público para eliminar un asiento (retirarlo si la mano está en curso y dejarlo sin fichas) y verificar con tests que `gameOver` se declara cuando queda un solo jugador con fichas.
- [x] 2.2 Escuchar el aviso de expulsión en `src/net/onlineRoom.ts`/`src/net/useOnlineGame.ts`: eliminar ese asiento del motor y redifundir el estado. Verificar que, al expulsar a uno de dos jugadores, la partida termina y gana el que permanece.

## 3. Los jugadores ausentes se retiran

- [x] 3.1 Ajustar la resolución del turno del rival ausente en `useOnlineGame`/`onlineRoom` para que se retire (fold) en lugar de hacer check; verificar que un jugador ausente no gana ninguna mano.

## 4. Alinear la ventana del menú

- [x] 4.1 Alinear `ONLINE_RESUME_WINDOW_MS` (`src/net/onlineSession.ts`) con `X`; verificar que el menú deja de ofrecer «Continuar partida» pasada la ventana y que, al continuar, la red de seguridad descarta la sesión.

## 5. Verificación

- [x] 5.1 Revisar la checklist de reutilización de `AGENTS.md`: solo se reutilizan la sala, la sesión y el motor existentes, sin componentes ni clases nuevas ni textos hardcodeados.
- [x] 5.2 Ejecutar `npx oxlint src/`, `npx tsc --noEmit`, `npm run build` y `npx vitest run` y confirmar que pasan sin errores.
- [x] 5.3 Partida online de 2 jugadores (Playwright con servidor aislado): uno sale al menú y no vuelve; pasada la ventana se le expulsa, no puede reingresar y la partida termina a favor del jugador presente.

## Workflow follow-up

- Archivar el change cuando se cumplan los requisitos de revisión del proyecto.
