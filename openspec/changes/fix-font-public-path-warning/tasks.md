# Tasks

## 1. Consolidar las declaraciones de fuente

- [x] 1.1 Mover a `src/styles/fonts.css` las reglas `@font-face` de Inter y de Satoshi (familia `Satoshi Variable` normal/itálica y alias `Satoshi` normal/itálica) usando rutas públicas canónicas `url("/fonts/…ttf")`, conservando pesos, estilos y `font-display: swap`, y mantener el `@import` de Google Fonts (Urbanist); verificar en las herramientas de fuentes del navegador que `font-display`/`font-body` siguen resolviendo a «Satoshi Variable» e «Inter» y que el aspecto no cambia.
- [x] 1.2 Eliminar `public/fonts/inter.css` y `public/fonts/satoshi.css` después de confirmar con una búsqueda en el repo que ninguna otra referencia los usa; verificar que no queda ninguna referencia rota a esas hojas.

## 2. Verificación de reutilización, calidad e integración

- [x] 2.1 Repasar la checklist de `AGENTS.md`: sin clases CSS propias ni valores crudos en el stylesheet, sin markup/lógica/helpers duplicados; confirmar que este cambio no introduce ni extrae componentes de `src/components/` ni helpers de `src/utils/` (no aplica) y anotar el resultado.
- [x] 2.2 Ejecutar `npx oxlint src/`, `npx tsc --noEmit` y `npm run build`; verificar que los tres terminan sin errores.
- [x] 2.3 Verificar el aviso: arrancar `vite` y confirmar que ya no aparece el aviso de `/public/fonts/...`; comprobar además que `dist/assets/` ya no contiene `.ttf` con hash duplicados y que las fuentes cargan en dev y en `npm run preview`.

## Workflow follow-up

- Archivar el change cuando el proyecto cumpla sus requisitos de revisión.
- Verificar el resultado archivado.
