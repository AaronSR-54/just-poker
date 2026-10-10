# Proposal

## Why

El CTA de la preparación local («Jugar») se muestra en outline y solo se rellena al pasar el cursor, mientras que los CTA de crear y unirse se muestran rellenos; además sus etiquetas («Jugar» y «Unirse») son genéricas y no describen la acción concreta. Se quiere que el CTA local sea relleno como el resto y que las etiquetas sean explícitas.

## What Changes

- El botón de acción principal de la preparación local pasa de variante outline a relleno (filled), igual que los de crear y unirse.
- La etiqueta del botón de la preparación local pasa de «Jugar» a «Empezar partida» (en: «Start game»).
- La etiqueta del botón de unirse pasa de «Unirse» a «Unirse a partida» (en: «Join game»).
- Se mantienen sin cambios la forma de píldora, la flecha, los tamaños, el estado deshabilitado y el resto de la pantalla.

## Capabilities

### New Capabilities
- `cta-buttons`: forma, relleno y etiquetas del botón de acción principal compartido por la preparación local y la entrada de juego con amigos. Complementa el delta aún no archivado de `full-rounded-cta-buttons` (misma capability).

### Modified Capabilities
<!-- Ninguna: no existen capacidades en `openspec/specs/` cuyos requisitos cambien. -->

## Impact

- **Código:** `src/screens/Local.tsx` (variante del CTA local), `src/i18n/locales/es/local.ts` y `src/i18n/locales/en/local.ts` (clave `play`), `src/i18n/locales/es/online.ts` y `src/i18n/locales/en/online.ts` (clave `joinAction`).
- **Reutilización:** se reutiliza el `CtaButton` existente y la variante `primary` del `Button` base; no se introduce ni extrae ningún componente ni helper, no se crea CSS nuevo y las etiquetas pasan por `t(...)`.
- **APIs/dependencias:** ninguna.
