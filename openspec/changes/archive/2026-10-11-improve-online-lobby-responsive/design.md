# Design

## Context

Ver `proposal.md` — Why. La pantalla `/online` vive en `src/screens/Online.tsx` y hoy decide su maquetación con tres banderas de `useMediaQuery` (`src/hooks/useMediaQuery.ts`):

- `isMobile` (`max-width: 767px`) → rama móvil (una columna) frente a rama de escritorio (dos columnas).
- `isTiny` (`max-width: 299px`).
- `isShort` (`max-height: 720px`).
- `dense = isMobile && (isTiny || isShort)` → compacta paneles, avatares, campos de código, espaciados y titular.

El problema es que `dense` queda **desactivado fuera de anchos de móvil**, así que una ventana baja en tablet/escritorio (o un móvil en horizontal, con ancho ≥768px) mantiene los espaciados y el padding de escritorio. Además `isTiny` solo cubre <300px, dejando fuera anchos de 300–359px. `src/screens/Local.tsx` ya usa `dense = isTiny || isShort` sin la puerta de `isMobile`, lo que confirma que el patrón es más tolerante.

Los componentes de presentación ya aceptan compactado: `Panel` (`compact`), `SelectableCard` (`size`, `dense`, `stacked`, `stretch`), `PersonCard` (`compact`, `avatarSize`), `ScreenTitle`, `PageHeader`, `Button` y `CtaButton` (`compact`). No hace falta crear primitivas nuevas.

## Goals / Non-Goals

**Goals:**

- Que la compactación de `/online` dependa de la **altura** y de la **anchura** disponibles, con independencia del breakpoint de columnas, de modo que ventanas bajas también se compacten aunque tengan ancho de escritorio.
- Ampliar la cobertura de anchos muy estrechos (móviles pequeños ~320px) para evitar desbordes horizontales.
- Mantener las pantallas amplias y altas igual que hasta ahora.

**Non-Goals:**

- Cambiar flujos, estado, red o textos del lobby (crear/unirse/código/QR/inicio/confirmaciones).
- Extraer un hook compartido con `Local.tsx` u otras pantallas (ver Decisión 4).
- Convertir el layout de dos columnas en una columna por altura: en ventanas amplias y bajas se mantienen las dos columnas (aprovechan mejor el ancho) y se compacta su contenido.

## Decisions

### 1. Una única bandera `compact` no ligada a `isMobile`

Se sustituye la actual `dense` por `compact` derivada solo de la vista:

- `isShort` = `(max-height: 720px)` (se mantiene).
- `isNarrow` = `(max-width: 359px)` (antes `isTiny` a 299px; se ensancha para cubrir móviles pequeños).
- `compact = isShort || isNarrow` (sin la puerta `isMobile`).

`isMobile` se conserva **solo** para elegir entre rama de una columna (móvil) y de dos columnas (escritorio). `compact` se aplica en ambas ramas: en la móvil como hoy, y en la de escritorio para reducir padding vertical (`pt`/`pb`), separación de columnas (`gap-8` → `gap-6`), titular, paneles y tamaños de avatar.

**Alternativas consideradas:**

- Mantener `dense` ligada a `isMobile` y añadir una segunda bandera para escritorio: duplica conceptos y complica la lectura; una sola bandera expresa mejor "ventana pequeña, compáctalo".
- Bajar `isMobile` a un breakpoint mayor para que las ventanas bajas caigan en la rama móvil: empeora el aprovechamiento del ancho (una columna) en móviles en horizontal y tablets.

### 2. Uso de las props de compactado existentes

- `Panel` recibe `compact`; el panel de sala ajusta sus overrides `sm:gap-5! sm:p-7!` para que, en modo compacto, también manden los valores compactos en escritorio.
- `SelectableCard`: `size` sigue siendo `isMobile ? 'sm' : 'lg'`; `dense` y `stacked` pasan a `compact` (el `stretch={!isMobile}` se mantiene).
- `PersonCard`: `compact={compact}` y `avatarSize={compact ? 32 : 36}`.
- Campos del código y tamaños de titular: eligen su variante compacta con `compact` en vez de `dense`, e `isNarrow` reemplaza a `isTiny` para el titular.

### 3. Ventana amplia y baja: dos columnas compactadas

En la rama de escritorio, con `compact` se reducen titulares y paddings y la zona central mantiene `overflow-y-auto`, de modo que las acciones principales quedan visibles o alcanzables sin recortarse. No se colapsa a una columna porque dos columnas usan mejor la anchura disponible en horizontal.

### 4. Overlay del QR apto para ventanas bajas

La verificación en ventanas amplias y bajas (812×375) reveló que el diálogo del QR de invitación, al centrarse en pantallas `sm`+ y medir más que el alto disponible, quedaba recortado (sin poder alcanzar su botón de cierre). Como `QrDialog` lo usa solo la pantalla `/online`, se le añade `max-h-full overflow-y-auto` a su panel: el contenido se acota a la ventana y se desplaza si no cabe, sin tocar el `Modal` compartido (que también usa `Local`, fuera de alcance) y sin afectar a pantallas altas. Es la corrección mínima que mantiene el alcance «solo `/online`».

### 5. Sin extraer un hook compartido con `Local.tsx`

`Local.tsx` ya define `isTiny`/`isShort`/`dense` inline. No se extrae un `src/hooks/...` común en este change por dos motivos: (a) el alcance acordado es solo `/online`; (b) compartir el hook obligaría a unificar umbrales (p. ej. `isNarrow` a 359px) y alteraría la maquetación de `Local`, fuera de alcance. La derivación queda como dos banderas locales en `Online.tsx`, sin variables repetidas dentro de la pantalla. Se deja como candidato de seguimiento para la auditoría de reutilización (`docs/code-reuse-audit.md`).

**Justificación de lo que no se extrae:** no se repite markup ni lógica dentro de `Online.tsx` (una sola definición de `compact`); las tarjetas, paneles y filas ya son componentes reutilizados. El único patrón que cruza pantallas (`isTiny`/`isShort`) es preexistente y no se multiplica con este cambio.

## Risks / Trade-offs

- **Compactar la rama de escritorio en alturas ≤720px puede apretar en monitores pequeños** → la compactación solo reduce padding, gaps y titular; no cambia estructura ni oculta contenido, y la zona central sigue pudiendo desplazarse.
- **`max-height: 720px` puede activarse con el teclado abierto en móvil** → compactar mientras se escribe el nombre/código es benigno y evita saltos de scroll.
- **Cambiar `isTiny`(299) por `isNarrow`(359) afecta al titular y a los campos de código en anchos 300–359px** → es el objetivo (evitar recortes en móviles pequeños); se valida a 320px.
- **Móviles en horizontal pasan por la rama de escritorio con `compact`** → los overlays (QR y confirmación) y el panel de sala deben seguir cabiendo; se validan en esas medidas. El diálogo de confirmación ya cabía; el del QR se ajustó con altura acotada y scroll (ver Decisión 4).

## Migration Plan

Cambio de una sola pantalla (`src/screens/Online.tsx`), sin datos ni dependencias. Despliegue con el build habitual; rollback = revertir el archivo.

## Open Questions

Ninguna que cambie specs, enfoque o tareas. Los umbrales concretos (`359px`, `720px`) quedan fijados como decisión de diseño y se ajustan solo con la verificación visual.
