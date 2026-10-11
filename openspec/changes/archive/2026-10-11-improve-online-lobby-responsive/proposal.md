# Proposal

## Why

La pantalla `/online` (crear/unirse/lobby de juego con amigos) solo se compacta en móviles y con umbrales gruesos (`max-width: 299px`, `max-height: 720px`, aplicados solo por debajo de 768px de ancho). En pantallas cortas o pequeñas que no cumplen ese patrón —ventanas de poca altura en tablet/escritorio, móviles en horizontal, ventanas estrechas justo por encima de 768px— el contenido mantiene los espaciados y tipografías del layout de escritorio, de modo que las acciones principales (elegir modo, escribir el nombre/código, crear o unirse, iniciar la partida) quedan apretadas o fuera de la vista. La pantalla local (`src/screens/Local.tsx`) ya es más tolerante porque su `dense` no se limita a móvil; conviene alinear `/online`.

## What Changes

- Adaptar la pantalla `/online` a la **altura** del viewport: en pantallas bajas se compactan espaciados, tipografía, avatares y tarjetas, de modo que el flujo principal permanezca visible y las acciones primarias no queden recortadas.
- Adaptar la pantalla `/online` a la **anchura** del viewport: en pantallas muy estrechas nada desborda en horizontal (título, tarjetas de modo, campos de código, tarjetas de jugador y botones caben completos).
- Ampliar/afinar los puntos de corte actuales para cubrir de forma fiable las pantallas cortas y pequeñas reales (móviles pequeños ~320px de ancho, móviles y ventanas de poca altura), en lugar de depender de un único umbral y de estar atados a `max-width: 767px`.
- Mantener el comportamiento en pantallas amplias y altas sin cambios visuales perceptibles.
- No se altera el comportamiento funcional del lobby (crear/unirse/código/QR/inicio/confirmaciones); solo su presentación responsive.

## Capabilities

### New Capabilities
<!-- Ninguna: la adaptación responsive es un requisito de comportamiento de una capacidad existente. -->

### Modified Capabilities
- `online-lobby`: se añaden requisitos de adaptación de la maquetación a pantallas cortas (poca altura) y pequeñas (poca anchura), garantizando que las acciones principales del flujo sigan visibles y sin desbordes horizontales, con un layout de una columna en anchos de móvil y dos columnas en anchos amplios.

## Impact

- **App (SPA):** `src/screens/Online.tsx` (selección de puntos de corte y aplicación del modo compacto a layout móvil y de escritorio) y `src/components/QrDialog.tsx` (el diálogo de QR de invitación, exclusivo de `/online`, pasa a tener altura acotada y desplazamiento interno para caber en ventanas bajas). No cambian flujos, eventos de red ni lógica de sala.
- **Reutilización:** se reutilizan los componentes existentes `Panel` (`compact`), `SelectableCard` (`size`/`dense`/`stacked`), `PersonCard` (`compact`/`avatarSize`), `ScreenTitle`, `PageHeader`, `Button` y `CtaButton` con sus props de compactado ya disponibles; no se crean primitivas nuevas ni clases CSS. Si el mismo ajuste compacto se repite en varios puntos, se centraliza en la pantalla, sin duplicar variables de corte ya existentes (`useMediaQuery`).
- **Tokens y estilo:** se siguen usando utilidades nativas y tokens (`text-fs-*`, `gap-*`, `rounded-*`, `bone`, `ink`); no se introducen valores crudos.
- **i18n:** sin claves nuevas; no hay texto nuevo visible.
- **Dependencias:** ninguna nueva.
