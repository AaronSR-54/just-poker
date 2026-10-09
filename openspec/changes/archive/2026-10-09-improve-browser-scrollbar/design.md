# Design

## Context

Ver `proposal.md` — Why. Estado actual y restricciones que condicionan el enfoque:

- `src/styles/index.css` es el único entry de estilos: bloque `@theme` (tokens) y `@layer base` (resets de `html`/`body` + media queries). El `AGENTS.md` prohíbe clases CSS propias, `@utility` y `@apply`, y pide usar tokens en vez de valores crudos.
- Hoy no existe ninguna regla `scrollbar-*` ni `::-webkit-scrollbar` en el proyecto (búsqueda sin resultados).
- Hay 13 contenedores con `overflow-y-auto` repartidos por pantallas (`Menu`, `Local`, `Lobby`, `Profile`, `HandsGuide`, `MobileGameLayout`, `Online`) y superpuestos (`GameSettings`, `TutorialCoach`, `OnboardingCoach`). Todos viven sobre fondos `ink` (oscuros).
- `index.html` declara `theme-color #22201f` pero ningún `color-scheme`.
- Tailwind v4 (config CSS-first) emite cada token de `@theme` como custom property en `:root` (`--color-bone`, `--radius-pill`, …), reutilizable desde CSS nativo.

## Goals / Non-Goals

**Goals:**
- Scrollbar fina y temática en todos los contenedores desplazables, sin tocar JSX ni componentes.
- Cobertura multiplataforma: WebKit/Blink (Chrome/Edge/Safari) y Firefox.
- Controles nativos (selects, inputs, autofill, scrollbar por defecto) en esquema oscuro.
- Mantener la scrollbar usable (hit area suficiente) y sin saltos de layout.

**Non-Goals:**
- No cambiar el comportamiento de scroll (sin scroll suave, sin auto-ocultar, sin scrollbar siempre forzada en móvil).
- No introducir variantes por contenedor ni clases utilitarias propias; el estilo es global.
- No afectar al comportamiento de scroll de Android (Capacitor/WebView), que usa barras overlay transitorias.

## Decisions

### 1. Estilo global en `@layer base`, con tokens nuevos en `@theme`
La scrollbar no se puede expresar con utilidades Tailwind y el `AGENTS.md` veta clases propias. Por tanto, se añaden tres tokens al `@theme` (manteniendo la regla «usa tokens, no valores crudos») y las reglas de estilo van en `@layer base`, que es el único lugar admitido para estilos globales:

```
--color-scrollbar-thumb: rgb(205 197 183 / 0.30);
--color-scrollbar-thumb-hover: rgb(205 197 183 / 0.50);
--color-scrollbar-track: rgb(0 0 0 / 0);
```

Alternativas:
- `@utility`/clase propia para “área con scroll temática” → **rechazada**: viola el `AGENTS.md` y el requisito de que sea global.
- Componente React wrapper por contenedor → **rechazada**: obliga a tocar 13 sitios y añade un `div` envolvente que altera el layout.

### 2. Doble motor: propiedades estándar + pseudo-elementos WebKit
Se aplican **ambos** mecanismos, que no colisionan entre sí:

- Estándar (Firefox y Chrome 121+): `scrollbar-width: thin` y `scrollbar-color: <thumb> <track>`. Son propiedades **heredadas**, así que basta fijarlas en `html`.
- WebKit/Blink heredados (Safari y Chrome antiguos): `::-webkit-scrollbar`, `::-webkit-scrollbar-track`, `::-webkit-scrollbar-thumb`, `::-webkit-scrollbar-thumb:hover`, `::-webkit-scrollbar-corner`.

Como en Chrome moderno las propiedades estándar tienen prioridad sobre `::-webkit-scrollbar`, ambos caminos deben producir el mismo aspecto (mismo color de pulgar/pista y grosor fino) para no divergir entre versiones.

Alternativas:
- Solo `::-webkit-scrollbar` → **rechazada**: deja Firefox sin estilar.
- Librería JS (p. ej. OverlayScrollbars) → **rechazada**: dependencia nueva y reimplementa el scroll.

### 3. Pulgar tipo píldora con área de agarre cómoda
`::-webkit-scrollbar` fija `width`/`height` en ~10px (área de hit cómoda), y el pulgar se dibuja con `border: 2px solid transparent` + `background-clip: content-box` + `border-radius: var(--radius-pill)`, dejando un hueco visual de 2px respecto a la pista. La pista es transparente para que se vea el fondo `ink` del contenedor. En el camino estándar, `scrollbar-width: thin` da el grosor reducido equivalente.

### 4. `color-scheme: dark` a nivel raíz
En `@layer base`, `:root { color-scheme: dark; }`. Oscurece los controles nativos y la scrollbar por defecto en navegadores que no aplican las reglas anteriores, coherente con el tema. Es más amplio que la scrollbar (afecta a selects/inputs/autofill), decisión aprobada por el usuario.

## Risks / Trade-offs

- **Precedencia de Chrome sobre `::-webkit-scrollbar`** → mantener idénticos color y grosor en el camino estándar y el de pseudo-elementos; verificar en Chrome y Firefox.
- **Scrollbars overlay de macOS pasan a ser siempre visibles al estilarlas** → cambio de comportamiento esperado y aceptado («fina temática»); se documenta como efecto conocido.
- **`color-scheme: dark` afecta a todos los controles nativos, no solo a la scrollbar** → aprobado; comprobar legibilidad de selects/inputs en Ajustes y perfil.
- **Pulgar poco visible sobre superficies claras (`bone`)** → hoy ningún contenedor desplazable usa fondo `bone`; si se añade uno, revisar el token del pulgar.

## Open Questions

Ninguna.
