# Proposal

## Why

Cuando el humano sale de una partida online con «Volver al menú», el sistema borra la sesión local
(`clearOnlineSession`) y, por tanto, el menú deja de ofrecer «Continuar partida»: la partida online
desaparece aunque siga en marcha. La partida local, en cambio, conserva su guardado al volver al
menú. Esta incoherencia impide reincorporarse a una partida online que sigue viva.

## What Changes

- Salir de la partida online con «Volver al menú» pasa a **conservar la sesión**: la partida queda
  disponible para continuar y el menú muestra la tarjeta online con «Continuar partida».
- Al salir, el sistema SHALL liberar la plaza en la sala (notificar la salida al servidor) para que
  el resto no quede bloqueado: el turno del jugador que se va se resuelve y el rol de anfitrión hace
  failover si era el anfitrión.
- El sistema SHALL registrar la actividad online al salir, para que la ventana de reanudación (30
  minutos) empiece en ese momento.
- No cambian los textos, la navegación, el protocolo del servidor ni el modelo de sesión.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

Ninguna: se **añade** un requisito a la capacidad existente `online-play` (no se modifica ningún
requisito existente).

## Impact

- `src/net/useOnlineGame.ts`: `leave()` deja de borrar la sesión (`clearOnlineSession`), marca la
  actividad (`markPlayed('online')`) y mantiene el `room:leave`.
- `openspec/specs/online-play/spec.md`: nuevo requisito de salida reanudable al menú.
- Sin cambios en `onlineSession.ts`, en el servidor ni en i18n. Se reutiliza la sesión y el
  mecanismo de reincorporación ya existentes.
