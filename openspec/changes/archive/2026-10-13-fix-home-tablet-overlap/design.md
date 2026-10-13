# Design

## Context

Ver `proposal.md` — Why. El bug aparece en la rama de escritorio del menú, que es la que corre en
tablet porque el único punto de corte es `isMobile = max-width: 767px`; no hay ningún tramo `md:`.

Estado actual relevante:

- El contenedor de escritorio del menú (`src/screens/Menu.tsx`) es un `flex ... items-center
  justify-center` sin `min-h-0` ni `overflow-y-auto`, a diferencia de las pantallas hermanas
  `Local` y `Online`, que sí los tienen.
- La columna de tarjetas (`Menu.tsx`) usa `flex-[45] ... [contain:size]`. `contain:size` pone a cero
  la altura intrínseca de la columna, de modo que su altura la fija el estirado (`items-stretch`)
  de la fila, que a su vez la determina el hero (`Hero.tsx`, `flex-[55]`).
- Cada tarjeta (`src/components/CtaCard.tsx`) se envuelve en `flex-1 min-h-0`; con partida en curso
  contiene una fila «continuar» (`flex-1`) y una fila «nueva partida» (alto fijo). El `min-h-0` del
  wrapper permite que la tarjeta encoja por debajo de su contenido, y el `h-full` del contenedor
  interno hace que las filas se desborden fuera de la caja y se monten sobre la tarjeta siguiente.

## Goals / Non-Goals

**Goals:**

- Que la portada con partida en curso no solape filas ni tarjetas en tablet (768–1023 px).
- Conservar la estructura actual de dos columnas (hero + tarjetas) en tablet.
- Que la portada siga siendo navegable cuando la altura de la ventana no baste.

**Non-Goals:**

- No se introduce una disposición apilada específica de tablet.
- No se cambia la disposición móvil ni el comportamiento sin partida en curso.
- No se toca el motor de juego, el guardado ni el online.

## Decisions

1. **Permitir que el contenido de la portada tenga la altura de su contenido y desplace si sobra.**
   Se alinea la rama de escritorio del menú con el patrón de `Local`/`Online`: añadir `min-h-0` y
   `overflow-y-auto` al contenedor de la portada. Alternativa descartada: fijar alturas con el prop
   `half` de `CtaCard` (ya existe pero está sin usar y es frágil).

2. **Evitar que la columna de tarjetas colapse la altura de su contenido.** Quitar `[contain:size]`
   de la columna de tarjetas para que contribuya su altura real y no se estire a ciegas a la medida
   del hero. Alternativa considerada: mantener `contain:size` y dar una altura mínima explícita;
   descartada por introducir un valor rígido.

3. **Impedir que las tarjetas encojan por debajo de su contenido.** Ajustar el patrón `flex-1
   min-h-0` del wrapper de `CtaCard` en el contexto de escritorio para que, si falta altura, se
   desplace en vez de recortar filas. Decisión a validar visualmente; la alternativa (dejar
   `min-h-0`) es precisamente la causa del solape.

4. **Reutilización.** Se reutilizan `Screen`, `SettingsButton`, `Hero`, `CtaCard` y `Wordmark`.
   No se extrae ningún componente ni helper nuevo: el cambio es de utilidades/alturas dentro de
   componentes existentes, sin lógica ni markup repetido que extraer. Si al implementar aparece un
   patrón de contenedor repetido en las tres pantallas (menu/local/online), se valorará extraerlo
   como componente en ese momento, sustituyendo todas las copias.

## Risks / Trade-offs

- [Al quitar `contain:size` la columna de tarjetas puede quedar más alta que el hero y descentrar la
  portada] → Mantener centrado y validar en 768, 900, 1024 px y alturas cortas; si desborda, el
  `overflow-y-auto` lo absorbe.
- [El escalado con `cqw` de la fila «continuar» no coincide con el alto fijo de la fila «nueva
  partida»] → Validar que ambas filas se mantienen completas en todo el rango de tablet; ajustar la
  métrica de la fila nueva solo si es necesario.
- [Regresión visual en escritorio ancho] → Comparar la portada a ≥1024 px antes/después.

## Open Questions

- Ninguna que cambie specs, enfoque o desglose de tareas.
