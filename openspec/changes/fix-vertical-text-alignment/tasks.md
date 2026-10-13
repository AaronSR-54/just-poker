# Tasks

## 1. Cabecera de página

- [x] 1.1 Cambiar el contenedor por defecto de `src/components/PageHeader.tsx` de `items-start` a `items-baseline` y actualizar las sobreescrituras `items-start` de sus consumidores (`src/screens/Local.tsx`, `src/screens/Online.tsx`, `src/screens/HandsGuide.tsx` x2) a `items-baseline`; verificar en `npm run dev` que la flecha de volver se apoya en la misma línea base que la primera línea del wordmark en móvil y en escritorio.

## 2. Tarjetas

- [x] 2.1 En `src/components/CtaCard.tsx`, cambiar las dos filas con flecha (`items-end`) a `items-center`; verificar en `npm run dev` que la flecha queda centrada respecto al bloque de texto, tanto con una línea (descripción) como con dos (estado + contexto).
- [x] 2.2 En `src/components/SelectableCard.tsx`, cambiar el `leading-none` de la etiqueta por `leading-[1.05]`; verificar en `npm run dev` con una etiqueta de dos líneas (ventana estrecha) que las líneas no se solapan y que la de una sola línea no cambia de aspecto.

## 3. Mesa de juego

- [x] 3.1 En `src/screens/Game/components/RivalSlot.tsx`, cambiar la fila nombre + ficha de `items-baseline` a `items-center` y el alias de `leading-3 sm:leading-2 md:leading-4` a `leading-[1.1]`; verificar en `npm run dev` que la ficha queda centrada con el nombre y que el alias no se recorta en móvil, tablet y escritorio.
- [x] 3.2 En `src/screens/Game/components/HumanSeat.tsx`, añadir `leading-none` al nombre en la rama móvil; verificar en `npm run dev` que la relación vertical entre nombre y `PositionChip` es la misma en móvil y en escritorio.
- [x] 3.3 En `src/screens/Game/components/CommunityRow.tsx`, pasar la fila del bote a `items-baseline` con la etiqueta y el número como hermanos y la ficha en un `span` con `self-center`; verificar en `npm run dev` que etiqueta e importe comparten línea base y que la ficha sigue centrada.
- [x] 3.4 En `src/screens/Game/components/GameOverOverlay.tsx`, cambiar el grupo de puesto + nombre de `items-center` a `items-baseline`; verificar en `npm run dev` al terminar una partida que el puesto y el nombre se apoyan en la misma línea base.

## 4. Ajustes

- [x] 4.1 En `src/components/SettingSlider.tsx`, cambiar la fila del nombre y el valor de `items-center` a `items-baseline`; verificar en `npm run dev` (ajustes de partida) que el nombre y el valor comparten línea base.

## 5. Verificación

- [x] 5.1 Revisar la checklist de reutilización de `AGENTS.md`: `Button`/`BackButton`, `Wordmark`, `PositionChip`, `ChipIcon`, `Badge` y `Avatar` reutilizados; sin componentes ni helpers nuevos; sin clases CSS propias ni valores crudos; sin strings nuevos fuera de `t(...)`; sin duplicar markup/lógica más allá de lo justificado en `design.md`.
- [x] 5.2 Revisar en `npm run dev` cada pantalla afectada (Menú, preparación local, juego con amigos, guía de manos, mesa de juego, ajustes) en móvil y escritorio y confirmar que ningún texto se lee alto o bajo respecto a sus elementos colindantes y que no hay recortes ni solapes.
- [x] 5.3 Ejecutar `npx oxlint src/` y verificar que pasa sin errores.
- [x] 5.4 Ejecutar `npx tsc --noEmit` y verificar que pasa sin errores.
- [x] 5.5 Ejecutar `npm run build` y verificar que el build termina correctamente.

## Workflow follow-up

- Archivar el change tras satisfacer los requisitos de revisión del proyecto.
