# Design

## Context

Ver `proposal.md – Why`. El menú (`src/screens/Menu.tsx`) compone dos `CtaCard` (local y online) y detecta partidas con `loadSavedGame()` (`src/game/saveGame.ts`, descarta terminadas) y `getOnlineSession()` (`src/net/onlineSession.ts`). El hub online (`src/screens/Online.tsx`, modo `main`) muestra una caja con borde con dos botones full-width: crear (primario) y unirse (outline).

Datos disponibles para el contexto y la recencia:
- Local (`SavedGame`): `difficulty`, `state.handNumber`, `savedAt`.
- Online (`OnlineSession`): `code`, `seats.length`, `savedAt` (hoy solo se fija al iniciar la partida; **no** se actualiza durante el juego).
- Salas online: TTL de 12 h desde la última escritura (`server/game/roomRepository.ts:77`), borrado inmediato al irse el último jugador (`GameManager.ts:80-84`), y timeout de turno remoto de 35 s (`useOnlineGame.ts:99`).

## Goals / Non-Goals

**Goals:**
- Continuar sea la acción obvia de la tarjeta cuando hay partida, con una única tarjeta destacada.
- Empezar una nueva sea una acción separada y explícita dentro de la misma tarjeta.
- Cubrir la reanudación online sin ofrecer salas probablemente muertas, sin añadir latencia ni parpadeo.

**Non-Goals:**
- Auto-navegar al abrir el menú.
- Añadir un evento de servidor de validación (`room:exists`); se descarta por coste/beneficio.
- Rediseñar `Hero`, `GameSettings` o el flujo de dificultad.
- Cambiar el motor de juego o el protocolo de red.

## Decisions

### 1. Dos tarjetas dinámicas, una sola destacada

Se mantienen exactamente dos tarjetas (local/online). La jerarquía se define con **una sola regla**: la tarjeta rellena es la acción recomendada. Prioridad: sin partidas → local; una → la que está en curso; dos → la última jugada. Alternativas descartadas: bloques «Continuar»/«Nueva partida» (obligan a 4 tarjetas) y auto-redirección (rompe la coexistencia).

### 2. Tarjeta "cortada" en dos filas

El estado con partida usa dos filas hermanas sin separación (`gap-0`): la superior continúa la partida (rellena si es la recomendada; oscura sin borde si no) y la inferior, en outline y de ancho completo, empieza una nueva. La fila superior muestra el título arriba y, abajo, la etiqueta de estado y el contexto con la flecha a la derecha; la inferior, el rótulo `Nueva partida` a la izquierda y la flecha a la derecha. Se evitan botones anidados: cada fila es un control propio. Ambas filas se desplazan a la derecha al pasar el cursor. El estado sin partida conserva la tarjeta actual (título, descripción y flecha), sin rótulo de acción.

### 3. Estado sin insignia

El estado `Continuar partida` es texto, no una insignia: se muestra en negrita y con el mismo color que el subtítulo, en la zona inferior de la fila superior. Se **elimina `Badge`** de `CtaCard`. El relleno comunica "recomendada"; el texto de estado comunica "en curso": dos señales distintas, sin sobrecargar el relleno.

### 4. Recencia: marcador de última actividad por modalidad

Se añade un helper `src/utils/lastPlayed.ts` con `markPlayed(mode)`, `getLastPlayed(mode)` y `clearLastPlayed(mode)`, persistido en `localStorage` (`just-poker-last-played`), con marcas por modalidad `{ local?: number; online?: number }`. Se actualiza al jugar local (junto al autosave en `useLocalGameInit`) y al jugar online (en `useOnlineGame` y al iniciar en `Lobby`). Motivo: `savedAt` online no se refresca durante la partida y no es comparable con el local; el marcador sí. Si falta el marcador, fallback: comparar `savedAt` de las sesiones y, en último término, local.

### 5. Ventana online de 30 minutos

La validez de la sesión online se decide por tiempo, no por red: `getActiveOnlineSession()` en `onlineSession.ts` devuelve la sesión solo si `now − lastPlayed.online ≤ 30 min`; si no, la descarta y devuelve `null`. `Menu.tsx` y `Online.tsx` usan esta función (una sola definición de la ventana). Motivo: la reanudación online es una interrupción corta; el timeout de 35 s ya avanza la partida, así que pasada media hora la sesión deja de ser útil. Alternativa descartada: `room:exists` eager (handshake 10 ms–3 s, parpadeo y código de servidor para un caso raro).

### 6. Item de reanudar en el hub online

En `Online.tsx` modo `main`, si `getActiveOnlineSession()` devuelve sesión, se añade un item «Volver a la partida» con contexto como **primario** y crear pasa a **outline**; sin sesión, se mantiene igual. Reutiliza `Button` y la caja existente; no es una sección nueva.

### 7. Red de seguridad y mensaje de sala cerrada

No se valida en el menú. Si el humano continúa una sala ya cerrada, el destino ya limpia la sesión y muestra error (`useOnlineGame.ts:210-214`). Se mejora ese aviso para que sea claro ("la partida ya no existe") y ofrezca volver al menú. Es la garantía de que nunca se entra a una sala fantasma.

### 8. i18n y onboarding

Claves nuevas/ajustadas en `menu.*` (estado `continueGame`, contextos) y `online.*` (item de volver + contexto). Se retiran los rótulos junto a la flecha (`Continuar`/`Nueva partida`) y `continueHint`/`returnHint`: la flecha va sola. Se arregla el target obsoleto de `OnboardingCoach` (`new-game` → `play-local`).

## Risks / Trade-offs

- [`filled` también marca la local cuando no hay partidas; podría leerse como "tienes partida"] → El estado sin partida no lleva eyebrow y su acción es «Nueva partida», lo que lo desambigua.
- [La ventana de 30 min oculta una partida online pausada legítimamente más tiempo] → Es un parámetro de producto; se puede subir. Se prioriza no ofrecer salas muertas.
- [Marcador de recencia ausente en usuarios existentes] → Fallback por `savedAt`/local descrito arriba.
- [Layout desktop con `cqw`/`clamp` al añadir la fila inferior] → Validar la tarjeta "cortada" en móvil y desktop y usar tokens `text-fs-*`.
- [Eliminar `Badge` de `CtaCard`] → Único consumidor `Menu.tsx`; se actualiza en el mismo change.

## Migration Plan

Cambio de cliente (React/UI) más un marcador de `localStorage` nuevo (aditivo, sin migración). Rollback: revertir el código; el marcador huérfano no molesta.

## Open Questions

- Ninguna pendiente: la recencia, la ventana y el item del hub quedan decididos.
