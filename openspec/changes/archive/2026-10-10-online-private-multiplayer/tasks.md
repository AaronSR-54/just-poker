# Tasks

## 1. Servidor realtime anónimo

- [x] 1.1 Añadir dependencias del servidor (`@socket.io/redis-adapter` y cliente Redis) y crear `api/socket-io.ts` (Function de Vercel que exporta un `http.Server` con socket.io). Verificar que `npm run build` sigue pasando y que la Function arranca en local.
- [x] 1.2 Adaptar `server/game/GameManager.ts`: solo salas privadas, código de 4 dígitos único, sin públicas/IA/puntos, y extraer un `RoomRepository` (implementación en memoria y en Redis con fallback cuando no hay `REDIS_URL`). Verificar con tests unitarios nuevos del repositorio (unicidad de código, alta/baja, transferencia de host).
- [x] 1.3 Adaptar `server/socket/handlers.ts` a identidad anónima (`playerId`), `room:join` con `name`, `room:rename`, snapshots de estado en Redis y failover de anfitrión; eliminar `room:quick`, el auto-arranque de públicas y el uso de JWT. Verificar con `scripts/online-smoke.mjs` adaptado (dos clientes crean/unen/inician una privada).
- [x] 1.4 Retirar `server/middleware/auth.ts`, `server/routes/auth.ts`, `server/routes/user.ts`, `server/prisma/` y las deps `bcrypt`/`jsonwebtoken`/`@prisma/client`; ajustar `server/index.ts`. Verificar que el servidor compila (`npx tsc -p server/tsconfig.json`).

## 2. Lobby y entrada sin cuenta

- [x] 2.1 Extraer `src/utils/randomName.ts` (nombre aleatorio desde listas i18n) y añadir las claves de nombres en `es`/`en`. Verificar con un test unitario del helper (nombre no vacío y determinista con semilla inyectable).
- [x] 2.2 Reescribir `src/screens/Online.tsx` para partidas privadas (crear / unirse por código de 4 dígitos, teclado existente, sin públicas ni ranking), reutilizando `Button` y `Animated` y con textos por `t(...)`. Verificar el flujo crear/unirse entre dos pestañas.
- [x] 2.3 Reescribir `src/screens/Lobby.tsx`: 2–4 jugadores reales (sin IA), nombre editable con `Avatar`, código copiable, botón de inicio solo para el anfitrión y transferencia de host al salir. Verificar cada escenario de `online-lobby`.
- [x] 2.4 Extraer `src/components/QrCode.tsx` (dependencia `qrcode`) y mostrar en el lobby el QR que codifica `${origin}/join/${code}`, reutilizando tokens de tema. Verificar que escanear el QR con la cámara abre el lobby.
- [x] 2.5 Añadir rutas `/online`, `/lobby/:roomId` y `/join/:code` en `src/App.tsx`, el CTA de online en `src/screens/Menu.tsx` y las claves i18n asociadas (es/en). Verificar la navegación directa por enlace sin teclear código.

## 3. Partida online host-autoritativa

- [x] 3.1 Adaptar `src/net/useOnlineGame.ts`, `onlineGameState.ts`, `onlineSession.ts` y `socket.ts`: sin `userStore`/puntos ni IA, URL y `path` según entorno, reconexión con backoff y resincronización desde el snapshot. Verificar reconexión a mitad de mano.
- [x] 3.2 Crear la pantalla `OnlineGame` a partir de `parked/OnlineGame.snapshot.tsx` e integrarla en `src/screens/Game/Game.tsx` para `gameId` con prefijo `online-`, reutilizando `MobileGameLayout`/`DesktopGameLayout`. Verificar una mano a 2 y a 3 jugadores (cartas privadas ocultas y reveladas en showdown, acciones reflejadas en tiempo real).
- [x] 3.3 Añadir `context: 'online'` a `GameOverlays` y `GameSettings` para ocultar la sección de velocidad y usar temporizador fijo en online. Verificar que durante una partida online los ajustes no muestran velocidad.

## 4. Despliegue y Android

- [ ] 4.1 Configurar `vercel.json` para la Function de WebSockets (`maxDuration`) y confirmar Fluid Compute; documentar `REDIS_URL` y el endpoint en `AGENTS.md`/`ROADMAP.md`. Verificar un deploy de Preview con dos dispositivos.
- [x] 4.2 Reintroducir el permiso `INTERNET` en `android/app/src/main/AndroidManifest.xml` y reconstruir. Verificar `npm run android:debug` y una partida entre navegador y app Android.

## 5. Verificación final

- [ ] 5.1 Probar de extremo a extremo en dispositivos/redes distintas: crear por código, unirse por enlace/QR, jugar una mano completa, desconectar y reconectar, y caída del anfitrión con failover.
- [x] 5.2 Revisar la checklist de reutilización de `AGENTS.md`: componentes de `src/components/` reutilizados, sin duplicación de JSX/lógica, sin helpers duplicados, tokens en vez de valores crudos y todo el texto por `t(...)`.
- [x] 5.3 Ejecutar `npx oxlint src/`, `npx tsc --noEmit` y `npm run build` sin errores.

## Workflow follow-up

- Archive the change after implementation and review are complete.
