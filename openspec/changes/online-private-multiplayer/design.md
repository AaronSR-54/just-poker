# Design

## Context

Just Poker es una SPA offline (React 19 + Vite + Tailwind v4) desplegada en Vercel y empaquetada en Android con Capacitor. Existe código de online **aparcado** y funcional: un motor de juego **host-autoritativo** en `src/net/useOnlineGame.ts` (+ `onlineGameState.ts`, `onlineSession.ts`, `socket.ts`) y un servidor socket.io en `server/` (`game/GameManager.ts`, `socket/handlers.ts`, `routes/*`, `middleware/auth.ts`) con UI en `src/screens/Online.tsx` y `src/screens/Lobby.tsx`, más un snapshot `parked/OnlineGame.snapshot.tsx`.

Restricciones que condicionan el diseño:

- El modo online debe ser **anónimo**, **privado**, **2–4 jugadores reales**, sin velocidad, y **totalmente funcional y multidispositivo**.
- El servidor debe vivir **en Vercel, bajo el mismo dominio** (`https://just-poker-delta.vercel.app`). Vercel ofrece WebSockets en Functions (beta pública, Fluid Compute); socket.io funciona si el cliente usa `transports: ['websocket']` y el estado de salas se guarda fuera de la memoria de la función (Redis).
- Android: hoy no hay permiso de red; hay que reintroducir `INTERNET`.
- Convenciones del repo: utilidades Tailwind nativas, tokens, reutilización de componentes `src/components/` y helpers `src/utils/`, i18n es/en para todo texto visible (ver `AGENTS.md`).

Ver `proposal.md` para la motivación y `specs/online-lobby/spec.md` y `specs/online-play/spec.md` para los requisitos.

## Goals / Non-Goals

**Goals:**

- Crear/unirse a partidas privadas sin cuenta, con código de 4 dígitos y enlace/QR directo al lobby.
- Identidad de sesión ligera (nombre aleatorio editable, avatar genérico) sin persistencia de cuenta.
- Partida en tiempo real entre 2–4 jugadores reales con estado compartido y cartas privadas ocultas.
- Reutilizar al máximo el motor y el protocolo socket aparcados, retirando auth/públicas/puntos/IA.
- Reintentar/reconectar ante el cierre periódico de conexiones de Vercel y sobrevivir a la caída del anfitrión.

**Non-Goals:**

- Emparejamiento público, salas abiertas, ranking, puntos, historial o cuentas.
- Lector de QR dentro de la app (el QR se escanea con la **cámara nativa**; la app solo lo genera y muestra).
- Chat de voz/texto y espectadores.
- Cambiar el comportamiento de la partida local offline.

> Nota: la reconexión **sí** cruza el cierre/recarga de la app: la sesión online se persiste en `localStorage` y el menú ofrece «volver a la partida» mientras siga en marcha.

## Decisions

### 1. Adaptar el código aparcado en lugar de reescribir

Reutilizar `server/game/GameManager.ts` (registro de salas, asientos, altas/bajas), `server/socket/handlers.ts` (protocolo `room:*` y `game:*`) y todo `src/net/*` (motor host-autoritativo, `sanitizeForBroadcast`, `rotateState`, `registerRoomListeners`). Reescribir implicaría reproducir el bucle de juego ya probado. Se **retira** la capa de cuentas y todo lo que cuelga de ella:

- Servidor: `middleware/auth.ts`, `routes/auth.ts`, `routes/user.ts`, `prisma/*`, deps `bcrypt`, `jsonwebtoken`, `@prisma/client`.
- Protocolo/UI: `room:quick`, `findPublicRoom`, auto-arranque y cuenta atrás de públicas; `RankBadge`, `POINTS_BY_PLACE`, `recordHand`/`recordGame`; relleno con IA (`buildSeats` rama IA, `PERSONALITIES`/`createAIPlayer` en la capa de red).

Alternativas: **reescribir** (rechazada: coste y riesgo de reimplementar el motor), **proveedor realtime gestionado** (rechazada por el usuario: se quiere mismo dominio en Vercel).

### 2. Transporte: socket.io sobre Vercel Functions WebSockets + Redis

