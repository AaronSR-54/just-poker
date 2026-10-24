# Tasks

## 1. Resolución de entrada (helper puro)

- [x] 1.1 Crear `src/net/onlineEntry.ts` con `resolveOnlineEntry` (unión `prefill` | `rejoin` | `confirm` | `ignore`) reutilizando `normalizeRoomCode` e `isOtherRoomJoin` de `src/net/onlineSession.ts`; verificar con `npx tsc --noEmit` que no hay tipos duplicados ni lógica de normalización propia
- [x] 1.2 Añadir `src/net/onlineEntry.test.ts` con casos: sin nombre guardado → `prefill`; con nombre guardado → `prefill`; sesión del mismo código → `rejoin`; sesión de otro código → `confirm`; sala abierta de otro código → `confirm`; `wantsNewGame` con sesión → `ignore`/`prefill` según diseño; código inválido → `ignore`; verificar con `npx vitest run src/net/onlineEntry.test.ts`

## 2. Pantalla de juego con amigos

- [x] 2.1 Sustituir la decisión inline del efecto de entrada por `resolveOnlineEntry` y eliminar la unión automática basada en `getPlayerName()`; verificar en `npm run dev` que `/online?code=XXXX` (con y sin nombre en `localStorage`) deja el modo «Unirse» con el código rellenado y no entra solo
- [x] 2.2 Inicializar el campo de nombre con el nombre guardado y un único nombre generado como respaldo (`getPlayerName()` / `randomName()` una sola vez), manteniendo `name.trim() || placeholderName` al confirmar; verificar que pulsar «Unirse» sin escribir entra con el nombre mostrado
- [x] 2.3 Conservar el código y el paso de unirse cuando falla la entrada (`attachSession` y resolución por `?code=`): mostrar `onlineError` sin llamar a `clearCodeParam`; verificar con un código inexistente y con una sala cerrada mientras se está en el formulario
- [x] 2.4 Revisar que no queda copy nuevo hardcodeado y que los textos siguen pasando por `t(...)` en `es`/`en` (incluidos `aria-label` y `title`); verificar con `npx oxlint src/` y búsqueda de literales nuevos
- [x] 2.5 Confirmar que los componentes existentes cubren la pantalla sin markup nuevo (`Panel`, `CtaButton`, `NameField`, `SelectableCard`, `PageHeader`, `ScreenTitle`, `Screen`, `Badge`, `PersonCard`, `QrCode`, `QrDialog`, `ConfirmDialog`); verificar que el diff de `Online.tsx` no crea primitivas ni estilos propios

## 3. Enlaces nativos

- [x] 3.1 Ajustar `src/hooks/useDeepLinks.ts` para navegar con `replace` en el enlace de arranque (`getLaunchUrl`) y con navegación normal en `appUrlOpen`, conservando el guardado anti-duplicados; verificar lectura del diff y que `npx tsc --noEmit` pasa
- [x] 3.2 Verificar que la ruta heredada `/join/:code` sigue aterrizando en «Unirse» con el código rellenado (`http://localhost:5173/join/XXXX` en `npm run dev`)
- [ ] 3.3 Verificar en dispositivo/emulador Android con `npm run android:debug`: app cerrada, app en segundo plano y app ya abierta en el menú; en los tres casos debe verse Online → «Unirse» con el código rellenado, sin volver al menú ni perder el código

## 4. Verificación de integración y calidad

- [x] 4.1 Repasar la checklist de reutilización de `AGENTS.md`: sin primitivas reinventadas, sin JSX/lógica duplicada, sin helpers definidos dos veces, tokens en lugar de valores crudos y todo el texto visible por `t(...)`; anotar el resultado en la revisión del change
- [x] 4.2 Ejecutar `npx oxlint src/`, `npx tsc --noEmit`, `npm test` y `npm run build` y dejar los cuatro en verde
- [x] 4.3 Probar la matriz de regresión en web: invitación sin nombre, invitación con nombre, otro código con lobby en curso (confirmación), mismo código (reincorporación), recarga dentro del lobby, QR del lobby y sala no disponible (código conservado con error)

## Workflow follow-up

- Archivar el change con OpenSpec cuando la revisión esté aprobada.
- Regenerar el APK/AAB (`npm run android`) y publicar la versión en Play con sus notas de release.
