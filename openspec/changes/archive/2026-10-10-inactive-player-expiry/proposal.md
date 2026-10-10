# Proposal

## Why

En una partida online, un jugador puede salir de la sala (con «Volver al menú», cerrando la app o
perdiendo la conexión) y no volver. Hoy el servidor conserva su asiento indefinidamente y el
anfitrión resuelve su turno automáticamente (check si puede, y si no fold). El resultado es que un
jugador ausente puede **seguir en la mano, llegar al showdown y ganar** el bote o incluso la partida
sin apostar, y la partida no llega a terminar. No podemos confiar en que los jugadores abandonen la
sala explícitamente.

## What Changes

- Se introduce una **ventana de gracia** `X` (propuesta: 120 s, configurable) para el asiento de un
  jugador ausente: dentro de `X` puede reincorporarse y recupera su plaza.
- Pasada `X`, el sistema **expulsa** al jugador: libera su asiento, deja de aceptar su reingreso y
  avisa a la mesa.
- En una partida en curso, el asiento expulsado se **elimina del juego** (se retira y queda sin
  fichas). Si tras la expulsión solo queda un jugador con fichas, la partida termina normal y gana
  quien sigue presente.
- Mientras un jugador está ausente, al llegar su turno **se retira (fold)** en lugar de hacer check,
  para que no pueda ganar una mano o la partida sin apostar.
- Se alinea la ventana de reanudación del menú (`ONLINE_RESUME_WINDOW_MS`, hoy 30 min) con `X`, para
  no ofrecer «Continuar partida» de una partida cuyo asiento ya caducó.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `online-play`: se añade el requisito de **expulsión por inactividad** (caducidad del asiento del
  jugador ausente), complementando los requisitos existentes de desconexiones y reconexión.

## Impact

- **Servidor**: `server/game/types.ts` (marca de ausencia en `RoomPlayer`), `server/game/GameManager.ts`
  (registrar ausencia y expirar/eliminar al jugador), `server/socket/handlers.ts` (programar y
  comprobar la expiración, emitir el aviso de expulsión; el turno del ausente se retira).
- **Cliente**: `src/net/useOnlineGame.ts` y `src/net/onlineRoom.ts` (escuchar la expulsión y
  eliminar el asiento del juego), `src/game/engine/pokerGame.ts` (método público para eliminar un
  asiento), `src/net/onlineSession.ts` (alinear la ventana de reanudación con `X`).
- **Reutilización**: se reutilizan la sala, la sesión, el motor (`elimated`/`gameOver`) y las
  utilidades existentes; no se crean componentes ni clases nuevas y no hay textos nuevos visibles
  (salvo, si acaso, un aviso de «jugador eliminado por inactividad»).
