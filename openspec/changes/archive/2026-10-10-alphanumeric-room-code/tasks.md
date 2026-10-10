# Tasks

## 1. Servidor — generación y resolución del código

- [x] 1.1 Cambiar `generateCode` en `server/game/GameManager.ts` para emitir 4 caracteres del alfabeto `A-Z` + `2-9` excluyendo `O 0 I 1 L`; verificar con `npx vitest run server/game/GameManager.test.ts` usando el patrón `/^[A-HJKMNP-Z2-9]{4}$/`.
- [x] 1.2 Normalizar el código a mayúsculas en `GameManager.getRoomByCode` (trim + `toUpperCase`) antes de buscarlo, de modo que un código en minúsculas resuelva la misma sala; verificar con un test unitario en `GameManager.test.ts` que `getRoomByCode(room.code.toLowerCase())` devuelve la sala.

## 2. Cliente — entrada del código

- [x] 2.1 En `src/screens/Online.tsx`, actualizar las 4 casillas para aceptar `[A-Za-z0-9]`, normalizar a mayúsculas y usar teclado de texto (no numérico), tanto al teclear (`handleCodeChange`) como al pegar (`handleCodePaste`) y en el foco; verificar manualmente/Playwright que teclear o pegar en minúsculas rellena las casillas en mayúsculas.
- [x] 2.2 Actualizar la lectura del `?code=` (y del enlace `/join/:code`) para aceptar alfanumérico y normalizar a mayúsculas; verificar abriendo `/online?code=<código en minúsculas>` y comprobando que reincorpora a la sala.

## 3. Verificación

- [x] 3.1 Revisar la checklist de reutilización de AGENTS.md: no se introducen componentes ni clases CSS nuevas (se reutilizan `Panel`, `NameField`, `CtaButton`, `QrCode`/`QrDialog`, `PersonCard`), se usan tokens nativos y todo texto visible pasa por `t(...)`; comprobar con `rg` que no se reintroducen patrones locales duplicados.
- [x] 3.2 Ejecutar `npx oxlint src/`, `npx tsc -b` (equivalente real a `tsc --noEmit` en este repo), `npx vitest run` y `npm run build`, y verificar que pasan.

## 4. Integración

- [x] 4.1 Prueba E2E (Playwright) con dos navegadores: crear sala y comprobar que el código mostrado es alfanumérico de 4 sin `O 0 I 1 L`; unirse tecleando el código en minúsculas y verificar que el lobby queda en `2/4` con ambos jugadores.

## Workflow follow-up

- Archivar el change cuando la revisión esté satisfecha.
- Verificar el resultado archivado.
