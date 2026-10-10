# Tasks

## 1. Implementación

- [x] 1.1 En `src/components/CtaButton.tsx`, retirar de la `className` la sobrescritura de radio `rounded-[14px]!` para que el botón herede la forma de píldora (`rounded-full`) del `Button` base. Verificar con `rg 'rounded-\[14px\]' src/components/CtaButton.tsx` que ya no aparece y que los tres CTA («Jugar» en `Local.tsx`, «Crear partida» y «Unirse» en `Online.tsx`) se renderizan con extremos totalmente redondeados, sin cambios en su flecha, tamaños compacto/completo, variante ni estado deshabilitado.
- [x] 1.2 Actualizar el comentario del componente en `src/components/CtaButton.tsx`, que hoy describe «esquinas `rounded-[14px]`», para que refleje la forma de píldora. Verificar que el comentario ya no menciona `rounded-[14px]`.

## 2. Verificación

- [x] 2.1 Revisar la checklist de reutilización de `AGENTS.md`: se reutiliza `CtaButton` y el `Button` base, no se crean clases CSS propias ni utilidades `@apply`/`@utility`, y no quedan markup, lógica ni helpers duplicados. Verificar por inspección de `src/components/CtaButton.tsx` y de sus usos en `src/screens/Local.tsx` y `src/screens/Online.tsx`.
- [x] 2.2 Ejecutar `npx oxlint src/` y verificar que pasa sin errores.
- [x] 2.3 Ejecutar `npx tsc --noEmit` y verificar que pasa sin errores de tipos.
- [x] 2.4 Ejecutar `npm run build` y verificar que la compilación termina correctamente.

## Workflow follow-up

- Archivar el change (`/opsx-archive`) cuando la revisión del proyecto esté satisfecha.
