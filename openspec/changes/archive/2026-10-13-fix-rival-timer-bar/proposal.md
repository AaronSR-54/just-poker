# Proposal

## Why

En la partida local, cuando dos o más rivales (IA) juegan turnos consecutivos, la barra de cuenta atrás desaparece en el segundo rival y siguientes. La causa es que el intervalo que alimenta la barra del rival se crea una sola vez y conserva el `playerIndex` del primer rival, así que el turno publica el índice equivocado. El síntoma es intermitente porque depende del orden de asientos: solo ocurre en rachas de rivales consecutivos sin turno del humano entre medias.

## What Changes

- La barra de cuenta atrás del rival se vuelve a apuntar al rival activo en cada turno, de modo que es visible en **todos** los turnos de rivales consecutivos.
- Al terminar o cambiar un turno de rival, la barra deja de publicar el índice del rival anterior (no hay "barra fantasma" ni tiempo restante obsoleto).
- La pausa con Ajustes abierto y el reanudado desde el tiempo restante se mantienen para cada rival.
- No cambia el comportamiento del modo online (usa otro camino), ni la duración ni la velocidad del turno.

## Capabilities

### New Capabilities

<!-- Ninguna. -->

### Modified Capabilities

- `turn-timer`: se añade el requisito de que la barra del rival sea visible durante cada turno de rival, incluidos los turnos consecutivos entre rivales.

## Impact

- Código: `src/screens/Game/hooks/useAiTurns.ts` (ciclo de vida del intervalo y del objeto `aiTurn`); se mantiene estable el contrato hacia `RivalList`/`RivalSlot` y el componente `TimerBar`.
- Sin cambios de API, dependencias ni infraestructura. Sin migración de datos.
- Reutilización: no se introduce ni extrae ningún componente ni helper nuevo; se reutilizan `TimerBar` y `RivalSlot` tal cual. El arreglo es de lógica en un hook existente, por lo que no genera duplicación.
- Modo online: sin cambios (no comparte el hook `useAiTurns`).
