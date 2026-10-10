# Proposal

## Why

Al arrancar el modo desarrollo (`npm run dev` / `dev:all`), Vite avisa tres veces de que se están
pidiendo fuentes en `/public/fonts/...` y recomienda usar `/fonts/...`. El origen es
`src/styles/fonts.css`, que importa con `@import url("/fonts/inter.css")` y
`@import url("/fonts/satoshi.css")` dos hojas alojadas en `public/`; al procesarlas, Vite reescribe
las URL relativas `./X.ttf` de esas hojas como `/public/fonts/X.ttf`, y el navegador pide una ruta
que no es la canónica. En el build de producción, además, las fuentes se duplican: la copia pública
en `dist/fonts/` y una copia con hash en `dist/assets/`.

## What Changes

- Las declaraciones `@font-face` de Inter y Satoshi pasan a vivir en `src/styles/fonts.css`,
  referenciando los `.ttf` con la ruta pública canónica `/fonts/...`.
- Se eliminan `public/fonts/inter.css` y `public/fonts/satoshi.css`, que solo usaba
  `src/styles/fonts.css`.
- Se conserva el `@import` de Google Fonts (Urbanist), las familias y alias (`Satoshi Variable`,
  `Satoshi`) y los rangos de peso/estilo.
- **Sin cambios de comportamiento**: mismas fuentes, pesos, estilos y `font-display: swap`; el
  aspecto no cambia.
- Efecto: desaparece el aviso de Vite y el build deja de emitir copias con hash duplicadas de los
  `.ttf`.

## Capabilities

### New Capabilities

<!-- Ninguna. -->

### Modified Capabilities

<!-- Ninguna: es una corrección de rutas de assets/estilos sin cambio de comportamiento observable. -->

Este change declara `skip_specs: true` en su `.openspec.yaml`: solo corrige cómo se referencian los
assets de fuente (configuración de estilos/build), sin alterar ningún requisito de comportamiento
del sistema.

## Impact

- Estilos: `src/styles/fonts.css` (recibe las declaraciones `@font-face` con rutas `/fonts/...`).
- Eliminación: `public/fonts/inter.css`, `public/fonts/satoshi.css`.
- Se conservan en `public/fonts/` los cuatro `.ttf`, que siguen sirviéndose en `/fonts/...`.
- Reutilización: no toca código de la app (React); no se reutiliza ni extrae ningún componente de
  `src/components/` ni helper de `src/utils/`.
- Sin cambios en i18n, red, tokens, dependencias, Android ni despliegue.