El endpoint se implementa como Vercel Function `api/socket-io.ts` que exporta un `http.Server` con `new Server(...)` (socket.io). El cliente usa `path` y `transports: ['websocket']` (nunca long-polling). Se añade `@socket.io/redis-adapter` + cliente Redis (Upstash del Marketplace de Vercel) para que `io.to(roomId)` cruce instancias.

- **Producción**: `io('', { path: '/api/socket-io/socket.io', transports: ['websocket'] })` (mismo origen).
- **Desarrollo/LAN**: se conserva `server/index.ts` (`npm run dev:server`) y el proxy de Vite ya existente (`/api`, `/socket.io` con `ws: true`), usando `import.meta.env` para elegir URL/path.

Como la memoria de la función no se comparte entre instancias, el **registro de salas** (jugadores, host, `code→roomId`) se guarda en Redis mediante un pequeño repositorio `RoomRepository` (clave por sala + índice por código), con una implementación **en memoria** como fallback cuando no hay `REDIS_URL` (dev). Alternativa considerada: depender del adaptador Redis solo para broadcast y dejar el registro en memoria (rechazada: una reconexión puede caer en otra instancia y perder la sala).

### 3. Identidad anónima de sesión

Al conectar, el servidor asigna un `playerId` (UUID) a la conexión; el cliente lo persiste en `localStorage` (`OnlineSession`) para reconectar incluso tras cerrar o recargar la app. La sesión guarda además una marca temporal (`savedAt`) y se limpia al abandonar la partida o si la sala ya no existe. No hay JWT ni usuario. El `hostId` de la sala es un `playerId`.

### 4. Nombre aleatorio editable y avatar genérico

El nombre se **genera en el cliente** desde listas de palabras en i18n (es/en) mediante un helper `src/utils/randomName.ts`, para respetar la regla de "ningún texto visible hardcodeado"; se envía al unirse (`room:join` con `name`) y se actualiza con `room:rename` antes de empezar. El avatar reutiliza `Avatar` (iniciales derivadas del nombre); no se añade sistema de imágenes.

### 5. Código de 4 dígitos y enlace/QR directo

`GameManager.generateCode` pasa de 4 caracteres alfanuméricos a **4 dígitos**, con reintento hasta que sea único entre salas activas. La invitación es una ruta de app `GET /join/:code` (y `/lobby/:roomId`): al abrirla se resuelve la sala y se entra directamente, sin teclear nada. El QR se renderiza en el cliente con un nuevo componente `src/components/QrCode.tsx` (dependencia `qrcode`) que codifica `${origin}/join/${code}`; al ser una URL `https`, la cámara nativa del móvil la abre directamente.

### 6. Bucle de juego host-autoritativo con failover del anfitrión

Se reutiliza `useOnlineGame` como motor en el cliente anfitrión: ejecuta `PokerGame`, difunde estado saneado (`game:state`), envía cartas privadas por jugador (`game:holecards`) y aplica acciones de los pares (`game:peer-action`). Dos cambios sobre lo aparcado:

- **Snapshots en Redis**: además del broadcast, el host publica el último estado (y `seats`) en Redis por sala, lo que da sincronización a los que se reconectan y **failover** si el host cae.
- **Failover**: si el anfitrión se desconecta durante la partida, el servidor promueve al siguiente jugador conectado a anfitrión con el último snapshot; si el anfitrión vuelve, se reintegra como jugador (no recupera el rol salvo que se le vuelva a promover). La desconexión de un no-host no bloquea: se resuelve su turno (check si puede, si no fold) y mantiene su asiento para reconectar (`game:peer-left`, ya existente).

Riesgo asumido: la partida depende de que el host procese (latencia). Es aceptable para 2–4 jugadores.

### 7. Sin controles de velocidad en online

Se añade un `context: 'online'` a `GameOverlays` y `GameSettings` para **ocultar la sección de velocidad**; el resto de ajustes (volumen, CRT, idioma) se mantiene. El temporizador de turno remoto del host usa un valor fijo (no escala con `settingsStore.gameSpeed`).

### 8. Rutas e integración con la pantalla de juego

