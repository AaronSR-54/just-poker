# Proposal

## Why

En varias pantallas y componentes el texto no queda verticalmente alineado con sus elementos colindantes (iconos, fichas de posición, números, etiquetas o controles): hay filas que mezclan `items-start`/`items-end`/`items-baseline` con alturas de línea distintas, y aparecen `leading` menores que el tamaño de fuente. El resultado son textos que se leen altos o bajos respecto a lo que tienen al lado, tanto en móvil como en escritorio, y rompe la sensación de pulido que el resto de la interfaz cuida.

## What Changes

- Se fija una convención única de alineación vertical de texto:
  - Texto junto a un icono, ficha, avatar o control con caja propia → se centra por caja (`items-center`).
  - Texto junto a otro texto o número que comparte línea tipográfica (etiqueta + importe, puesto + nombre, número + unidad) → se alinea por línea base (`items-baseline`).
- Se corrigen los puntos donde la convención no se cumple o la métrica de línea es incorrecta:
  - Nombre + ficha de posición en el asiento rival (baseline sobre un texto con `truncate`).
  - Línea de alias del asiento rival (`leading` por debajo del tamaño de fuente; escala no monótona entre breakpoints).
  - Flecha grande junto a texto multilínea en las tarjetas CTA (`items-end` con `leading` dispares).
  - Flecha de volver vs. wordmark apilado en las cabeceras de página.
  - Etiqueta de tarjeta seleccionable con `leading-none` en tamaño grande (riesgo de solape al partir en dos líneas).
  - Etiqueta + valor del control deslizante de ajustes.
  - Etiqueta «Bote» + importe con ficha en la fila del bote.
  - Puesto + nombre en la clasificación final.
  - Código de sala (letras + botón QR) en el lobby online.
- Todas las correcciones son de presentación (utilidades Tailwind nativas); no cambian textos, acciones ni lógica.
- Se revisa el resultado en móvil y escritorio.

## Capabilities

### New Capabilities
- `text-alignment`: define cómo se alinea verticalmente el texto visible respecto a los elementos que tiene al lado (iconos, fichas, avatares, controles, otros textos y números) en todas las pantallas, en móvil y en escritorio.

### Modified Capabilities
<!-- Ninguna: la alineación vertical de texto no estaba cubierta por una capacidad existente. -->

## Impact

- **Código (componentes):** `src/components/CtaCard.tsx`, `src/components/PageHeader.tsx` (+ `BackButton`), `src/components/SelectableCard.tsx`, `src/components/SettingSlider.tsx`, `src/components/CoachCard.tsx`, `src/components/CtaButton.tsx`, `src/components/GameSettings.tsx`.
- **Código (mesa/juego):** `src/screens/Game/components/RivalSlot.tsx`, `HumanSeat.tsx`, `CommunityRow.tsx`, `GameOverOverlay.tsx`, `ChipStackRow.tsx`, `ActionLog.tsx`.
- **Código (pantallas):** `src/screens/Online.tsx`, `src/screens/Local.tsx` (limpieza de `mt-1` redundante junto a `gap-1`).
- **Reutilización:** no se introduce ningún componente ni helper nuevo; los ajustes se aplican con utilidades nativas sobre los componentes existentes (`PositionChip`, `Badge`, `Button`, `Avatar`, `ChipIcon`). No se duplica markup ni lógica; donde el patrón «etiqueta + número» se repite (bote, puesto/clasificación, ajuste) se unifica la convención de alineación en lugar de crear una primitiva nueva. Se revisará la checklist de `AGENTS.md`.
- **i18n:** sin cambios; no se añade ni se elimina texto visible.
- Sin impacto en red, persistencia, motor de juego, configuración ni assets.
