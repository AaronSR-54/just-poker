# Just Poker — Roadmap

Estado de planificación del proyecto. Las fases 2, 3 y siguientes están **pausadas** de momento.

## Decisiones de producto

- El core del producto es **"abrir y jugar"**: poker solo, offline, sin fricción.
- **Sin dinero real**, gratis.
- **Online desactivado** pero **conservado** en el código (no se borra), para una futura fase.
- **Progresión/perfil fuera** del alcance actual (puntos, rango, historial de cuenta, onboarding). Recuperable de git si se retoma.

## Estado actual — MVP 1 "solo poker" (completado)

- Flujo: `Menu` → `Local` (elegir dificultad) → `Game` (mesa contra IA).
- Rutas activas en `src/App.tsx`: `/`, `/local`, `/game/:gameId`.
- Online aparcado: `src/net/`, `src/screens/Online.tsx`, `src/screens/Lobby.tsx`, `server/`, `scripts/online-smoke.mjs`, dep `socket.io-client`.
- `src/store/userStore.ts` se mantiene intacto porque el código online conservado lo usa.
- Snapshot del antiguo componente online: `parked/OnlineGame.snapshot.tsx` (fuera del build).
- Motor con **41 tests** (`src/game/poker.test.ts` + `src/game/fuzz.test.ts`): evaluación de manos (incl. escalera al As/rueda), reparto de botes y side pots, devolución de apuestas no igualadas, rotación heads-up, all-in, serialización y **fuzz de invariantes** (200 semillas: cero fichas negativas, conservación del total, turnos legales, round-trip de guardado a mitad de mano).
- **Guardar/reanudar partida en curso**: `src/game/saveGame.ts` + `PokerGame.serialize()/deserialize()`.
  - Clave `localStorage`: `just-poker-active-game`.
  - `VERSION = 1`. **Al cambiar el formato de guardado de forma incompatible, subir `VERSION` y añadir migración.**
- Pulido móvil básico: `100dvh`, scroll seguro de mesa, confirmación al descartar partida en curso.

### Verificación

```bash
npx tsc -b            # type-check (tsconfig.app.json: noUnusedLocals/noUnusedParameters activos)
npx oxlint src/       # lint
npm test              # vitest
npm run build         # build de producción
```

### Convenciones

Ver `AGENTS.md` (tokens, clases reutilizables, reglas de estilos).

---

## Fase 2 — Contenido offline (PAUSADA)

Objetivo: dar profundidad a la experiencia "solo poker" sin tocar online.

- [ ] **IA con tests de decisión**: cubrir `src/ai/aiPlayer.ts` y `src/ai/personalities.ts` (fold/call/raise por perfil y situación). Hoy la IA no tiene tests propios.
- [ ] **Dificultad real**: afinar agresividad, faroles y rangos por nivel; revisar `PERSONALITIES`.
- [ ] **Mesas y rivales variados**: ampliar `TABLES` en `src/screens/Local.tsx` (ciegas, stacks, nº de asientos, nombres/personalities).
- [ ] **Feedback**: sonidos y/o vibración en acciones, victorias y turno.
- [ ] **Ayuda in-game**: consulta de ranking de manos, última acción ampliada, historial de la mano.
- [ ] **Ajustes**: velocidad del turno/IA, ciegas, ocultar equity por defecto; persistir preferencias en `localStorage`.
- [ ] **Accesibilidad y responsive**: revisar teclado/foco, contraste, tamaños táctiles (`--jp-tap`).

## Fase 3 — Online (PAUSADA)

Objetivo: reactivar el multijugador ya escrito.

- [ ] Reponer rutas `/online` y `/lobby/:roomId` en `src/App.tsx`.
- [ ] Restaurar `OnlineGame` desde `parked/OnlineGame.snapshot.tsx` (o `git log`) e integrarlo en `Game.tsx`.
- [ ] Verificar `src/net/`, `src/screens/Online.tsx`, `src/screens/Lobby.tsx`, `server/` y `scripts/online-smoke.mjs`.
- [ ] Robustez: reconexión, timeouts, estados de partida, validación server-side.
- [ ] Despliegue del servidor.

## Futuro — Progresión y perfil (PAUSADA)

- [ ] Decidir si vuelven puntos/rango/perfil con otro diseño (lo actual se recortó en Fase 1.1).
- Referencias recuperables de git: `RankBadge`, `recordHand`/`recordGame`, `POINTS_BY_PLACE`, pantalla `Profile`, `Onboarding`, campos de progresión en `userStore`.

## Deuda técnica / notas

- CSS de pantallas retiradas (perfil/online/lobby/onboarding) se mantiene a propósito para no romper la reactivación de la Fase 3. Si el online se descarta definitivamente, limpiar estilos huérfanos.
- Onboarding fuera del arranque, pero sus ficheros se conservan.
