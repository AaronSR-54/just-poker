# Tasks

## 1. Tokens y esquema de color oscuro

- [x] 1.1 Añadir al bloque `@theme` de `src/styles/index.css` los tokens `--color-scrollbar-thumb`, `--color-scrollbar-thumb-hover` y `--color-scrollbar-track`; verificar con `npm run build` que Tailwind compila sin errores.
- [x] 1.2 Declarar `:root { color-scheme: dark; }` dentro de `@layer base` en `src/styles/index.css`; verificar en Chrome con un `<select>`/input nativo (Ajustes) que se renderiza en esquema oscuro sin fondo blanco.

## 2. Estilo global de la scrollbar

- [x] 2.1 Añadir en `@layer base` de `src/styles/index.css` las propiedades estándar heredadas en `html` (`scrollbar-width: thin` y `scrollbar-color` con los tokens nuevos); verificar en Firefox que las pantallas con scroll (Guía de manos, Ajustes) muestran barra fina temática.
- [x] 2.2 Añadir en `@layer base` los pseudo-elementos `::-webkit-scrollbar`, `::-webkit-scrollbar-track`, `::-webkit-scrollbar-thumb`, `::-webkit-scrollbar-thumb:hover` y `::-webkit-scrollbar-corner` (pulgar píldora con `border` + `background-clip: content-box`, pista y esquina transparentes); verificar en Chrome/Edge que el aspecto coincide con Firefox.
- [x] 2.3 Confirmar que no se introducen clases CSS propias, `@utility` ni `@apply` (cumple `AGENTS.md`) y que no cambia el JSX; verificar con `npx oxlint src/` y `npx tsc -b`.

## 3. Verificación de integración

- [x] 3.1 Ejecutar la batería completa (`npx tsc -b`, `npx oxlint src/`, `npm test`, `npm run build`) y verificar todo en verde.
- [x] 3.2 Smoke visual en Chrome y Firefox (desktop) sobre los contenedores desplazables existentes (Menú, Perfil, Ajustes, Guía de manos, coach del tutorial) comprobando barra temática, ausencia de saltos de layout y que rueda/teclado/arrastre siguen funcionando.
- [x] 3.3 Smoke visual en el build Android (WebView) confirmando que el scroll no cambia su comportamiento overlay/transitorio.

## Workflow follow-up

- Archivar el cambio cuando se cumplan los requisitos de revisión del proyecto.
- Verificar el resultado archivado.
