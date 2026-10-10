# Tasks

## 1. Límite de nombre en el cliente

- [x] 1.1 Extraer la constante `MAX_PLAYER_NAME_LENGTH = 16` a un módulo de configuración del cliente (`src/config/online.ts`) y verificar que exporta el valor `16`
- [x] 1.2 Usar la constante como valor por defecto de `maxLength` en `src/components/NameField.tsx` (eliminando el literal `24`) y verificar con `npx tsc --noEmit` que compila
- [x] 1.3 Sustituir los dos literales `slice(0, 24)` de `src/screens/Online.tsx` (crear y unirse) por `slice(0, MAX_PLAYER_NAME_LENGTH)` y verificar que no queda ningún `24` de longitud en el archivo
- [x] 1.4 Reutilizar la constante en el perfil local (`src/screens/Profile.tsx`) en lugar del literal `16` y verificar que el perfil sigue limitando a 16

## 2. Límite de nombre en el servidor

- [x] 2.1 Extraer `MAX_NAME_LENGTH = 16` junto a los tipos de sala (`server/game/types.ts`) y verificar que el servidor compila
- [x] 2.2 Usar la constante en los `slice(0, 24)` de `room:create`, `room:join` y `room:rename` en `server/socket/handlers.ts`, y verificar que no queda ningún literal `24` de longitud
- [x] 2.3 Añadir en `server/socket/handlers.test.ts` un caso que cree una sala con un nombre de más de 16 caracteres y verificar que el `username` almacenado tiene 16 caracteres (`npm test` o el runner de test del servidor)

## 3. Verificación de reutilización y calidad

- [x] 3.1 Revisar la checklist de reutilización de `AGENTS.md`: confirmar que se reutiliza `NameField` (sin recrear primitivas), que no quedan literales de longitud duplicados (`24`/`16`) y que no hay helpers duplicados
- [x] 3.2 Ejecutar `npx oxlint src/` y verificar que no hay errores
- [x] 3.3 Ejecutar `npx tsc --noEmit` y verificar que no hay errores de tipos
- [x] 3.4 Ejecutar `npm run build` y verificar que el build termina correctamente

## Workflow follow-up

- Archivar el change una vez satisfechos los requisitos de revisión del proyecto.
- Verificar el resultado archivado.
