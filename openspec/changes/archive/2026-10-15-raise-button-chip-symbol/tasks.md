# Tasks

## 1. i18n

- [x] 1.1 Confirmar con `rg "game\.raiseAmount|game\.allInAmount" src/` que `game.raiseAmount` solo se usa en `RaiseControls` y que `game.allInAmount` también lo usa `ActionButtons`; eliminar solo `game.raiseAmount` de `src/i18n/locales/es/game.ts` y `src/i18n/locales/en/game.ts` y comprobar que ya no hay referencias.
- [x] 1.2 Verificar que las claves reutilizadas `game.raise` y `game.quickAllIn` existen en ambos locales y `npx tsc --noEmit` no reporta claves inexistentes.

## 2. Implementación

- [x] 2.1 En `src/screens/Game/components/RaiseControls.tsx`, importar `ChipIcon` de `src/components/` y componer el contenido del botón de confirmar como etiqueta + icono + importe (icono justo antes del importe, importe en un `span` con `tabular-nums`), reutilizando `game.raise` / `game.quickAllIn`; verificar con `npm run dev` que el botón muestra el símbolo de ficha antes del importe.
- [x] 2.2 Verificar en `npm run dev` que el icono aparece igual en la hoja modal de móvil y en el panel de escritorio/tablet, que el importe sigue cambiando con el slider/atajos y que el estado deshabilitado de la mano guiada se mantiene.

## 3. Verificación

- [x] 3.1 Revisar la checklist de reutilización de `AGENTS.md`: `ChipIcon` y `Button` reutilizados, sin componentes/helpers nuevos, sin markup de icono duplicado ni strings hardcodeados fuera de `t(...)`.
- [x] 3.2 Ejecutar `npx oxlint src/` y verificar que pasa sin errores.
- [x] 3.3 Ejecutar `npx tsc --noEmit` y verificar que pasa sin errores.
- [x] 3.4 Ejecutar `npm run build` y verificar que el build termina correctamente.

## Workflow follow-up

- Archivar el change tras satisfacer los requisitos de revisión del proyecto.
