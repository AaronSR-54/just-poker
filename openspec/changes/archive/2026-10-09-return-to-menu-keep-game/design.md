# Design

## Context

Ver `proposal.md` — Why. La partida local se persiste automáticamente en `localStorage` (`just-poker-active-game`) vía `useLocalGameInit` mientras la partida no ha terminado (`src/screens/Game/hooks/useLocalGameInit.ts:96`). El menú ya lee ese guardado con `loadSavedGame()` y ofrece «Continuar partida» (`src/screens/Menu.tsx:68`).

El único punto que borra el guardado al salir es `confirmLeaveGame` en `src/screens/Game/Game.tsx:232`, invocado desde el diálogo de confirmación que abre el botón de ajustes.

## Goals / Non-Goals

**Goals:**

- Que «Volver al menú» desde los ajustes conserve el guardado y permita reanudar.
- Retirar el diálogo de confirmación destructivo de ese flujo.
- Mantener intacto el comportamiento del tutorial guiado y el descarte de partidas terminadas.

**Non-Goals:**

- Cambiar el formato o la cadencia de guardado (`saveGame`/`loadSavedGame`).
- Añadir guardado al tutorial guiado.
- Tocar la lógica de reanudación del menú.

## Decisions

- **No borrar el guardado al navegar al menú.** `Game.tsx` deja de llamar a `clearSavedGame()` en la salida. El guardado ya está en `localStorage`, así que basta con navegar a `/`.
  - Alternativa descartada: guardar explícitamente antes de navegar. Es redundante: `useLocalGameInit` ya persiste en cada cambio de `gameState`.
- **Eliminar el `ConfirmDialog` de salida y su estado.** Al no perderse progreso, la confirmación pierde sentido. Se retiran `leaveConfirmOpen`, `onLeave`/`onConfirmLeave`/`onCancelLeave` y el componente pasa a ser una navegación directa.
  - Alternativa descartada: mantener el diálogo con texto no destructivo. Añade fricción sin valor cuando la acción es reversible.
- **Reutilizar la infraestructura i18n.** Cambiar el texto de `settings.leave` a «Volver al menú» / «Back to menu» y retirar las claves `game.leave*` (o dejarlas si dejan de usarse; se eliminan para evitar texto muerto). El tipo `Dict` obliga a mantener `es` y `en` sincronizados.
- **Alcance solo local, no tutorial.** El tutorial no crea guardado (`isTutorial` excluido en `useLocalGameInit`), así que su salida no toca `localStorage` y no necesita cambios más allá de compartir el mismo botón con la nueva etiqueta.

## Risks / Trade-offs

- [El guardado podría quedar obsoleto si el jugador empieza una partida nueva] → Ya cubierto: iniciar una partida nueva llama a `clearSavedGame()` (`useLocalGameInit.ts:88`).
- [Reanudar a mitad de mano restaura la calle pendiente] → Ya cubierto: `loadSavedGame` descarta partidas terminadas y `useLocalGameInit` resuelve `streetPending` al reanudar.
- [Claves i18n huérfanas tras retirar el diálogo] → Se eliminan de `es` y `en`; `tsc`/`oxlint` verifican que no queden referencias.
