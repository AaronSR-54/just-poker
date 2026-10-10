# Tasks

## 1. Fila compañera con contorno completo

- [x] 1.1 En `src/components/CtaCard.tsx`, con partida en curso mantener exactamente una fila rellena (la de continuar en reposo, la señalada al pasar el cursor) y dar contorno en los cuatro lados a la otra; verificar en el menú con dos partidas en curso que la unión es una sola línea en reposo y en hover.
- [x] 1.2 Mantener sin cambios la animación y la transición (`rowMotion`, `hover:translate-x-2`); verificar que la fila señalada se sigue desplazando a la derecha.

## 2. Limpieza

- [x] 2.1 Simplificar `src/screens/Menu.tsx`: el destacado de una tarjeta sin partida es `!onlineSession` (se elimina la comparación de fechas y el import `getLastPlayed`), porque con partida la fila de continuar se rellena siempre.
- [x] 2.2 Actualizar el comentario de `highlighted` en `CtaCard` (solo tarjetas sin partida).

## 3. Verificación

- [x] 3.1 Revisar la checklist de reutilización de `AGENTS.md`: solo se reutiliza `CtaCard`, sin introducir ni duplicar componentes, helpers, clases CSS propias ni valores crudos (tokens `bone`).
- [x] 3.2 Ejecutar `npx oxlint src/`, `npx tsc --noEmit` y `npm run build` y confirmar que pasan sin errores.
- [x] 3.3 Verificar visualmente con Playwright el reposo y el hover de las dos tarjetas (local y online) en las dos filas, comprobando que la compañera tiene contorno completo y que no hay doble línea ni huecos al desplazar.

## Workflow follow-up

- Archivar el change cuando se cumplan los requisitos de revisión del proyecto.
