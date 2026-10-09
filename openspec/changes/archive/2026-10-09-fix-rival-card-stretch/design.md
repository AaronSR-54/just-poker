# Design

## Context

Ver `proposal.md` — Why.

Cada rival se renderiza dentro de un `motion.div` en `DesktopGameLayout.tsx` y `MobileGameLayout.tsx`. Ese contenedor incluye dos hijos: el `RivalSlot` (tarjeta con altura fija y contenido de proporciones fijas) y un bloque de showdown que se muestra condicionalmente bajo el asiento.

En escritorio el bloque de showdown solo tiene `min-h` cuando `showdown` es `true`; en móvil siempre reserva `min-h-[5.5rem]`. Como el contenedor `motion.div` usa la prop `layout`, cuando aparece o desaparece el showdown cambia su tamaño y `framer-motion` anima ese cambio mediante transformaciones de escala (`scaleX`/`scaleY`) sobre el contenido ya medido. Las tarjetas de `PokerCard` tienen ancho y alto fijos en clases (`w-… h-…`), pero al aplicárseles un `scaleY` durante la animación se ven estiradas en vertical. El mismo efecto aparece en la dirección inversa al pulsar «Nueva mano», cuando el showdown desaparece y el contenedor se encoge.

## Goals / Non-Goals

**Goals:**

- Eliminar la deformación (estirado vertical) de los asientos de rival y sus cartas durante showdown y «Nueva mano».
- Mantener la animación de entrada/salida de asientos rivales y el reordenado cuando un rival queda eliminado.
- Mantener intacto el aspecto en reposo (geometría y proporciones actuales).

**Non-Goals:**

- No rediseñar `RivalSlot`, `PokerCard` ni `ShowdownCards`.
- No cambiar la lógica del motor, `gameView` ni el guardado.
- No eliminar `AnimatePresence` ni las transiciones de entrada de los asientos.

## Decisions

### Decisión 1: Animar solo la posición del contenedor del rival (`layout="position"`)

Sustituir la prop `layout` por `layout="position"` en el `motion.div` que envuelve cada rival (en ambos layouts). Con `layout="position"` `framer-motion` anima únicamente la posición del elemento y **no** aplica escala para simular cambios de tamaño, por lo que el contenido nunca se deforma. Se conserva el objetivo real de `layout`, que es reordenar suavemente los asientos cuando otro rival sale de la mesa.

Alternativas consideradas:

- **Quitar `layout` por completo**: elimina el reordenado animado cuando un rival es eliminado; peor experiencia.
- **Usar `LayoutGroup`/`layout` en los hijos**: no resuelve la causa (el contenedor sigue animando su tamaño con escala).
- **Fijar altura del contenedor siempre (móvil ya lo hace) y en escritorio**: mitiga el salto, pero `layout` seguiría deformando en cualquier cambio de tamaño (p. ej. cartas adicionales). `layout="position"` es la corrección directa.

### Decisión 2: Reservar la altura del bloque de showdown en escritorio

En `DesktopGameLayout.tsx`, el bloque de showdown usa `min-h` condicional (`showdown ? … : ''`). Para que la aparición/desaparición no provoque saltos de layout, se reservará una altura estable también cuando no hay showdown, alineándolo con el enfoque del móvil (`min-h-[5.5rem]`). Combinado con `layout="position"`, el contenido se coloca sin deformarse y el cambio de altura no se anima por escala.

Alternativa considerada: mantener el `min-h` condicional y confiar solo en `layout="position"`. Evita la deformación, pero deja un salto de posición al aparecer el showdown; reservar la altura es más estable visualmente.

### Decisión 3: Sin cambios en las cartas ni en los componentes de contenido

`PokerCard` y `ShowdownCards` ya tienen proporciones correctas. El problema es puramente de la animación de layout del contenedor, así que no se tocan tamaños ni clases de las cartas.

## Risks / Trade-offs

- [Al reservar la altura del showdown en escritorio cuando no hay showdown, el layout gana espacio vertical permanente] → La altura reservada es la que ya se usa durante el showdown y queda dentro del espacio disponible del asiento; en pantallas cortas (`isShort`) se usa la variante compacta (`min-h-[3.75rem]`), que ya existe.
- [Un tercer consumidor de `motion.div` con `layout` podría repetir el problema en el futuro] → El cambio cubre ambos layouts actuales; si se añaden más asientos animados, aplicar el mismo criterio (`layout="position"`).
- [`layout="position"` no anima cambios de tamaño] → Es intencionado: ningún requisito pide animar el tamaño del asiento; el reordenado, que sí se quiere animar, es un cambio de posición.
