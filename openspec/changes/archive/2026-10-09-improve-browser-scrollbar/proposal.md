# Proposal

## Why

En navegadores de escritorio las barras de scroll de los contenedores con `overflow-y-auto` (pantallas, Ajustes, tutorial, guía de manos) se renderizan con el estilo nativo claro, que desentona con el tema oscuro `ink`/`bone` y cambia entre Chrome, Safari y Firefox. Además, sin `color-scheme` declarado, los controles nativos (selects, inputs, autofill) usan el esquema claro del navegador. Unificar la scrollbar y el esquema de color mejora la coherencia visual sin tocar el layout.

## What Changes

- Definir tokens de scrollbar en `@theme` (pulgar, pulgar hover y pista) y aplicarlos como estilo base global en `@layer base` (`index.css`).
- Estilar la barra de scroll de forma consistente en navegadores basados en WebKit/Blink (`::-webkit-scrollbar*`) y en Firefox (`scrollbar-width`/`scrollbar-color`).
- Declarar `color-scheme: dark` a nivel raíz para que los controles nativos del navegador usen el esquema oscuro (incluida la scrollbar por defecto y el autofill).
- No se modifica ningún componente: el estilo es global y afecta a todos los contenedores con scroll existentes.

## Capabilities

### New Capabilities

- `browser-scrollbar`: apariencia y esquema de color de las barras de scroll y controles nativos en navegadores, coherentes con el tema oscuro de la app.

### Modified Capabilities

Ninguna.

## Impact

- **Código**: `src/styles/index.css` (tokens en `@theme` y reglas base en `@layer base`). Ningún componente JSX ni lógica de app cambia.
- **Dependencias**: sin cambios; se usa CSS nativo (sin plugins ni Tailwind utilities de scrollbar).
- **Alcance**: solo navegadores de escritorio. La app Android (Capacitor/WebView) no cambia su comportamiento de scroll, que es overlay/transitorio.
- **Verificación**: `npx tsc -b`, `npx oxlint src/`, `npm run build` y comprobación visual en Chrome y Firefox (desktop) de las pantallas con scroll (Menú, Ajustes, Guía de manos, tutorial).
