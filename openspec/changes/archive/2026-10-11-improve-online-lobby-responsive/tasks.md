# Tasks

## 1. Banderas de layout y compactación común

- [x] 1.1 En `src/screens/Online.tsx`, sustituir `isTiny` (`max-width: 299px`) por `isNarrow` (`max-width: 359px`) y definir `compact = isShort || isNarrow` sin la puerta `isMobile` (mantener `isMobile` solo para elegir rama de columnas); verificar con `npx tsc --noEmit` y comprobando en el navegador que a 320px de ancho la vista entra en modo compacto.
- [x] 1.2 Pasar `compact` (en vez de `dense`) a los bloques compartidos por ambas ramas: `Panel` de crear/unirse/sala, `SelectableCard` (`dense`/`stacked`), `PersonCard` (`compact`/`avatarSize`), variante de los campos del código y tamaño del titular; verificar con `npx tsc --noEmit` que no quedan referencias a `dense` ni a `isTiny`.

## 2. Rama móvil (una columna)

- [x] 2.1 Aplicar `compact` a los espaciados y paddings de la rama móvil (padding del contenedor, gaps, `pt`/`pb`) y al tamaño del titular; verificar a 320×568 y en una ventana baja que no aparece desplazamiento horizontal, que las acciones principales (modo, nombre, código, crear/unirse) se ven sin recortes y que el modo no compacto a 767px de alto no cambia.
- [x] 2.2 Verificar que los cuatro campos del código caben y se pueden rellenar a 320px de ancho (sin desborde horizontal) y que las tarjetas de modo se apilan en una columna.

## 3. Rama de escritorio (dos columnas)

- [x] 3.1 Aplicar `compact` a la rama de escritorio: reducir `pt`/`pb`, separación de columnas (`gap-8`/`lg:gap-12`), titular y paneles; ajustar los overrides `sm:gap-5! sm:p-7!` del panel de sala para que en modo compacto manden los valores compactos también en escritorio; verificar con `npx tsc --noEmit`.
- [x] 3.2 Verificar en ventanas amplias y bajas (p. ej. 1024×600 y 812×375) que el selector de modo y el paso activo siguen en paralelo, que las acciones principales quedan visibles o alcanzables sin recortes, y que los overlays (QR y confirmación) caben; verificar además que a 1280×800 y 1440×900 la presentación no se compacta (sin cambios respecto a antes). — Resultado (Playwright): dos columnas y sin desborde horizontal a 812×375 y 1024×600; a 1280×800 y 1440×900 sin compactar; el diálogo de confirmación cabe en 812×375; el del QR se recortaba en ventanas bajas y se corrigió con `max-h-full overflow-y-auto` en `QrDialog` (ver Decision 4 del design); tabla de estados de sala con Start alcanzable tras scroll.

## 4. Verificación de reutilización y calidad

- [x] 4.1 Revisar la checklist de reutilización de `AGENTS.md`: confirmar que se reutilizan `Panel`, `SelectableCard`, `PersonCard`, `ScreenTitle`, `PageHeader`, `Button`/`CtaButton` sin recrear primitivas, que no se introduce markup ni lógica duplicada dentro de `Online.tsx` (una sola definición de `compact`) y que no hay textos visibles ni valores crudos nuevos; documentar el resultado en la descripción de la tarea. — Resultado: se reutilizan `Panel`, `SelectableCard`, `PersonCard`, `ScreenTitle`, `PageHeader` y `CtaButton` con sus props de compactado; `compact` se define una sola vez y `isNarrow`/`isShort` son las únicas banderas de corte; no se recrea ninguna primitiva; sin textos hardcodeados ni valores crudos nuevos (`text-[clamp(...)]` ya existía y usa rem/vw). `QrDialog` solo añade utilidades nativas (`max-h-full overflow-y-auto`) a su receta ya existente, sin clases CSS propias.
- [x] 4.2 Ejecutar `npx oxlint src/`, `npx tsc --noEmit` y `npm run build` sin errores y anotar el resultado. — Resultado: `oxlint` 0 avisos, `tsc` limpio, `vite build` correcto (aviso preexistente de tamaño de chunk).
- [x] 4.3 Recorrer la matriz visual final (320×568, 375×667, 812×375, 1024×600, 1280×800) en `/online` en los estados crear, unirse y sala, comprobando: sin desborde horizontal, acciones principales alcanzables y pantallas holgadas sin compactar. — Resultado (Playwright, 35/35 checks en crear/unirse + 15/15 en sala/overlays): sin desborde horizontal en todas las medidas; CTA de crear/unirse dentro del viewport; 4 campos de código completos a 320px; modo compacto activo en móviles pequeños y ventanas bajas y desactivado en 1280×800/1440×900; QR y confirmación caben.

## Workflow follow-up

- Archivar el change cuando se cumplan los requisitos de revisión del proyecto.
- Verificar el resultado archivado.
