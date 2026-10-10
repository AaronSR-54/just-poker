# Tasks

## 1. Igualar el ancho de las dos columnas en la preparación local

- [x] 1.1 En `src/screens/Local.tsx`, igualar el reparto de ancho de las dos columnas del layout de tablet/escritorio (hoy `flex-[48]` y `flex-[52]`) para que ambas midan lo mismo, sin tocar el layout móvil ni el contenido. Verificar en el navegador, a un ancho de escritorio y a uno de tablet (≥768 px), que la columna de selección y la de detalle miden lo mismo a lo ancho.
- [x] 1.2 Verificar que el ancho se mantiene igual al alternar entre las dificultades (I/II/III) y que el layout móvil (<768 px) sigue en una sola columna. Verificación observable en el navegador.
- [x] 1.3 En `src/components/PersonCard.tsx`, permitir que la descripción (`secondary`) haga wrap en lugar de recortarse con elipse (`truncate`), sin afectar a los usos sin `secondary` (p. ej. la lista de jugadores online). Verificar que las descripciones largas de la preparación local se ven completas en varias líneas.

## 2. Verificación de calidad y reutilización

- [x] 2.1 Ejecutar `npx oxlint src/` y `npx tsc --noEmit`; verificar que no hay errores.
- [x] 2.2 Ejecutar `npm run build`; verificar que el build termina correctamente.
- [x] 2.3 Revisar la checklist de reutilización de `AGENTS.md`: confirmar que se reutilizan los componentes existentes (`PageHeader`, `ScreenTitle`, `SelectableCard`, `Panel`, `PersonCard`, `CtaButton`, `ConfirmDialog`), que no se introducen ni extraen componentes/helpers y que no hay duplicación de JSX o lógica nueva.
- [x] 2.4 Verificar que no se añaden textos visibles (no hacen falta claves i18n nuevas) y que no se usan valores crudos ni utilidades en px: solo utilidades nativas de Tailwind y tokens.

## Workflow follow-up

- Archivar el change cuando la revisión del proyecto esté satisfecha.
- Verificar el resultado archivado.
