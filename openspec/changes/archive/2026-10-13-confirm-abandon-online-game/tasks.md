# Tasks

## 1. Decisión de "otra sala" y textos

- [x] 1.1 Añadir en `src/net/onlineSession.ts` la función pura `isOtherRoomJoin(session, code)` que normaliza el código (mayúsculas, sin caracteres extraños, hasta 4) y devuelve `true` solo si hay sesión con un `code` distinto; verificar con tests en `src/net/onlineSession.test.ts` que cubren código distinto, mismo código, sesión `null` y código en minúsculas
- [x] 1.2 Añadir las claves i18n de la confirmación en `src/i18n/locales/{es,en}/online.ts` (`leaveForAnother*`); verificar que `npx tsc --noEmit` compila sin fallos por el tipo `Dict`

## 2. Confirmación al entrar en otra partida

- [x] 2.1 Añadir el estado `pendingJoin` en `src/screens/Online.tsx` y sumarlo a la condición de apertura y a la selección de textos de `ConfirmDialog`, reutilizando el patrón de `pendingMode`; verificar que el diálogo se abre con el texto correcto y sin warnings de lint
- [x] 2.2 Hacer reactiva la resolución del `?code=` (no solo al montar) con un `ref` del último código gestionado, y pedir confirmación cuando `isOtherRoomJoin` sea `true` en vez de emitir `room:join` directamente; verificar abriendo un enlace estando ya en `/online` (se pregunta) y con el mismo código (no se pregunta)
- [x] 2.3 Implementar el confirmar: emitir `room:join` del código nuevo y, solo con ack correcto, confirmar la nueva sala; si el ack falla, mostrar `onlineError` y conservar la sesión previa; verificar con un código válido (entra en la nueva) y con un código inexistente (muestra no disponible y no pierde la partida anterior)
- [x] 2.4 Implementar el cancelar: limpiar el `?code=` y reanudar la sesión previa por `roomId` (reutilizando la lógica de reanudación existente), o cerrar el diálogo y mantener el flujo de unirse si el código se escribió a mano; verificar que al cancelar desde un enlace se vuelve al lobby o a la partida anterior
- [x] 2.5 Aplicar la misma confirmación al código escrito o pegado en el flujo de unirse (`doJoin`), comparando con la sesión activa mediante `isOtherRoomJoin`; verificar escribiendo un código distinto con una partida en curso (se pregunta) y el mismo código (no se pregunta)

## 3. Continuidad al recargar la sala

- [x] 3.1 Añadir `started?: boolean` a `OnlineSession` y la función pura `lobbySessionFromRoom` en `src/net/onlineSession.ts`; verificar con tests en `src/net/onlineSession.test.ts` (started `false`, `mySeat`, `isHost` y `seats`)
- [x] 3.2 Persistir la sala en `src/screens/Online.tsx` al recibir `room:state` (sin sobrescribir una partida ya empezada) y fijar `started: true` en `room:starting`; verificar con `npx tsc --noEmit` y que al recargar un lobby se reentra sin preguntar
- [x] 3.3 Enrutar «Continuar partida» en `src/screens/Menu.tsx` a `/online` (sala sin empezar) o `/game/online-<roomId>` (partida empezada) según `session.started`; verificar `npx oxlint src/` y `npx tsc --noEmit`
- [x] 3.4 Ventana de gracia del servidor en `server/socket/handlers.ts`: modo `immediate` para `room:leave` (abandono explícito), gracia en la desconexión, ignorar el socket reemplazado por una reconexión, conservar el rol de anfitrión en salas sin empezar y difundir `room:state` al expirar; verificar con tests en `server/socket/handlers.test.ts` (se conserva el asiento y la sala, se recupera al volver, el anfitrión conserva el rol y el abandono explícito es inmediato)
- [x] 3.5 Probar manualmente con `npm run dev:all`: recargar en un lobby (reentra sin preguntar), recargar en solitario (no se borra la sala) y recargar en una partida empezada (reentra en la mesa)

## 4. Verificación final

- [x] 4.1 Revisar la checklist de reutilización de AGENTS.md: `ConfirmDialog` y los helpers de sesión reutilizados, sin markup ni lógica duplicados, `isOtherRoomJoin`/`lobbySessionFromRoom` con una sola definición, y todo el texto visible por `t(...)`
- [x] 4.2 Ejecutar `npx oxlint src/`, `npx tsc --noEmit` y `npm run build` y verificar que pasan sin errores
- [x] 4.3 Probar el flujo completo con `npm run dev:all`: abrir un enlace con una partida empezada, confirmar (abandona y entra), cancelar (permanece) y abrir un enlace de la misma sala (sin confirmación)

## Workflow follow-up

- Archivar el change cuando se cumplan los requisitos de revisión del proyecto.
- Verificar el resultado archivado.
