# Tasks

## 1. Reescribir el README

- [x] 1.1 Sustituir todo el contenido de plantilla de Vite en `README.md` por una descripción real del proyecto en inglés: qué es Just Poker (póker de práctica, gratuito, sin dinero real), las dos modalidades (partida local offline contra IA y multijugador privado anónimo online) y las características principales. Verificar leyéndolo: no queda ninguna mención a la plantilla de Vite (React Compiler, `@vitejs/plugin-react`, "Expanding the Oxlint configuration").
- [x] 1.2 Añadir una sección de capturas que referencie los PNG existentes (`store/screenshots/en/01-menu.png`, `02-seleccion.png`, `03-mesa.png`, `04-manos.png`, `05-online.png`) con `![...](store/screenshots/en/...)`. Verificar que las cinco rutas resuelven a archivos existentes y que no se copian ni regeneran imágenes.
- [x] 1.3 Añadir las secciones de stack técnico (React 19, TypeScript, Vite, Tailwind CSS v4 CSS-first, Zustand, framer-motion, socket.io + Redis, Capacitor 8), puesta en marcha (`npm run dev`, `dev:server`, `dev:all`, `build`, `lint`, `test`) y despliegue (web en Vercel + app Android en Google Play). Incluir enlaces relativos a `AGENTS.md`, `ROADMAP.md`, `store/PUBLISHING.md` y la política de privacidad (`public/privacy-policy.html`). Verificar que cada comando coincide con `package.json` y que cada enlace relativo apunta a un archivo existente.
- [x] 1.4 Mencionar la internacionalización español/inglés y el selector de idioma. Verificar que el texto del README es coherente con la app (es/en) y que no afirma nada que el código no haga.

## 2. Verificación

- [x] 2.1 Revisar el README renderizado y comprobar que las capturas se muestran, que la tabla/secciones de stack y comandos son correctas y que no queda ningún texto de plantilla.
- [x] 2.2 Verificación de reutilización y ausencia de duplicación (checklist de `AGENTS.md`): confirmar que el change es solo documentación, que no se ha tocado código de `src/` ni `index.css`, que no se han creado ni duplicado imágenes (se reutilizan `store/screenshots/en/`) y que no se reintroduce `app.css`/`tokens.css`. No se ejecuta `npx oxlint src/`, `npx tsc --noEmit` ni `npm run build` porque no se modifica código de la app.

## Workflow follow-up

- Archive the change after implementation and review are complete.
