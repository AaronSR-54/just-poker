# Design

## Context

Ver `proposal.md` - Why. El CTA principal de la preparación local y de la entrada de juego con amigos se renderiza con `src/components/CtaButton.tsx`, que envuelve al `Button` base (`src/components/Button.tsx`) y hoy fuerza el radio con la utilidad `rounded-[14px]!` (con `!important`) además de su receta de contenido (texto a la izquierda, flecha `→` a la derecha) y sus tamaños compacto/completo.

## Goals / Non-Goals

**Goals:**
- Que los tres botones afectados (Jugar en local, Crear partida, Unirse) pasen a forma de píldora en un único punto de cambio.
- Mantener intactos etiqueta, flecha, tamaños, variantes, estado deshabilitado y tratamientos de interacción/foco.

**Non-Goals:**
- Cambiar las tarjetas de menú (`CtaCard`) ni las tarjetas seleccionables (`SelectableCard`): no forman parte del alcance confirmado.
- Tocar el radio del `Button` base para el resto de sus usos.

## Decisions

- **Cambiar el radio en `CtaButton`, no en cada pantalla.** `CtaButton` es el único punto que comparten los tres botones; modificar allí su utilidad de radio (`rounded-[14px]!` → `rounded-full`) cubre los tres sin tocar `Local.tsx` ni `Online.tsx`. Alternativa considerada: sobrescribir el radio por llamada desde cada pantalla; descartada porque duplicaría la decisión en tres sitios y dejaría el valor por defecto obsoleto.
- **Mantener `Button` base sin cambios.** El radio de `Button` (`rounded-full` por defecto) seguiría siendo sobrescrito por `CtaButton`; al eliminar la sobrescritura, `CtaButton` hereda la forma de píldora sin alterar el resto de consumidores de `Button` (p. ej. los botones del lobby).
- **No extraer ni introducir componentes/helpers.** El patrón se resuelve cambiando un valor en un componente ya compartido; no hay markup ni lógica repetidos que extraer.

## Risks / Trade-offs

- [La utilidad de `Button` base ya es `rounded-full`, así que la sobrescritura pasa a ser redundante] → Eliminar la sobrescritura en `CtaButton` en vez de cambiarla por `rounded-full!`, para no dejar `!important` innecesario.
- [Otros futuros usos de `CtaButton` adoptarán la forma de píldora por defecto] → Es el comportamiento deseado; si algún uso necesitara otra forma, se parametrizaría entonces.
