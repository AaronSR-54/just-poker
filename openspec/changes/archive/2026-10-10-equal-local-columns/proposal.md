# Proposal

## Why

En la pantalla de preparación de partida local, la columna izquierda (titular y tarjetas de dificultad) y la derecha (detalle de la mesa y CTA) usan un reparto desigual de ancho (`flex-[48]` / `flex-[52]`), por lo que no se perciben equilibradas. Se quiere que ambas columnas tengan exactamente el mismo ancho, tanto en tablet como en escritorio.

## What Changes

- La preparación local reparte el espacio horizontal a partes iguales entre la columna de selección y la columna de detalle, en todos los anchos de dos columnas (tablet y escritorio).
- No cambia el layout móvil (una sola columna), ni el contenido, ni el comportamiento de selección/inicio de partida.

## Capabilities

### New Capabilities

- `local-game-preparation`: comportamiento observable de la pantalla de preparación de partida local (disposición en dos columnas en tablet/escritorio y una columna en móvil, y el reparto de ancho entre columnas).

### Modified Capabilities

<!-- Ninguna: la disposición de la preparación local no estaba cubierta por ningún spec existente. -->

## Impact

- Código afectado: `src/screens/Local.tsx` (contenedor de las dos columnas del layout de tablet/escritorio).
- Reutilización: se reutilizan los componentes existentes (`PageHeader`, `ScreenTitle`, `SelectableCard`, `Panel`, `PersonCard`, `CtaButton`, `ConfirmDialog`); no se introduce ni se extrae ningún componente o helper. Es un ajuste de utilidades de anchura en un contenedor existente, sin lógica nueva ni duplicación.
- Fuera de alcance (registrado como suposición): la pantalla online (`src/screens/Online.tsx`) comparte el mismo patrón `flex-[48]`/`flex-[52]` y el spec `game-entry` pide coherencia visual con la preparación local. La petición se limita a «local»; si se quiere mantener la paridad exacta, la pantalla online sería un cambio de seguimiento.
- Sin cambios de i18n, tokens, dependencias ni comportamiento de juego.
