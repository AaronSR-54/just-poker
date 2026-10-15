# Design

## Context

Ver `proposal.md` — Why. La app maqueta con utilidades nativas de Tailwind en el JSX; el interlineado por defecto dentro de una pantalla es `leading-[1.25]` (`src/components/Screen.tsx`), pero muchos textos se marcan con `leading-none` o con `leading` numéricos fijos. `items-center` centra la **caja de línea** de cada ítem, no su línea base; por eso mezclar `leading-none` con bloques multilínea, o `items-start`/`items-end`/`items-baseline` con alturas de línea distintas, produce desalineaciones ópticas visibles. Además, `text-fs-100` crece de 10px a 13px en `md`, así que un `leading` fijo (p. ej. `leading-2` = 8px) queda por debajo del tamaño de fuente. El inventario completo de puntos detectados está en los hallazgos de la auditoría previa a este change.

## Goals / Non-Goals

**Goals:**
- Fijar una convención única y aplicarla en los puntos detectados:
  - Texto junto a icono/ficha/avatar/control/glifo → centrado por caja (`items-center`).
  - Texto junto a otro texto o número → línea base (`items-baseline`).
  - Ningún `leading` por debajo del tamaño de fuente.
- Coherencia móvil/escritorio (misma alineación en todos los anchos).
- Solo utilidades nativas; sin clases CSS nuevas.

**Non-Goals:**
- No se rediseñan pantallas ni se reordenan bloques.
- No se cambian textos, acciones, estados ni lógica.
- No se extrae ninguna primitiva nueva de «cantidad de fichas» ni de «etiqueta + número» (ver Decisión 4).
- No se revisan los puntos que la auditoría marcó como correctos (p. ej. `Button`, `PersonCard`, `SegmentedControl`, `ChipStackRow` inline).

## Decisions

### 1. Convención de alineación: caja vs línea base
- **Texto + elemento con caja propia** (icono, ficha, avatar, control, glifo): `items-center`. Centra las cajas y evita que la diferencia de tamaño entre icono y texto descuadre la fila.
- **Texto + texto/número**: `items-baseline`. Comparten línea base y se leen como una sola línea tipográfica, aunque difieran en tamaño.

Alternativa considerada: usar `items-center` en todo. Descartada porque centrar dos textos de distinto tamaño alinea sus centros, no sus líneas base, y se lee peor (p. ej. etiqueta pequeña frente a importe grande).

### 2. Cabecera de página: línea base, no `items-start`
`PageHeader` (`src/components/PageHeader.tsx:25`) usa `items-start`, así que el `BackButton` (`src/components/BackButton.tsx:18`, flecha `leading-none`) queda alineado al borde superior de la caja del `Wordmark`, que es un stack de dos líneas con `leading-[0.86]` (los glifos se salen de la caja). Se cambia el contenedor por defecto a `items-baseline`: la baseline del `Wordmark` (contenedor `flex flex-col`) es la de su primera línea («Just»), de modo que la flecha se apoya en la misma línea base que la primera línea del wordmark, de forma robusta y sin números mágicos. Se actualizan las cuatro sobreescrituras de `className` que hoy fijan `items-start` (`src/screens/Local.tsx:195`, `src/screens/Online.tsx:744`, `src/screens/HandsGuide.tsx:170` y `:205`) a `items-baseline`.

Alternativas consideradas:
- `items-center`: centra la flecha respecto a las dos líneas del wordmark, no respecto a la primera. Descartada.
- Envolver el `BackButton` en un contenedor con altura de la primera línea: requiere duplicar métricas del wordmark (`text-[0.85em]`, `leading-[0.86]`). Descartada.

### 3. Tarjetas de modo: centrar la flecha, no anclarla abajo
En `CtaCard` (`src/components/CtaCard.tsx:116` y `:149`) la fila usa `items-end` con texto de `leading-[1.45]` y flecha `leading-none` de mayor tamaño; el espacio de descendente de la flecha la deja leída alta. Se cambia a `items-center`, que centra la flecha respecto al bloque de texto tanto si es una línea (descripción) como dos (estado + contexto).

Alternativas consideradas:
- `items-baseline`: con un bloque de dos líneas la baseline de un ítem flex es la de su **primera** línea, así que la flecha se alinearía con «estado» y quedaría descolgada respecto al conjunto. Descartada.
- `items-end` + `translate-y`: nudge frágil dependiente de la fuente. Descartada.

