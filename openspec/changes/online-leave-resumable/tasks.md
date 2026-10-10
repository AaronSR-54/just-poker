# Tasks

## 1. Salida al menú reanudable

- [x] 1.1 En `useOnlineGame.leave` (`src/net/useOnlineGame.ts`), dejar de llamar a `clearOnlineSession()`, marcar la actividad con `markPlayed('online')` y conservar el `room:leave`; verificar que tras salir la sesión sigue presente en `localStorage` (`jp-online-session`) y que `getActiveOnlineSession()` la devuelve.
- [x] 1.2 Verificar en una partida online de 2 jugadores que, tras pulsar «Volver al menú», el menú muestra la tarjeta online con «Continuar partida», al continuar se reincorpora a la misma partida y el otro jugador sigue pudiendo jugar.

## 2. Verificación

- [x] 2.1 Revisar la checklist de reutilización de `AGENTS.md`: solo se reutilizan la sesión y el mecanismo de reincorporación existentes, sin componentes ni helpers nuevos, sin clases CSS propias ni textos hardcodeados.
- [x] 2.2 Ejecutar `npx oxlint src/`, `npx tsc --noEmit` y `npm run build` y confirmar que pasan sin errores.

## Workflow follow-up

- Archivar el change cuando se cumplan los requisitos de revisión del proyecto.
