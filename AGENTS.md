# Just Poker — Guía de Estilos y Convenciones

## Regla de oro

La maquetación se hace **siempre** con utilidades nativas de Tailwind, aplicadas directamente en el JSX.

- **Nada custom:** no se crean clases CSS propias, ni `@utility`, ni `@apply`, ni bloques de "componentes" en CSS.
- **Estilos coherentes:** reutiliza las mismas recetas de utilidades en toda la app (mismas fuentes, tamaños, espaciados y colores).
- Si un patrón se repite mucho, extrae un **componente React** en `src/components/` con utilidades nativas, no una clase CSS.

## Stack de estilos

Tailwind CSS v4 (configuración CSS-first, sin `tailwind.config.js`).

- Plugin de Vite: `@tailwindcss/vite` (ver `vite.config.ts`).
- Único entry point: `src/styles/index.css` (`@import "tailwindcss"`).
- Fuentes: `src/styles/fonts.css`.
- `index.css` solo contiene: `@theme` (tokens) y `@layer base` (resets de `html`/`body`). **Sin utilidades ni clases propias.**
- **No existe `app.css` ni `tokens.css`.**

## Design Tokens (`@theme`)

Los tokens viven en el bloque `@theme` de `index.css` y Tailwind los expone como utilidades. **No uses valores crudos** para colores, fuentes ni radios.

### Colores (utilidades `*-<token>`)

| Token | Valor | Utilidad ejemplo |
|-------|-------|------------------|
| `--color-bone` | `rgb(205 197 183)` | `text-bone`, `bg-bone`, `border-bone/40` |
| `--color-bone-100/200/700` | variantes | `text-bone-700` |
| `--color-ink` | `rgb(34 32 31)` | `bg-ink`, `text-ink` |
| `--color-ink-100/200/900/alt` | variantes | `bg-ink-200`, `bg-ink-900/85` |
| `--color-bg` / `--color-fg` | semánticos | `bg-bg`, `text-fg` |
| `--color-border` | `rgba(255,255,255,.10)` | `border-border` |
| `--color-danger` | `rgb(232 115 74)` | `text-danger`, `bg-danger/20` |
| `--color-info` | `rgb(91 138 240)` | `text-info`, `bg-info/15` |
| `--color-success` | `rgb(143 206 143)` | `text-success` |

Para opacidad usa el modificador `/`: `bg-bone/10`, `border-bone/[0.18]`, `bg-ink-900/85`. **No escribas `rgba(205,197,183,…)` ni `#fff` inline**; usa `bone` con `/`.

### Tipografía

Fuentes: `font-display`, `font-body`, `font-ui`.

Escala de tamaños (utilidades `text-fs-*`): `fs-100` 10px, `fs-200` 12px, `fs-300` 14px, `fs-400` 16px, `fs-500` 20px, `fs-600` 24px, `fs-700` 32px, `fs-800` 48px, `fs-900` 96px.

**Recetas tipográficas** (copia estas cadenas tal cual; no son clases, son combinaciones de utilidades nativas):

| Rol | Utilidades |
|-----|-----------|
| Eyebrow | `font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65` |
| Título (h1) | `font-display font-bold leading-[0.94] tracking-[-0.015em]` |
| Subtítulo (h2) | `font-display font-bold leading-none tracking-[-0.01em]` |
| Encabezado (h3) | `font-display font-bold leading-none` |
| Label | `font-display font-bold text-fs-100 tracking-[0.14em] uppercase` |
| Cuerpo | `font-body leading-[1.45]` |
| Caption | `font-body text-fs-100 tracking-[0.04em] opacity-70` |
| Flecha | `font-display font-bold leading-none` |
| Marca "Just Poker" | `font-display font-bold text-fs-400 uppercase tracking-[0.08em]` + `<em className="font-light italic tracking-normal">` |

Combina el rol con su tamaño cuando no sea el por defecto:

```tsx
<div className="font-display font-bold leading-none tracking-[-0.01em] text-fs-700">Tres mesas.</div>
<div className="font-body text-[10px] tracking-[0.04em] opacity-70">texto fino</div>
```

### Espaciado