### 4. Asientos: unificar nombre + ficha y corregir el alias
En `RivalSlot` (`src/screens/Game/components/RivalSlot.tsx`):
- Fila nombre + ficha (`:108`) usa `items-baseline`, pero el nombre tiene `truncate` (`overflow: hidden`), y un ítem flex con overflow no visible **sintetiza** su baseline desde el borde inferior, no desde el texto: la ficha se descuadra. Se cambia a `items-center`, que es lo que ya usa `HumanSeat` (`:51`), unificando la convención.
- Alias (`:119`): `leading-3 sm:leading-2 md:leading-4` es no monótono y `sm:leading-2` (8px) queda por debajo de `text-fs-100` (10px), con riesgo de recorte. Se sustituye por un único `leading-[1.1]` (proporcional, nunca menor que la fuente, deja sitio a los descendentes de la itálica).
- En `HumanSeat` (`:52`) el nombre en móvil no lleva `leading-none` mientras el de escritorio sí; se añade `leading-none` a la rama móvil para que la alineación con `PositionChip` no cambie de breakpoint.

Alternativa considerada para el nombre + ficha: mover `truncate` a un `<span>` interno dentro de un ítem flex sin recorte y mantener `items-baseline`. Descartada por más markup para el mismo resultado; `items-center` ya es la convención del asiento propio.

### 5. Interlineado seguro en etiquetas grandes
En `SelectableCard` (`src/components/SelectableCard.tsx:82`) la etiqueta usa `leading-none` y puede llegar a `2.75rem`; si la etiqueta ocupa dos líneas, se solapan. Se cambia a `leading-[1.05]`, suficiente para separar líneas sin alterar el aspecto de una sola línea.

### 6. Pares etiqueta + valor sobre línea base
- `SettingSlider` (`src/components/SettingSlider.tsx:15`): `items-center` → `items-baseline` para el nombre del ajuste y su valor.
- `GameOverOverlay` (`src/screens/Game/components/GameOverOverlay.tsx:54`): `items-center` → `items-baseline` para el puesto y el nombre en la clasificación.

### 7. Bote: etiqueta y número en línea base, ficha centrada
En `CommunityRow` (`src/screens/Game/components/CommunityRow.tsx:74-88`) la fila es `items-center` y mezcla etiqueta (`text-fs-200`) con el grupo ficha + número (`text-fs-300`), que quedan centrados por caja. Para cumplir la convención texto+texto sin descuadrar la ficha, se reestructura la fila a `items-baseline` con la etiqueta y el número como hermanos en la línea base, y la ficha en un `span` con `self-center`. Así la etiqueta y el importe comparten baseline y la ficha sigue centrada.

Alternativa considerada: dejar la fila en `items-center`. Descartada porque la petición pide que la etiqueta y el importe se lean en la misma línea.

### 8. Reutilización: sin componentes ni helpers nuevos
Todos los ajustes son cambios de utilidades sobre componentes existentes. Se reutilizan `Button`/`BackButton`, `Wordmark`, `PositionChip`, `ChipIcon`, `Badge` y `Avatar` tal cual; no se introduce ni se extrae ningún componente de `src/components/` ni helper de `src/utils/`.

**Markup/lógica que se repite y NO se extrae (justificación):** el patrón «ficha + número» aparece en `CommunityRow`, `ChipStackRow`, `GameOverOverlay` y `PotAward`, pero cada instancia lleva tamaño, color y contexto propios (bote atenuado, montón con color de ganador, overlay invertido, animación de reparto). Extraer una primitiva compartida excede este cambio y tocaría superficies ajenas; se reutiliza la primitiva real (`ChipIcon`) y se mantiene la micro-maquetación local, igual que en el change `raise-button-chip-symbol`. Queda como posible remediación futura en `docs/code-reuse-audit.md`. El par «etiqueta + valor» tampoco se extrae: son contextos distintos (bote en mesa, valor de ajuste, puesto en clasificación) sin una API común.

## Risks / Trade-offs

- **Cambiar `items-start` a `items-baseline` en `PageHeader`** → si algún consumidor futuro añade un nodo sin baseline a la derecha, podría desplazarse. Mitigación: la primera línea del wordmark siempre define la baseline y el nodo opcional va dentro del cluster `items-end`.
- **`leading-[1.1]` en el alias** → ligeramente más alto que `leading-none`; puede variar un píxel el alto del asiento. Mitigación: es un cambio pequeño y mejora la legibilidad; se revisa en móvil y escritorio.
- **Reestructurar la fila del bote** → riesgo de alterar el layout del bote. Mitigación: es un cambio local de tres spans; se verifica en `npm run dev` que la ficha sigue centrada y el número no se mueve.
- **Regresión visual en breakpoints** → mitigación: revisar cada pantalla afectada en móvil y escritorio (tareas).

## Migration Plan

Solo frontend, sin migración de datos ni cambios de red. Despliegue con el build normal de la web/Android. Rollback: revertir el commit.
