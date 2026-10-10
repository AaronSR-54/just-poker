# Design

## Context

Ver `proposal.md - Why`. El modo online local necesita dos procesos: Vite (`npm run dev`, :5173) y el servidor socket.io (`npm run dev:server`, :3001), comunicados por el proxy WebSocket de `vite.config.ts`. Hoy no existe ningún script que los lance juntos.

## Goals / Non-Goals

**Goals:**
- Un único comando que arranque web + servidor online, con salida etiquetada por proceso.
- No alterar el comportamiento de `dev` ni `dev:server`.

**Non-Goals:**
- Cambiar el servidor, el proxy o el protocolo de salas.
- Unity (undo/restart, failover) ni despliegue en Vercel.

## Decisions

**Añadir `concurrently` como devDependency y un script `dev:all`.**
- Script: `concurrently -n web,online "npm:dev" "npm:dev:server"` (`-n` etiqueta cada flujo para distinguir logs; `npm:` ejecuta el script homónimo).
- Se conservan `dev` y `dev:server` intactos, así que no rompe el flujo actual ni scripts/CI existentes.

Alternativas consideradas:
- **B) `scripts/dev-all.sh` con `trap`**: sin dep nueva, pero añade un script de shell que hay que mantener y solo funciona en POSIX (y ya hay `scripts/` para tareas de build, no de dev).
- **C) Solo documentar que hay que abrir dos terminales**: coste cero, pero no elimina el problema real (olvidar `dev:server` bloquea la verificación con `online.serverError`).

Se eligió A por el mejor equilibrio entre ergonomía y superficie de mantenimiento; el coste es una devDependency de confianza amplia, sin impacto en el bundle de producción.

## Risks / Trade-offs

- [Nueva devDependency `concurrently`] -> Es dev-only; no entra en el build de producción. Mantener el rango de versión actual del gestor.
- [Puertos ocupados (3001/5173) al lanzar `dev:all`] -> Igual que lanzarlos por separado; `concurrently` propaga la señal de salida y ambos fallan con su propio mensaje de puerto en uso.
- [Cambiar la etiqueta/uso rota algún flujo manual] -> No: los scripts individuales siguen existiendo.