Escala por defecto de Tailwind (`--spacing: 0.25rem`): `gap-1` 4px, `gap-2` 8px, `gap-3` 12px, `gap-4` 16px, `gap-5` 20px, `gap-6` 24px, `gap-8` 32px, `gap-12` 48px, `gap-32` 128px. También valores dinámicos: `pt-15`, `size-13`, `w-15`, `min-w-40`, etc.

### Radios y motion

- Radios: `rounded-screen`, `rounded-card`, `rounded-slot`, `rounded-pill`, `rounded-[14px]`.
- Easing: `ease-brand`, `ease-out-brand`.
- Animaciones: `animate-jp-pulse`, `animate-timer-drain`, `animate-lobby-pulse`.
- Z-index dinámicos: `z-100`, `z-200`, `z-300`.

## Componentes reutilizables (React)

Prefiere estos componentes antes de replicar utilidades:

| Componente | Props clave |
|------------|-------------|
| `Button` | `variant` (`outline`/`primary`/`ghost`), `size` (`sm`/`''`/`lg`), `block`, `glow` |
| `Avatar` | `name`, `size` (24–120), `ring`, `muted` |
| `PokerCard` | `rank`, `suit`, `size` (`xs`–`xxl`), `back`, `dimmed` |
| `Badge` | `variant` (`neutral`/`warning`/`info`/`turn`) |
| `RankBadge`, `RankBlock`, `ProgressDots`, `TopBar` | ver `src/components/` |

## Layout

Utilidades nativas directamente en el JSX. Ya **no** existen `.row`, `.col`, `.gap-*`, `.center`, `.between`, `.muted`, `.faint`:

| Antes | Ahora |
|-------|-------|
| `.row` | `flex items-center` |
| `.col` | `flex flex-col` |
| `.center` | `flex items-center justify-center` |
| `.between` | `justify-between` |
| `.grow` | `flex-1` |
| `.muted` | `opacity-60` |
| `.faint` | `opacity-40` |

### Contenedor de pantalla

```tsx
<div className="relative flex h-screen w-full flex-col overflow-hidden bg-ink font-body text-fs-300 leading-[1.25] text-bone">
```

### Slot de jugador

```tsx
<div className="relative flex flex-col items-center gap-2.5 rounded-slot border border-bone/[0.18] px-5 py-[1.125rem]">
```

Estados con clases condicionales: `border-bone shadow-[…]` (activo), `opacity-[0.32]` (folded), `border-bone bg-bone/[0.06]` (winner).

## Reglas: utilidades vs inline styles

| Situación | Usar |
|-----------|------|
| Layout, espaciado, tipografía, colores | Utilidades Tailwind nativas |
| Estados (active, folded, winner, turn) | Clases condicionales en el JSX |
| Valores dinámicos (width %, opacity calculada, posiciones) | `style={{ … }}` |
| Patrón que se repite mucho | Componente React en `src/components/` |

### ✅ DO
- Usa solo utilidades nativas (`flex`, `gap-*`, `text-fs-*`, `bg-bone`, `tracking-[…]`, …).
- Usa tokens (`bone`, `ink`, `danger`, `text-fs-*`) en vez de valores crudos.
- Usa los componentes de `src/components/` para botones, badges, cartas, avatares y slots.
- Usa `style={{}}` solo para valores dinámicos.
- Repite las recetas tipográficas de esta guía para mantener coherencia.

### ❌ DON'T
- **No crees clases CSS propias** (`jp-*`, `brand`, etc.) ni uses `@utility`/`@apply`.
- No reintroduzcas `app.css` ni `tokens.css`.
- No uses `rgba(205,197,183,…)` ni `#fff` inline: usa `bone` con `/`.
- No uses `fontFamily`, `letterSpacing` ni `textTransform` inline: usa `font-display`/`font-body`, `tracking-[…]`, `uppercase`.
- No añadas estilos de componente en `index.css`; si se repite, haz un componente React.

## Tooling

- **Lint:** `npx oxlint src/`
- **Type check:** `npx tsc --noEmit`
- **Dev server:** `npm run dev`
- **Build:** `npm run build`
