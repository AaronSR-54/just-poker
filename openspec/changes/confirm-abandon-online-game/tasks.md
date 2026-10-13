# Tasks

## 1. Decisión de "otra sala" y textos

- [x] 1.1 Añadir en `src/net/onlineSession.ts` la función pura `isOtherRoomJoin(session, code)` que normaliza el código (mayúsculas, sin caracteres extraños, hasta 4) y devuelve `true` solo si hay sesión con un `code` distinto; verificar con tests en `src/net/onlineSession.test.ts` que cubren código distinto, mismo código, sesión `null` y código en minúsculas
- [x] 1.2 Añadir las claves i18n de la confirmación en `src/i18n/translations.ts` (`es` y `en`, p. ej. `online.leaveForAnotherTitle/Message/Confirm`); verificar que `npx tsc --noEmit` compila sin fallos por el tipo `Dict`

## 2. Confirmación al entrar en otra partida

- [x] 2.1 Añadir el estado `pendingJoin` en `src/screens/Online.tsx` y sumarlo a la condición de apertura y a la selección de textos de `ConfirmDialog`, reutilizando el patrón de `pendingMode`; verificar que el diálogo se abre con el texto correcto y sin warnings de lint
- [x] 2.2 Hacer reactiva la resolución del `?code=` (no solo al montar) con un `ref` del último código gestionado, y pedir confirmación cuando `isOtherRoomJoin` sea `true` en vez de emitir `room:join` directamente; verificar abriendo un enlace estando ya en `/online` (se pregunta) y con el mismo código (no se pregunta)
- [x] 2.3 Implementar el confirmar: emitir `room:join` del código nuevo y, solo con ack correcto, `clearOnlineSession()`; si el ack falla, mostrar `onlineError` y conservar la sesión previa; verificar con un código válido (entra en la nueva) y con un código inexistente (muestra no disponible y no pierde la partida anterior)
- [x] 2.4 Implementar el cancelar: limpiar el `?code=` y reanudar la sesión previa por `roomId` (reutilizando la lógica de reanudación existente), o cerrar el diálogo y mantener el flujo de unirse si el código se escribió a mano; verificar que al cancelar desde un enlace se vuelve al lobby o a la partida anterior
- [x] 2.5 Aplicar la misma confirmación al código escrito o pegado en el flujo de unirse (`doJoin`), comparando con la sesión activa mediante `isOtherRoomJoin`; verificar escribiendo un código distinto con una partida en curso (se pregunta) y el mismo código (no se pregunta)

## 3. Verificación final

- [x] 3.1 Revisar la checklist de reutilización de AGENTS.md: `ConfirmDialog` y los helpers de sesión reutilizados, sin markup ni lógica duplicados, `isOtherRoomJoin` con una sola definición y todo el texto visible por `t(...)`
- [x] 3.2 Ejecutar `npx oxlint src/`, `npx tsc --noEmit` y `npm run build` y verificar que pasan sin errores
- [x] 3.3 Probar el flujo completo con `npm run dev:all`: abrir un enlace con una partida empezada, confirmar (abandona y entra), cancelar (permanece) y abrir un enlace de la misma sala (sin confirmación)

## Workflow follow-up

- Archivar el change cuando se cumplan los requisitos de revisión del proyecto.
- Verificar el resultado archivado.
