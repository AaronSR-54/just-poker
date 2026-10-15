# Proposal

## Why

El `README.md` sigue siendo la plantilla por defecto de Vite: habla de `@vitejs/plugin-react`, del React Compiler y de cómo ampliar Oxlint, pero no dice qué es Just Poker, cómo se juega, cómo se levanta el proyecto ni dónde vive el online. Es la primera pantalla que ve quien llega al repo y hoy no representa el producto. Además, ya existe un juego de capturas reales (`store/screenshots/`) que no se aprovecha.

## What Changes

- Reescribir `README.md` en inglés con una **descripción real del proyecto**: qué es Just Poker (póker de práctica, sin dinero real), las dos modalidades (partida local offline contra IA y multijugador privado anónimo online) y las características principales.
- Añadir una sección de **capturas** que referencia los PNG existentes en `store/screenshots/en/` (`01-menu`, `02-seleccion`, `03-mesa`, `04-manos`, `05-online`), sin duplicar ni regenerar archivos.
- Añadir una sección de **stack técnico** (React 19, TypeScript, Vite, Tailwind CSS v4 CSS-first, Zustand, framer-motion, socket.io + Redis, Capacitor 8) y de **puesta en marcha** (scripts `dev`, `dev:server`, `dev:all`, `build`, `lint`, `test`).
- Documentar las **dos superficies de despliegue**: web en Vercel y app Android (Capacitor / Google Play), con enlaces a la documentación interna (`AGENTS.md`, `ROADMAP.md`, `store/PUBLISHING.md`) y a la política de privacidad pública.
- Mencionar la **internacionalización es/en** y el carácter **gratuito y sin dinero real** del juego.
- Eliminar el contenido de plantilla de Vite que ya no aplica.

## Capabilities

### New Capabilities

<!-- Ninguna: es documentación del repositorio, no comportamiento del sistema. -->

### Modified Capabilities

<!-- Ninguna: el README no cambia ningún requisito observable de la app. -->

Este change declara `skip_specs: true` en su `.openspec.yaml`: solo reescribe documentación (`README.md`), sin alterar ningún requisito de comportamiento del sistema.

## Impact

- Documentación: `README.md` (reescritura completa; se elimina el contenido de plantilla de Vite).
- Assets reutilizados (sin modificarlos): `store/screenshots/en/01-menu.png`, `02-seleccion.png`, `03-mesa.png`, `04-manos.png`, `05-online.png`.
- Referencias enlazadas (sin modificarlas): `AGENTS.md`, `ROADMAP.md`, `store/PUBLISHING.md`, `public/privacy-policy.html`.
- Reutilización: no toca código de la app (React); no se reutiliza ni extrae ningún componente de `src/components/` ni helper de `src/utils/`.
- Sin cambios en UI, i18n, red, tokens, dependencias, Android ni despliegue.
