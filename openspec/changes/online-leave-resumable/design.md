# Design

## Context

See `proposal.md` - Why. La sesión online vive en `localStorage` y se gestiona en
`src/net/onlineSession.ts`. El menú la lee con `getActiveOnlineSession()`, que exige que la última
actividad (`getLastPlayed('online')` o `savedAt`) esté dentro de 30 minutos. `useOnlineGame`
(`src/net/useOnlineGame.ts`) limpia el juego y, al salir, emite `room:leave` al servidor.

En el servidor (`server/socket/handlers.ts`), `room:leave` dispara `handleDeparture`: una partida ya
empezada llama a `GameManager.markDisconnected` (conserva el asiento para reconectar) y hace
failover del anfitrión al siguiente jugador conectado. La partida local conserva su guardado al
volver al menú (`Game.tsx`), que es la referencia de comportamiento.

## Goals / Non-Goals

**Goals:**

- Que salir de la partida online con «Volver al menú» conserve la sesión y el menú ofrezca continuar.
- Que el resto de jugadores no quede bloqueado cuando alguien sale al menú.
- Reutilizar el mecanismo de sesión y reincorporación existente; sin cambios de protocolo.

**Non-Goals:**

- Añadir una acción explícita de «abandonar la sala» desde la mesa (el abandono del lobby y la
  caducidad de la sesión siguen cubriendo ese caso).
- Cambiar textos, rutas ni el modelo de datos de la sesión.

## Decisions

**1. No borrar la sesión al salir al menú.**
`leave()` deja de llamar a `clearOnlineSession()`. La sesión queda en `localStorage`, así que
`getActiveOnlineSession()` la devuelve y el menú ofrece continuar. Se mantiene el mecanismo ya
existente para descartar sesiones muertas: la ventana de 30 minutos y la red de seguridad
«sala cerrada» al continuar (que sí limpia la sesión). Alternativa considerada: duplicar la sesión
con una marca de «en curso»; descartada por innecesaria.

**2. Seguir emitiendo `room:leave` al salir.**
El servidor debe saber que el jugador se fue: así se resuelve su turno (check/fold) y, si era el
anfitrión, otro asume el rol, evitando que la partida se congele para el resto. Alternativa
considerada: no emitir para no resolver el turno de un invitado que vuelve enseguida; descartada
porque dejaría la sala con un anfitrión fantasma cuando sale el anfitrión.

**3. Marcar la actividad online al salir.**
`markPlayed('online')` reinicia la ventana de reanudación desde el momento de salir, para que la
tarjeta online siga ofreciendo continuar durante los 30 minutos siguientes aunque no haya habido
más actividad.

**4. Reutilización.**
No se introduce ningún componente ni helper. Se reutilizan `onlineSession` (`getActiveOnlineSession`
en `Menu`), el `room:leave` del servidor y la reincorporación existente de `useOnlineGame`. El único
cambio es de comportamiento en `leave()`.

## Risks / Trade-offs

- [La sesión persiste tras terminar la partida (game over) y el menú ofrece continuar una partida
  terminada] → La sesión caduca a los 30 minutos y, si la sala se cerró, la red de seguridad la
  descarta al continuar. Posible seguimiento: limpiar la sesión al salir desde el fin de partida.
- [Ya no hay forma de abandonar una sala desde la mesa] → El abandono explícito sigue en el lobby y
  la sesión caduca sola; además, crear o unirse a una partida nueva libera la anterior.
