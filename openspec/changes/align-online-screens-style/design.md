# Design

## Context

Ver `proposal.md – Why`. Estado actual relevante:

- `src/screens/Local.tsx` y `src/screens/HandsGuide.tsx` comparten el patrón de pantalla "de contenido": shell `relative flex h-dvh … text-bone`, cabecera con `BackButton (←)` + `Wordmark` (definidos **localmente** en cada archivo, duplicados), título con `<em>` itálica, contenedor de escritorio `mx-auto max-w-[87.5rem] px-10 lg:px-20` (`pt-7`, `pb-…`, `gap-8 lg:gap-12`), móvil `px-[1.375rem] pt-8 pb-7`, y paneles `bg-ink-900 rounded-[14px]`.
- `src/screens/Online.tsx` y `src/screens/Lobby.tsx` usan `TopBar` (compartido con `Profile`), títulos planos, `px-[3.75rem] py-10` (hoy `px-[1.125rem] py-6` en lobby móvil), y bloques con radios/colores ad-hoc.
- Existe un `Wordmark` compartido en `src/components/Wordmark.tsx` (layouts `inline`/`stack`) que `Local`/`HandsGuide` **no** usan (tienen copias locales con diferencia menor: `pl-[0.4rem]` y `items-end`).
- `FadeIn`/`Stagger` (`src/components/Animated.tsx`) y las variantes de `src/animations/motion` son vocabulario compartido (los usa también `Profile`); no son deuda.
- `TopBar` (con `Wordmark inline`) seguirá siendo válido para `Profile`, fuera del alcance.

## Goals / Non-Goals

**Goals:**
- Que `Online` y `Lobby` se lean como el resto de la app (misma cabecera, título, contenedor, ritmo y paneles).
- Eliminar la duplicación preexistente de `BackButton`/`Wordmark` extrayendo componentes reutilizables.
- Cero cambios de comportamiento, navegación, red, i18n semántico o dependencias.

**Non-Goals:**
- Tocar la mesa online (`src/screens/Game/OnlineGame.tsx`) ni los layouts de partida.
- Cambiar `Profile` ni su uso de `TopBar`.
- Rediseñar `Menu`/`Hero`.
- Introducir animaciones nuevas o nuevas dependencias.

## Decisions

### 1. Extraer `BackButton` y una cabecera `PageHeader`

Hoy `BackButton` (ghost `Button` con `←`, `min-h-0! p-0! text-fs-500! leading-none! text-bone!`) y el `Wordmark` local están copiados en `Local.tsx` y `HandsGuide.tsx`. Se extrae:
- `src/components/BackButton.tsx`: botón `←` con `aria-label` por prop (Local usa `common.backToMenu`; HandsGuide, `common.back`).
- `src/components/PageHeader.tsx`: compone `BackButton` + `Wordmark` (layout `stack`, `items-end`) dentro del contenedor de cabecera; props `onBack`, `backLabel`, `right?`.

Alternativas descartadas: mantener `TopBar` en online (no coincide con `Local`); volver a copiar la cabecera (viola la norma de reutilización). `Profile` queda fuera y conserva `TopBar`.

### 2. Reutilizar el `Wordmark` compartido

`Local`/`HandsGuide` dejan de definir su `Wordmark` local y usan `src/components/Wordmark.tsx` (`layout="stack"`). El `PageHeader` centraliza el tamaño (p. ej. `text-fs-600` móvil / `text-fs-800` escritorio) por prop.

### 3. Título con la receta compartida

Se aplica `font-display font-bold leading-[…] tracking-[-0.015em]` + `<em className="font-light italic tracking-normal">` a los títulos de página fijos. Para poder marcar la palabra enfatizada, los títulos fijos del hub y el join se dividen en claves `…Em`/`…Rest` en `src/i18n/locales/{es,en}/online.ts` (texto equivalente; el tipo `Dict` obliga a cubrir ambas lenguas). El título dinámico del lobby (conectando/lleno/es perando) mantiene su texto y usa la misma receta sin `<em>`.

### 4. Contenedor y espaciado alineados

`Online`/`Lobby` adoptan el contenedor de `Local`/`HandsGuide`: escritorio `mx-auto max-w-[87.5rem] px-10 lg:px-20` con `pt-7` y `pb-…`; móvil `px-[1.375rem] pt-8 pb-7`. Se sustituye `px-[3.75rem] py-10`/`px-[1.125rem] py-6`.

### 5. Paneles y bloques

Código de sala, editor de nombre y caja de acciones se envuelven en paneles `bg-ink-900 rounded-[14px]` (como `TableDetail` de `Local`). Los slots de jugador conservan su semántica (ocupado `border-bone`/`border-bone/[0.18]`, vacío con borde discontinuo). El QR mantiene **fondo claro** (`bg-bone`) por legibilidad del escaneo: es un requisito funcional, no deuda de estilo.

### 6. Motion sin cambios de vocabulario

Se reutilizan `FadeIn`/`Stagger`/`StaggerItem` (`src/components/Animated.tsx`) y `src/animations/motion` tal cual; no se introducen variantes propias. La extracción de la cabecera no altera las transiciones existentes.

## Risks / Trade-offs

- [El QR debe seguir sobre fondo claro] → Se documenta como decisión funcional; no se "corrige" a `bg-ink-900`.
- [Extraer la cabecera puede perder atributos `data-tour` de onboarding] → `Online`/`Lobby` no tienen targets; en `Local`/`HandsGuide` se conservan (`data-tour` va en los elementos de contenido, no en la cabecera).
- [Añadir claves `…Em`/`…Rest` obliga a tocar es y en] → El tipo `Dict` (`en: Dict`) lo fuerza en compilación; `npx tsc --noEmit` lo verifica.
- [Quitar `TopBar` de online puede dejar sin "volver" en móvil] → La nueva cabecera `BackButton` está en móvil y escritorio; se verifica en ambos.
- [Dos patrones de cabecera coexistentes (`PageHeader` vs `TopBar`)] → Intencional: `TopBar` queda para `Profile`; se anota como Non-Goal.

## Migration Plan

Cambio de UI exclusivamente (clases + extracción de componentes + claves i18n equivalentes). Rollback: revertir el código; no hay migración de datos, red ni almacenamiento.
