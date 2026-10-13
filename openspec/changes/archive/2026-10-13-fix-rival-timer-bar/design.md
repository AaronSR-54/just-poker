# Design

## Context

Ver `proposal.md` para la motivación y `specs/turn-timer/spec.md` para el comportamiento exigido. Estado actual relevante (partida local):

- `useAiTurns` publica el turno del rival como un objeto `{ playerIndex, duration, remainingMs }` que consume `RivalList` → `RivalSlot` → `TimerBar`.
- `RivalList` solo pasa `timerDuration`/`timerRemainingMs` a `RivalSlot` cuando `rivalTurn.playerIndex === r.id`, y `RivalSlot` solo pinta la barra si ambos están definidos y `isActive`.
- El intervalo que gobierna la barra se crea en `runBar` (`src/screens/Game/hooks/useAiTurns.ts`). La guarda `if (barTimerRef.current !== null) return;` impide recrearlo cuando el turno pasa a otro rival dentro del mismo intervalo.
- El modo online no usa `useAiTurns`; usa `useTurnCountdown` re-clavado por `currentPlayer`, que ya re-apunta bien. Queda fuera del arreglo.

## Goals / Non-Goals

**Goals:**

- Que el `aiTurn` publicado apunte siempre al rival activo, de forma que la barra sea visible en cada turno de rival, incluidos turnos consecutivos.
- Mantener el comportamiento ya existente: pausa con Ajustes, reanudación desde el tiempo restante y velocidad de juego leída desde refs.

**Non-Goals:**

- No cambiar el componente `TimerBar`, el `RivalSlot` ni el contrato de props entre ellos.
- No tocar el modo online ni la duración/velocidad del turno.
- No convertir la barra del rival en una animación CSS ni unificar `useAiTurns` con `useTurnCountdown` (cambio mayor, fuera de alcance).

## Decisions

### D1. Reiniciar el intervalo cuando cambia la clave del turno

El intervalo se recrea cuando cambia la clave del turno (`handNumber-phase-current`), no cuando cambia cualquier re-render:

- Si `barKeyRef.current !== key`: limpiar el intervalo vigente (`clearBar()`), fijar la nueva clave, reiniciar duración/tiempo restante y arrancar un intervalo nuevo que capture el `playerIndex` actual.
- Si la clave es la misma y el intervalo sigue vivo: no hacer nada (mismo turno, mismo rival).

Así el `tick` siempre publica el `playerIndex` del rival correcto y un `endsAt` nuevo por turno.

**Alternativas consideradas:**
- (b) Hacer que `tick` lea `playerIndex`/`endsAt` de refs para re-apuntar sin recrear el intervalo. Descartada: más estado mutable y más frágil (dos refs que deben sincronizarse) para el mismo resultado.
- (c) Añadir la clave actual a las dependencias del efecto. Descartada por sí sola: el efecto ya depende de `gameState`, y el problema es la guarda de `runBar`, no la falta de re-ejecución del efecto.

### D2. Reutilización sin extracción

No se introduce ningún componente ni helper nuevo. Se reutilizan `TimerBar` (`src/screens/Game/components/TimerBar.tsx`) y `RivalSlot` (`src/screens/Game/components/RivalSlot.tsx`) sin cambios; el arreglo vive en un único sitio, el hook `useAiTurns`, del que no hay copias. Como no hay markup ni lógica repetida nueva, no procede extraer nada; `RivalList` sigue siendo el único punto que traduce el `aiTurn` a props.

### D3. Ámbito local

El arreglo se limita a `useAiTurns`. El modo online mantiene su camino actual (correcto) y no se modifica, por lo que no hay riesgo de regresión online.

## Risks / Trade-offs

- **Limpiar el intervalo al cambiar de turno podría cortar la reanudación tras Ajustes** → La reanudación con la misma clave no recrea el intervalo mientras siga vivo; solo se recrea en la reanudación si `freezeBar` ya lo había limpiado, y en ese caso conserva `barRemainingRef`. Verificar el ciclo abrir/cerrar Ajustes en un turno de rival.
- **Pérdida de un frame al recrear el intervalo** → Aceptable: el `tick` se invoca inmediatamente al arrancar, igual que hoy.
- **Cambios futuros en la clave de turno** → La clave `handNumber-phase-current` ya distingue rivales consecutivos; documentar que la clave debe seguir incluyendo al jugador actual.
