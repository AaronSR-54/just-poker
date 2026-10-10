# Tasks

## 1. Tooling de desarrollo

- [x] 1.1 Añadir la devDependency `concurrently` (`npm install -D concurrently`) y verificar que la instalación termina sin errores y actualiza el lockfile.
- [x] 1.2 Añadir el script `dev:all` en `package.json` (`concurrently -n web,online "npm:dev" "npm:dev:server"`) sin tocar `dev` ni `dev:server`, y verificar que `npm run dev:all` levanta ambos procesos (:5173 y :3001) y que `npm run test:online` pasa con ellos activos.
- [x] 1.3 Documentar `npm run dev:all` en `AGENTS.md` (tooling/online) y verificar que el comando tal cual queda escrito arranca web y servidor online juntos.

## Workflow follow-up

- Archive the change after implementation and review are complete.
