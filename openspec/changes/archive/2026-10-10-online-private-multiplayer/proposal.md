# Proposal

## Why

Just Poker hoy es 100 % offline: no hay forma de jugar con otras personas. El código de online existe pero está **aparcado** (Fase 3): usa autenticación de invitado con JWT, salas públicas con ranking/puntos y apodos, un modelo que ya no encaja con el producto ("abrir y jugar", sin cuentas). Queremos recuperar el multijugador con la mínima fricción posible: sin registro, partidas privadas entre amigos y entrada con un código o un QR.

## What Changes

- **Partidas privadas anónimas**: un usuario crea una partida y recibe un **código de 4 dígitos** y un **QR con el enlace directo al lobby**. Los demás se unen tecleando el código o escaneando el QR con la cámara nativa del teléfono (el QR abre el lobby directamente, sin introducir código).
- **Sin cuentas**: al entrar en una partida se genera automáticamente un **nombre aleatorio editable**; no hay login, ni puntos, ni ranking, ni historial de cuenta. Los avatares son genéricos y se derivan del nombre.
- **Solo jugadores reales**: el lobby admite entre **2 y 4 jugadores**; el anfitrión inicia la partida cuando hay al menos 2. No se rellenan asientos con IA.
- **Mesa online host-autoritativa**: el anfitrión ejecuta el motor y reparte el estado; las cartas privadas se envían solo a cada jugador. Reconexión y manejo de desconexiones.
- **Sin controles de velocidad** en el modo online (los ajustes de velocidad del juego local quedan deshabilitados/ocultos).
- **BREAKING (código aparcado)**: se retiran del online la autenticación JWT (`/api/auth/*`), el modelo Prisma/Postgres, las salas públicas (`room:quick`), los puntos/ranking y los apodos. El servidor Express independiente pasa a **Vercel Functions (WebSockets) + Redis** en el mismo dominio, para que sea totalmente funcional y multidispositivo.
- **Android**: se habilita el permiso de red (`INTERNET`) para que el online funcione en la app nativa.

## Capabilities

### New Capabilities

- `online-lobby`: creación y unión anónima a partidas privadas mediante código de 4 dígitos o enlace/QR directo al lobby; nombre temporal autogenerado y editable con avatar genérico; sala de 2 a 4 jugadores reales; el anfitrión inicia.
- `online-play`: partida multijugador en tiempo real host-autoritativa (estado compartido, cartas privadas ocultas), comportamiento ante desconexión/reconexión y ausencia de controles de velocidad en el modo online.

### Modified Capabilities

<!-- Ninguna: las capacidades existentes están acotadas a la partida local y no cambian sus requisitos. -->

## Impact

- **App (`src/`)**: rutas de online (`/online`, `/lobby/:roomId` y enlace directo por QR), CTA en el menú, integración de la mesa online en `src/screens/Game/`, `GameSettings` sin velocidad en online, nuevas claves i18n (es/en).
- **Redux de red (`src/net/`)**: se reutiliza y adapta el motor host-autoritativo (`useOnlineGame.ts`, `onlineGameState.ts`, `onlineSession.ts`, `socket.ts`); se elimina la dependencia de `userStore` (puntos/estadísticas) y de la IA de relleno.
- **Servidor (`server/` + `api/`)**: se retiran `middleware/auth.ts`, `routes/auth.ts`, `routes/user.ts`, Prisma; `GameManager` y `socket/handlers.ts` se adaptan a identidad anónima, salas privadas y códigos de 4 dígitos, y se despliegan como Vercel Function con adaptador Redis.
- **Dependencias**: añadir generación de QR (p. ej. `qrcode`) y adaptador de Redis de socket.io (`@socket.io/redis-adapter` + cliente Redis); retirar `bcrypt`/`jsonwebtoken`/`@prisma/client` del servidor activo.
- **Despliegue**: `vercel.json` con la Function de WebSockets y `maxDuration`, variable de entorno de Redis, y permiso `INTERNET` en `android/app/src/main/AndroidManifest.xml`.
- **Reutilización**: se reutilizan `Avatar`, `Button`, `TopBar`, `Badge`, `ConfirmDialog`, layouts de `src/screens/Game/*`, tokens y recetas de `AGENTS.md`, y los helpers de red aparcados. Se extrae un componente `QrCode` (o equivalente) y un helper de generación de nombres aleatorios; no se duplica markup, se sustituyen las copias.
