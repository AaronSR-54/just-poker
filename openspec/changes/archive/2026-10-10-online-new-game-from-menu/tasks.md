# Tasks

## 1. Intención de partida nueva desde el menú

- [x] 1.1 En `src/screens/Menu.tsx`, la fila «Nueva partida» de la tarjeta online SHALL navegar con la intención explícita de partida nueva (estado de navegación) en lugar de a `/online` sin más. Verificar con `npx tsc --noEmit` que compila.

## 2. Resolución de la sesión en la pantalla online

- [x] 2.1 En `src/screens/Online.tsx`, al montar con la intención de partida nueva, el sistema SHALL saltar la reanudación de la sesión y mostrar el selector de crear/unirse; sin esa intención SHALL mantener la reanudación actual. Verificar que abrir `/online` con sesión activa muestra la sala y que con la intención muestra el selector.

## 3. Verificación

- [x] 3.1 Revisar la checklist de reutilización de `AGENTS.md`: solo se reutilizan `CtaCard`, la pantalla online y `getActiveOnlineSession`; sin componentes, clases ni textos nuevos y sin lógica duplicada.
- [x] 3.2 Ejecutar `npx oxlint src/`, `npx tsc --noEmit`, `npm run build` y `npx vitest run` y confirmar que pasan sin errores.
- [x] 3.3 Playwright con servidor aislado: con una partida online en marcha, volver al menú, activar «Nueva partida» y comprobar que se ve el selector de crear/unirse (no la sala en curso) y que «Continuar partida» sigue disponible.

## Workflow follow-up

- Archivar el change cuando se cumplan los requisitos de revisión del proyecto.
