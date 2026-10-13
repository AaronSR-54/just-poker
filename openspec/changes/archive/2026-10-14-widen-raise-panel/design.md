# Design

## Context

El panel de subida de pantallas anchas es el popover anclado `RaisePanel`, exportado por `src/screens/Game/components/RaiseControls.tsx` y renderizado dentro del contenedor `relative` del botón «Subir» en `ActionButtons.tsx`. Se ancla abajo-derecha (`right-0`) y hoy tiene `min-w-[12.5rem] max-w-72` (18rem) con `p-4`. Su contenido (`RaiseControls`) es el mismo que usa la hoja de móvil (`RaiseSheet`), que es un componente aparte. Motivación en `proposal.md` — Why.

## Goals / Non-Goals

**Goals:**

- Ampliar el ancho del panel anclado en pantallas ≥768px para dar más espacio horizontal al deslizador y a los atajos de apuesta.
- Mantener sin cambios el contenido, el orden, el tamaño de los controles/textos y el comportamiento.

**Non-Goals:**

- No escalar tipografía, atajos, deslizador ni botón de confirmar.
- No modificar la hoja de subida de móvil ni la lógica de apuesta.

## Decisions

- Ajustar únicamente las utilidades de ancho del contenedor del panel anclado (subir sus límites `min-w`/`max-w`), en lugar de introducir un prop de tamaño o un condicional por breakpoint. El panel solo se usa en el layout ancho y la hoja de móvil es otro componente, así que no hace falta condicionar por ancho. Alternativa considerada: pasar un prop `size`/`wide` desde `ActionButtons`; se descarta por innecesaria (un único consumidor en un único contexto).
- Dejar `RaiseControls` intacto y sin props nuevas, para no bifurcar el contenido compartido con la hoja. El ancho lo controla solo el contenedor.
- Reutilización: se reutilizan tal cual `RaiseControls`, `Button`, `ChipIcon` y `SegmentedControl`; no se extrae ni se introduce ningún componente de `src/components/` ni helper de `src/utils/`. No hay markup ni lógica repetida que quede sin extraer: el único cambio son utilidades de ancho en el JSX existente.

## Risks / Trade-offs

- El panel podría desbordar la mesa en anchos intermedios (tablet vertical) → acotar el `max-w` y comprobar el anclaje `right-0` a 768px.
- Como se ancla a la derecha, un panel más ancho crece hacia la izquierda y podría tapar contenido de la mesa → verificación visual en desktop y tablet.