`src/App.tsx` gana `/online`, `/lobby/:roomId` y `/join/:code`. `src/screens/Game/Game.tsx` enruta a la variante online cuando `gameId` empieza por `online-` (como preveía el código aparcado), renderizando una `OnlineGame` adaptada desde `parked/OnlineGame.snapshot.tsx` + `useOnlineGame`, reutilizando los layouts `MobileGameLayout`/`DesktopGameLayout`. La partida online **no** se guarda con `saveGame` (no toca `just-poker-active-game` ni `VERSION`).

### 9. Reutilización (componentes y helpers)

| Pieza | Acción |
|-------|--------|
| `server/game/GameManager.ts` | Adaptar (código 4 dígitos, sin públicas/IA/puntos, `RoomRepository`). |
| `server/socket/handlers.ts` | Adaptar (identidad anónima, privadas, snapshots, failover). |
| `src/net/useOnlineGame.ts`, `onlineGameState.ts`, `onlineSession.ts`, `socket.ts` | Reutilizar/adaptar (sin `userStore`, sin IA, URL/path por entorno). |
| `src/screens/Online.tsx`, `src/screens/Lobby.tsx` | Reescribir sobre los actuales (quitar públicas/ranking, añadir QR, nombre editable, 2–4). |
| `parked/OnlineGame.snapshot.tsx` | Base para `OnlineGame`. |
| `Avatar`, `Button`, `TopBar`, `Badge`, `ConfirmDialog`, `Animated` | Reutilizar. |
| `MobileGameLayout`, `DesktopGameLayout`, `GameOverlays`, `GameSettings` | Reutilizar (con variante online). |
| `src/utils/randomName.ts`, `src/components/QrCode.tsx` | **Extraer nuevos** (helper y componente). |
| `LobbySlot` (local en `Lobby.tsx`) | Se mantiene local: un solo uso, sin duplicación. |

No se duplica markup ni lógica; cualquier patrón repetido se sustituye por el componente/helper compartido.

## Risks / Trade-offs

- **[Cierre periódico de la conexión en Vercel (300s–800s)]** → cliente con reconexión y backoff, re-emisión de `room:join`/`game:sync`, y recuperación del estado desde el snapshot de Redis.
- **[El anfitrión cae a mitad de partida]** → snapshot en Redis + promoción de un nuevo host; si no hubiera ninguno conectado, la partida queda pausada y se reanuda al reconectar.
- **[Divergencia memoria vs Redis entre instancias]** → un único camino de código con `RoomRepository`+adaptador Redis; fallback en memoria solo en dev.
- **[Colisión de códigos de 4 dígitos]** → reintento hasta unicidad; el espacio es de 10 000 combinaciones y las salas son efímeras.
- **[Cualquiera con el código/enlace entra]** → inherente al diseño anónimo; sin dinero real no hay incentivo. Opcional (no en este change): rate-limit.
- **[Dependencia de Redis en el plan Hobby]** → tiers gratuitos del Marketplace; documentar la variable `REDIS_URL`.
- **[Reactivar `INTERNET` en Android]** → actualizar Data safety en Play (no se recogen datos de usuario, pero la app usa red).

## Migration Plan

1. Aprovisionar Redis en el Marketplace de Vercel y fijar `REDIS_URL` (Preview/Production).
2. Añadir `api/socket-io.ts`, adaptar `server/*` y `src/net/*`; actualizar `vercel.json` (Function con `maxDuration`) y confirmar Fluid Compute activo.
3. Reactivar rutas y pantallas de online; añadir i18n y QR.
4. Verificar en dos navegadores/dispositivos (crear/unirse por código y por QR), y `scripts/online-smoke.mjs` adaptado.
5. Reintroducir `INTERNET` en `AndroidManifest.xml` y reconstruir el APK/AAB.
6. **Rollback**: revertir el deploy de la web (las rutas de online vuelven a "no disponible"); el servidor no guarda estado durable más allá de las salas efímeras.

## Open Questions

- Proveedor concreto de Redis (Upstash vs. otro del Marketplace): intercambiable, no cambia specs ni tareas.
- ¿Mantener `server/index.ts` como harness de dev o usar `vercel dev`?: se puede decidir durante la implementación.
