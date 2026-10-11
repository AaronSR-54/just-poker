# Proposal

## Why

El botón de confirmar subida muestra el importe como texto plano («Subir 20» / «All-in 20»), sin la ficha que ya identifica visualmente las cantidades de fichas en el resto de la mesa (bote, montones de asiento, resultado). Añadir el símbolo de ficha a ese botón alinea su lectura con el resto de la interfaz y hace más evidente que la acción mueve fichas.

## What Changes

- El botón de confirmar subida de los controles de subida muestra el símbolo de ficha (icono de ficha) junto al importe, con el mismo tratamiento que el bote y los montones de asiento.
- El símbolo se sitúa justo antes del importe («Subir 🪙20» / «All-in 🪙20»), respetando el patrón existente de icono + número.
- Afecta a los controles compartidos de subida, por lo que aparece tanto en la hoja modal de móvil como en el panel de escritorio/tablet.
- No cambia la lógica de subida (atajos, slider, importes mínimo/máximo/all-in), ni las acciones ni el estado deshabilitado del botón.

## Capabilities

### New Capabilities
- `raise-controls`: presentación y comportamiento del botón de confirmar subida (incluido el símbolo de ficha junto al importe) dentro de los controles de subida compartidos por móvil y escritorio.

### Modified Capabilities
<!-- Ninguna: no hay una capacidad existente que cubra los controles de subida. -->

## Impact

- **Código:** `src/screens/Game/components/RaiseControls.tsx` (botón de confirmar de `RaiseControls`, compartido por `RaiseSheet` y `RaisePanel`). Posible ajuste de claves i18n en `src/i18n/locales/es/game.ts` y `src/i18n/locales/en/game.ts` para separar la etiqueta del importe y poder intercalar el icono.
- **Reutilización:** se reutiliza `ChipIcon` de `src/components/` (icono de ficha ya usado en bote y montones) y `Button` de `src/components/`. No se introduce ningún componente ni helper nuevo; no se duplica markup de icono, se sigue el patrón `[icono] + importe` ya establecido.
- **i18n:** todo texto visible sigue pasando por `t(...)`; el icono es decorativo (`aria-hidden`) y no añade texto.
- Sin impacto en red, persistencia, motor de juego ni configuración.
