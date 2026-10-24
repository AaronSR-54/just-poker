# Proposal

## Why

Abrir una invitación (enlace o QR) no lleva siempre al mismo sitio: hoy, si el dispositivo tiene un nombre guardado, la app entra sola al lobby; si no lo tiene, se queda en el formulario. Esa diferencia hace que un invitado sin nombre pueda acabar fuera del flujo de unirse (se pierde el código o vuelve al menú) justo en el caso más habitual: alguien que instala la app y abre su primer enlace. El resultado esperado es determinista y único: siempre la pantalla de juego con amigos, en «Unirse a partida», con el código ya rellenado.

## What Changes

- Abrir un enlace/QR de invitación (o la ruta heredada `/join/:code`) aterriza **siempre** en la pantalla de juego con amigos con el modo «Unirse a partida» seleccionado y el código de 4 caracteres rellenado, tanto en la app Android (arranque en frío o app ya abierta) como en la web.
- **BREAKING (UX)**: dejar de entrar automáticamente al lobby al abrir el enlace, aunque haya un nombre guardado. Entrar requiere una acción explícita («Unirse»), de modo que el invitado ve y puede ajustar su nombre antes.
- El campo de nombre se muestra relleno con el último nombre usado (editable); si no hay ninguno, se mantiene el nombre generado como valor por defecto. Pulsar «Unirse» sin tocar el nombre entra con el que se muestra.
- Si la entrada falla (sala inexistente, llena, ya empezada o cerrada), se conserva el paso de unirse con el código rellenado y se muestra el error; no se vacía el código ni se abandona el flujo.
- La entrada nativa no deja el menú debajo del paso de unirse: el atrás de Android no saca al invitado del flujo de invitación sin querer.
- Se mantiene el comportamiento ya existente cuando hay una partida o lobby en curso: mismo código reincorpora; otro código pide confirmación antes de abandonar.
- Web y app comparten la misma resolución de entrada; no hay cambios de servidor ni de protocolo.

## Capabilities

### New Capabilities

<!-- Ninguna: el comportamiento encaja en capacidades existentes. -->

### Modified Capabilities

- `app-links`: abrir un enlace de invitación ya no incorpora directamente a la sala; abre la pantalla de juego con amigos en modo «Unirse» con el código rellenado, tanto en arranque en frío como con la app en marcha.
- `online-lobby`: la entrada mediante enlace/QR pasa a ser determinista (siempre el formulario de unirse con el código), independiente de si hay nombre guardado; el nombre mostrado por defecto es el último usado o uno generado, editable, y un fallo de entrada conserva el código en el formulario.

## Impact

- Código: `src/screens/Online.tsx` (resolución de la entrada y estado inicial), `src/hooks/useDeepLinks.ts` y `src/utils/deepLink.ts` (apertura nativa), nuevo helper puro de resolución de entrada en `src/net/` con sus pruebas, y textos i18n (`es`/`en`) si hace falta copy nueva.
- Reutilización: se reutilizan `Panel`, `CtaButton`, `NameField`, `SelectableCard`, `PageHeader`, `ScreenTitle`, `Screen`, `Badge`, `PersonCard`, `QrCode`, `QrDialog` y `ConfirmDialog`; y los helpers `normalizeRoomCode`, `isOtherRoomJoin`, `getActiveOnlineSession`, `getPlayerName`, `setPlayerName` y `onlineOrigin`. Se extrae un único helper de resolución de entrada (compartido por la pantalla y las pruebas) para no duplicar la lógica de decisión; no se crean componentes ni clases CSS nuevas.
- Servidor/API: sin cambios (el `room:join` existente sigue igual).
- Distribución: el cambio se sirve en la web al desplegar y en Android requiere regenerar el APK/AAB.
- Riesgo asumido: quien ya estaba acostumbrado a entrar directo al lobby al abrir un enlace ahora verá un paso de confirmación con el nombre y el código.
