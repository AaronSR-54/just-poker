# Tasks

## 1. Implementación

- [x] 1.1 En `src/screens/Local.tsx`, retirar `variant="outlineFill"` del `CtaButton` para que use la variante por defecto rellena (`primary`). Verificar que el CTA local se muestra relleno (fondo `bone`, texto `ink`) igual que los de Online y que su flecha, tamaño y estado deshabilitado no cambian.
- [x] 1.2 Actualizar `local.play` a «Empezar partida» en `src/i18n/locales/es/local.ts` y a «Start game» en `src/i18n/locales/en/local.ts`. Verificar que el CTA local muestra la nueva etiqueta en español y en inglés.
- [x] 1.3 Actualizar `online.joinAction` a «Unirse a partida» en `src/i18n/locales/es/online.ts` y a «Join game» en `src/i18n/locales/en/online.ts`. Verificar que el CTA de unirse muestra la nueva etiqueta en español y en inglés.

## 2. Verificación

- [x] 2.1 Revisar la checklist de reutilización de `AGENTS.md`: se reutilizan `CtaButton` y la variante `primary` del `Button` base, no se crean clases CSS propias ni utilidades `@apply`/`@utility`, todo el texto visible pasa por `t(...)` y no quedan markup, lógica ni helpers duplicados. Verificar por inspección de `src/screens/Local.tsx` y de los diccionarios de i18n tocados.
- [x] 2.2 Ejecutar `npx oxlint src/` y verificar que pasa sin errores.
- [x] 2.3 Ejecutar `npx tsc --noEmit` y verificar que pasa sin errores de tipos.
- [x] 2.4 Ejecutar `npm run build` y verificar que la compilación termina correctamente.

## Workflow follow-up

- Archivar el change (`/opsx-archive`) cuando la revisión del proyecto esté satisfecha.
