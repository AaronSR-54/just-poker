# Proposal

## Why

Probar el modo online en local exige **dos procesos**: Vite (`npm run dev`, :5173) y el servidor socket.io (`npm run dev:server`, :3001). Es fácil arrancar solo Vite; entonces el socket no conecta por el proxy y la pantalla Online cae en `online.serverError`, bloqueando la verificación funcional de los tres changes online en curso sin una causa evidente. Un único comando elimina ese pie.

## What Changes

- Añadir la devDependency `concurrently`.
- Añadir el script `dev:all` que levanta Vite y el servidor online juntos, etiquetados (`web`, `online`).
- **Sin** cambios en los scripts existentes: `dev` y `dev:server` se conservan tal cual.
- Documentar el comando en `AGENTS.md` (sección de tooling/online).

## Capabilities

### New Capabilities

<!-- Ninguna: es tooling de desarrollo, no comportamiento del producto. -->

### Modified Capabilities

<!-- Ninguna: no cambia ningún requisito observable del sistema. -->

Este change declara `skip_specs: true` en su `.openspec.yaml`: solo añade tooling de desarrollo (un script de npm y una devDependency), sin cambios de comportamiento en la app ni en el online.

## Impact

- Configuración: `package.json` (nuevo script `dev:all` + devDependency `concurrently`) y el lockfile.
- Documentación: `AGENTS.md` (comando para levantar web + online a la vez).
- Reutilización: no toca código de la app; no se reutiliza ni extrae ningún componente de `src/components/` ni helper de `src/utils/`.
- Sin cambios en UI, red, protocolo de salas, tokens ni i18n. No afecta a Android ni al despliegue de producción.
