# Proposal

## Why

El botón de acción principal compartido —el de «Jugar» en la preparación local y los de «Crear partida» y «Unirse» en la pantalla de juego con amigos— usa hoy esquinas de 14 px (`rounded-[14px]`), que se leen como un rectángulo redondeado. El resto de controles de acción de la app (botón base, badges, chips) son tipo píldora (`rounded-full`). Igualar el CTA principal a píldora da coherencia visual y una afordancia de botón más clara.

## What Changes

- El botón de acción principal compartido pasa a tener los extremos totalmente redondeados (`rounded-full`) en lugar de una esquina de 14 px.
- Se mantienen intactos: la etiqueta, la flecha de cola, los tamaños (compacto/completo), las variantes, el estado deshabilitado y los tratamientos de hover/activo/foco, así como el texto i18n.
- No hay cambios de comportamiento funcional.

## Capabilities

### New Capabilities
- `cta-buttons`: forma y presentación del botón de acción principal compartido por la preparación local y la entrada de juego con amigos.

### Modified Capabilities
<!-- Ninguna: no cambian requisitos de capacidades existentes; el cambio es de presentación de un componente compartido. -->

## Impact

- **Código:** `src/components/CtaButton.tsx` (radio de esquinas). Consumidores sin cambios: `src/screens/Local.tsx` (botón «Jugar») y `src/screens/Online.tsx` (botones «Crear partida» y «Unirse»).
- **Reutilización:** se reutiliza el `CtaButton` existente y su `Button` base; no se introduce ni se extrae ningún componente ni helper, y no se duplica markup ni lógica. El radio se define en un único punto (`CtaButton`), por lo que los tres botones quedan cubiertos sin copias.
- **APIs/dependencias:** ninguna.
