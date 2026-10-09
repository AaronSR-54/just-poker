# Tasks

## 1. Corregir la animación de los asientos

- [x] 1.1 En `src/screens/Game/layout/DesktopGameLayout.tsx`, cambiar la prop `layout` por `layout="position"` en el `motion.div` que envuelve cada rival y verificar que la entrada, salida y el reordenado al eliminar un rival siguen animándose.
- [x] 1.2 En `src/screens/Game/layout/MobileGameLayout.tsx`, aplicar el mismo cambio (`layout="position"`) en el `motion.div` de cada rival y verificar el mismo comportamiento.

## 2. Estabilizar la altura del showdown

- [x] 2.1 En `src/screens/Game/layout/DesktopGameLayout.tsx`, reservar la altura del bloque de showdown también cuando `showdown` es `false` (variante `min-h-[7.1875rem]` / `min-h-[3.75rem]` en `isShort`), de forma que la aparición/desaparición no cambie la altura del asiento.
- [x] 2.2 Confirmar que en `MobileGameLayout.tsx` el bloque ya reserva `min-h-[5.5rem]` de forma incondicional y no requiere cambios.

## 3. Verificación

- [x] 3.1 Pasar type check con `npx tsc --noEmit` sin errores.
- [x] 3.2 Pasar lint con `npx oxlint src/` sin errores.
- [x] 3.3 Ejecutar `npm run build` y confirmar que compila.
- [x] 3.4 Comprobar en escritorio y móvil (viewports ancho y estrecho) que al entrar en showdown y al pulsar «Nueva mano» los asientos de los rivales y sus cartas no se estiran en vertical; verificación visual en `npm run dev`.

## Workflow follow-up

- Archivar el cambio cuando la revisión esté satisfecha.
