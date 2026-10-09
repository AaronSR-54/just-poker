# Proposal

## Why

Al entrar en showdown y al pulsar «Nueva mano», los asientos de los rivales (y, con ellos, sus cartas) se estiran verticalmente durante la animación y el resultado se ve deformado. El contenedor de cada rival usa una animación de layout que redimensiona por escala todo su contenido cuando aparece o desaparece el bloque de showdown, así que las tarjetas, que tienen proporciones fijas, se deforman al animar la altura.

## What Changes

- Hacer que la animación del asiento del rival solo anime su posición/entrada y no su tamaño, de modo que la aparición y desaparición del showdown no escale el contenido.
- Reservar/estabilizar la altura del bloque de showdown en ambos layouts (escritorio y móvil) para que el asiento no cambie de alto durante la transición; el bloque ya usa una altura mínima en ambos casos.
- Aplicar el mismo criterio de estabilidad a la transición de «Nueva mano» (cuando el showdown desaparece) para que no haya estiramiento ni salto brusco.
- No se cambia el aspecto en reposo ni las proporciones de `PokerCard`/`RivalSlot`: son correctas; solo se corrige la animación.

## Capabilities

### New Capabilities

- `game-table-transitions`: estabilidad geométrica de la mesa durante las transiciones de estado (showdown y nueva mano), de forma que los asientos de los rivales y sus cartas conserven sus proporciones y no se deformen al animar.

### Modified Capabilities

Ninguna.

## Impact

- **Código**: `src/screens/Game/layout/DesktopGameLayout.tsx` y `src/screens/Game/layout/MobileGameLayout.tsx` (contenedor `motion.div` de cada rival), y posiblemente `src/screens/Game/components/RivalSlot.tsx`/`ShowdownCards.tsx` si se necesita fijar la geometría.
- **Dependencias**: sin cambios; se sigue usando `framer-motion` (`layout`, `AnimatePresence`) ya presente.
- **Alcance**: solo la pantalla de partida (`game/`), en escritorio/tablet y móvil. No afecta a la lógica del motor ni al guardado.
- **Verificación**: `npx tsc --noEmit`, `npx oxlint src/`, `npm run build` y comprobación visual entrando en showdown y pulsando «Nueva mano» en ambos layouts.
