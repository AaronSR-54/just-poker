# Design

## Context

Ver `proposal.md - Why`. Estado actual relevante:

- `src/main.tsx` importa `./styles/fonts.css`, que a su vez hace
  `@import url("/fonts/inter.css")` y `@import url("/fonts/satoshi.css")`.
- Esas dos hojas viven en `public/fonts/` y declaran los `@font-face` con rutas **relativas**
  (`./Inter-VariableFont_opsz_wght.ttf`, `./Satoshi-Variable.ttf`, etc.).
- Al transformar `src/styles/fonts.css`, Vite resuelve el `@import` contra `public/fonts/` e
  **inlinea** el contenido reescribiendo las URL relativas a `/public/fonts/X.ttf`. El CSS servido
  en dev y el bundle de producción acaban apuntando a esa ruta no canónica.
- Solo `src/styles/fonts.css` referencia `public/fonts/inter.css` y `public/fonts/satoshi.css`
  (verificado con búsqueda en el repo). Los `.ttf` de `public/fonts/` se sirven en `/fonts/...` y
  también los usa `scripts/generate-store-assets.mjs` (vía fontconfig, no vía las hojas CSS).

## Goals / Non-Goals

**Goals:**
- Eliminar el aviso de Vite sobre `/public/fonts/...` y dejar de emitir copias con hash duplicadas
  de los `.ttf` en `dist/assets/`.
- Mantener exactamente las mismas familias, alias, pesos, estilos y `font-display` para que el
  aspecto no cambie.
- Dejar una única definición de los `@font-face` en el stylesheet de la app.

**Non-Goals:**
- Mover los `.ttf` fuera de `public/` ni cambiar el layout de assets de Capacitor.
- Tocar `scripts/generate-store-assets.mjs`, el tema de Tailwind o el `@import` de Google Fonts.
- Cambiar dependencias.

## Decisions

### 1. Consolidar los `@font-face` en `src/styles/fonts.css` con rutas `/fonts/...`

Las declaraciones de Inter y Satoshi se mueven a `src/styles/fonts.css`, referenciando los archivos
con la ruta pública canónica (`url("/fonts/Inter-VariableFont_opsz_wght.ttf")`, etc.). Se conservan
las dos familias de Satoshi (`Satoshi Variable` y el alias `Satoshi`) y el `@import` de Google Fonts
(Urbanist).

Las URL que empiezan por `/` se tratan como assets públicos y **no** se reescriben, así que
desaparece tanto el prefijo `/public/` como la emisión de copias con hash. Al dejar de importar
CSS desde `public/`, Vite ya no inlinea hojas ajenas a `src/`.

*Alternativas consideradas:*
- **Cambiar `./X.ttf` por `/fonts/X.ttf` dentro de `public/fonts/*.css` y mantener el `@import`**:
  arregla el aviso, pero conserva el patrón de importar CSS desde `public/` y mantiene dos hojas de
  fuentes fuera de `src/`; se descarta por no unificar la definición.
- **Mover los `.ttf` a `src/assets/` y dejar que Vite los empaquete con hash**: es lo más idiomático
  para bundling, pero mueve 4 archivos grandes, rompe la ruta que usa
  `scripts/generate-store-assets.mjs` y altera el layout de assets de Capacitor; se descarta para
  no ampliar el alcance.
- **Cargar `public/fonts/*.css` con `<link>` en `index.html` y quitar el `@import`**: funcionaría
  (el navegador resuelve `./X.ttf` relativo a `/fonts/`), pero añade peticiones render-blocking
  separadas y separa las fuentes del resto de estilos; se descarta.

### 2. Conservar los `.ttf` en `public/fonts/`

Los cuatro archivos se quedan donde están y se sirven en `/fonts/...`. Es la ruta que Vite espera
para un asset público y la que ya usan otros assets (`/favicon.svg`, `/assets/...`). No cambia el
empaquetado de Capacitor.

### 3. Eliminar `public/fonts/inter.css` y `public/fonts/satoshi.css`

Al centralizar las declaraciones en `src/styles/fonts.css`, esas dos hojas quedan sin uso. Se
eliminan para no dejar archivos muertos ni mantener dos fuentes de verdad para los `@font-face`.

## Risks / Trade-offs

- [Perder el alias `Satoshi` o un rango de peso al mover las declaraciones] → Copiar literalmente
  las cuatro reglas de cada familia (`Satoshi Variable` normal/itálica y alias `Satoshi`
  normal/itálica) con sus `font-weight: 300 900` y `100 900`, y verificar el render con las
  herramientas de fuentes del navegador.
- [La ruta absoluta `/fonts/...` no resuelve en Capacitor] → El contenido de `public/` se copia a la
  raíz de la app y ya se usan rutas absolutas para otros assets; se verifica en el APK que las
  fuentes cargan.
- [Queda alguna referencia externa a las hojas eliminadas] → Búsqueda en el repo confirmó que solo
  `src/styles/fonts.css` las referenciaba; se vuelve a comprobar antes de borrar.
- [Vite sigue reescribiendo la ruta] → Las URL públicas absolutas no se reescriben; se verifica que
  el log de `vite` no muestra el aviso y que `dist/assets/` ya no contiene `.ttf` con hash.

## Migration Plan

Cambio exclusivamente de assets/estilos, sin datos ni estado persistido. Rollback: restaurar
`src/styles/fonts.css` y recuperar `public/fonts/inter.css` y `public/fonts/satoshi.css` desde git.
