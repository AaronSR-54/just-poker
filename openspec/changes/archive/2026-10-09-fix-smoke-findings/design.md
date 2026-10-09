# Design

## Context

Ver `proposal.md` — Why. Los tres bugs son **preexistentes** (idénticos en el commit base `eacbcf6`), detectados en el smoke del refactor. Las rutas implicadas son las que el refactor acaba de extraer:

- `useLocalGameInit.ts:48` solo reanuda si `searchParams.get('continue') === '1'`; `Local.tsx:203,208` navega a `/game/local-<dif>` **sin** ese parámetro.
- `useTurnTimer.ts:77-82`: con Ajustes abierto se hace `stopTimer()`, pero al cerrar se llama `startTimer()`, que resetea a `totalSeconds` (`:51-52`).
- `ActionButtons.tsx:85` solo capa el botón de subir por `expectedAction !== 'raise'`; con `expectedAction === 'raise'` el atajo all-in de `RaiseControls.tsx:32` sigue disponible.

Restricciones del proyecto (`AGENTS.md`): utilidades Tailwind nativas en JSX, tokens del `@theme`, textos vía `t(...)`, sin clases CSS propias. Sin nuevas dependencias.

## Goals / Non-Goals

**Goals:**
- Recargar a mitad de mano reanuda la misma partida (cartas, fichas, calle).
- Abrir/cerrar Ajustes pausa y reanuda el temporizador desde el tiempo restante.
- La mano guiada no permite all-in.
- Mantener intactos los flujos existentes: «Nueva partida» (con confirmación) y «Continuar» del menú.

**Non-Goals:**
- No cambiar el formato de guardado (`VERSION = 1`) ni las claves de `localStorage`.
- No tocar el comportamiento de la IA del tutorial ni el resto de pasos guiados.
- No rediseñar la UI de subida ni el layout.

## Decisions

### 1. La URL es la señal de reanudación; marcarla al iniciar partida
Causa raíz: al iniciar una partida nueva desde `Local` la URL no lleva `continue=1`, así que una recarga no reanuda.

Decisión: al inicializar una partida local (nueva o reanudada, no tutorial), fijar `continue=1` con `setSearchParams(..., { replace: true })`. La recarga vuelve a leer la misma URL y reanuda. No se toca el flujo del menú/`Local`.

Alternativas:
- Reanudar siempre que el guardado case con `gameId` (ignorando el parámetro) → **rechazada**: rompe la confirmación de «Nueva partida» de `Local.tsx:199` (resumiría en lugar de empezar de cero).
- Marca en `sessionStorage` → **rechazada**: la URL ya es la convención (`Menu.tsx`, `HandsGuide.tsx`); una segunda fuente complica.

### 2. El temporizador conserva los ms restantes al pausar
Decisión: guardar en una ref los ms restantes al pausar por Ajustes y reanudar desde ahí; un turno nuevo vuelve a arrancar completo. La pausa debe congelar la cuenta (no expirar) mientras Ajustes está abierto.

Implementación: `startTimer(remainingMs?)` acepta un remanente opcional; al detectar `settingsOpen` capturamos el restante desde `timerSecondsRef`/`Date.now()`; al cerrar, si sigue siendo el turno humano, se reanuda con el remanente. El remanente se limpia al cambiar de turno/estado.

Alternativa: dejar correr el reloj bajo Ajustes y solo ignorar la expiración → **rechazada**: la spec exige que la cuenta quede pausada.

### 3. El tutorial acota la subida por debajo de all-in
Decisión: `RaiseControls` recibe si es tutorial y, en ese caso, **no ofrece** el atajo de all-in; además el máximo de subida se acota a `allIn - 1` (respetando `minRaise`). Así ni el slider ni los atajos alcanzan el all-in y la etiqueta/confirmación no muestran «all-in».

El tope se calcula en `buildGameView` (que ya expone `maxRaise`, `callAmount`) y se aplica también en el `useEffect` de clamp de `Game.tsx:118-130`, para que el estado `raiseAmount` no supere nunca el tope.

Alternativas:
- Solo deshabilitar el atajo all-in → **rechazada**: el slider seguiría llegando al all-in.
- Bloquear cualquier subida en el tutorial → **rechazada**: hay pasos que esperan `raise`.

## Risks / Trade-offs

- **`setSearchParams` añade una entrada al historial / altera el botón atrás** → usar `{ replace: true }` y verificar los flujos de salida (menú y «Salir»).
- **Pausa exactamente al cambiar de turno** → limpiar el remanente cuando cambia el turno/estado; si no hay remanente válido, arrancar completo (comportamiento actual).
- **Tutorial con stack corto donde `allIn - 1 < minRaise`** → acotar a `minRaise` (no se puede evitar el all-in, pero es un caso extremo no alcanzable con el stack inicial del tutorial).
- **Regresión en «Nueva partida»/«Continuar»** → smoke manual de ambos flujos en el checklist de verificación.

## Open Questions

Ninguna.
