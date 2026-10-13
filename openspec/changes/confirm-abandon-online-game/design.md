# Design

## Context

La pantalla de juego con amigos (`src/screens/Online.tsx`) resuelve la entrada en un único efecto de montaje: si hay `?code=` rellena el código y, si ya hay nombre guardado, emite `room:join` directamente; si no, reanuda la sesión activa. El servidor (`server/game/GameManager.ts`, `joinRoom`) valida la sala destino **antes** de abandonar la anterior, así que ya es "transaccional": si el destino no existe/está lleno/empezado, no toca la sala previa.

Dos problemas de estado actual:
- Abrir un enlace mientras ya se está en `/online` **no re-ejecuta** el efecto de montaje (el `pathname` no cambia), así que el nuevo código se ignora.
- Cuando sí se resuelve, el abandono de la partida anterior es silencioso y sin opción de cancelar.

La sesión activa (`src/net/onlineSession.ts`, `getActiveOnlineSession`) guarda `code`, lo que permite decidir en cliente si el destino es otra sala sin ir al servidor.

## Goals / Non-Goals

**Goals:**
- Interceptar la entrada a una sala distinta cuando hay sesión online activa y pedir confirmación antes de abandonar.
- Cubrir las dos vías: enlace/`?code=` (incluida la apertura estando ya en `/online`) y código escrito/pegado en el flujo de unirse.
- Abandono efectivo al confirmar; permanencia intacta al cancelar.

**Non-Goals:**
- No se cambia el protocolo de socket ni la semántica de `room:join`.
- No se toca la partida local offline ni la confirmación existente al cambiar de modo dentro del lobby (`pendingMode`).
- No se revisa el aviso al resto de la sala anterior en partidas ya empezadas (comportamiento preexistente, ver riesgos).

## Decisions

### 1. Decidir la confirmación en cliente comparando el código

El destino es "otra sala" si el código normalizado (mayúsculas, sin caracteres extraños, 4 chars) difiere de `getActiveOnlineSession()?.code`. Si coincide, es la misma sala y no se pregunta. Se evita ir al servidor a resolver `code → roomId` solo para decidir si hay que preguntar.

Se extrae una **función pura** reutilizada por las dos vías (enlace y código manual) en `src/net/onlineSession.ts`: `isOtherRoomJoin(session, code): boolean`. Junto a los helpers de sesión ya presentes, es testeable sin React (se añaden casos a `src/net/onlineSession.test.ts`). Alternativa descartada: implementación local duplicada en `Online.tsx`, que se desincronizaría entre las dos vías.

### 2. Reutilizar el diálogo y el patrón de confirmación existentes

No se crea ningún componente nuevo. Se reutiliza `ConfirmDialog` (`src/components/ConfirmDialog.tsx`) y el patrón ya usado para `pendingMode`: un nuevo estado `pendingJoin` (código pendiente) se suma a la condición que abre el diálogo y a la selección de textos (`confirmCopy`). Se añaden claves i18n en `src/i18n/translations.ts` (es/en) siguiendo las existentes `online.joinAnotherTitle/Message/Confirm`.

### 3. Resolver la entrada de forma reactiva al `?code=`, no solo al montar

La resolución del enlace se mueve a un efecto que observa `params.get('code')` con un `ref` del último código gestionado para no repetir avisos. Así un enlace abierto estando ya en `/online` (o en una sala) también se intercepta. El efecto de montaje se mantiene para conexión, listeners y reanudación de la sesión activa.

### 4. Abandono transaccional

Al confirmar, se emite `room:join` con el código nuevo y **solo al recibir ack correcto** se descarta la sesión anterior (`clearOnlineSession()`). El servidor ya abandona la sala previa dentro de `joinRoom` tras validar el destino. Si el ack falla, se muestra el error existente (`onlineError`, p. ej. `online.roomGone`) y se conserva la sesión anterior. Al cancelar, se limpia el `?code=` y se restaura la sesión previa reutilizando la lógica de reanudación existente (`room:join` por `roomId`), de modo que reentra en su lobby o partida. Para el código escrito a mano, cancelar solo cierra el diálogo y mantiene el flujo de unirse.

### 5. Reutilización

- **Reutilizados:** `ConfirmDialog`; helpers `getActiveOnlineSession`/`clearOnlineSession`; emisión `room:leave`/`room:join` vía `src/net/socket.ts`; `onlineError` y `randomName`; claves i18n existentes de `online.*`.
- **Extraído:** una única función pura `isOtherRoomJoin` en `src/net/onlineSession.ts`, compartida por las dos vías y con test unitario.
- **Sin duplicar:** no se replica markup ni lógica de diálogo; `pendingJoin` reusa el mismo `ConfirmDialog` que `pendingMode` y `blocker`.

## Risks / Trade-offs

- **Aviso repetido por el efecto reactivo del `?code=`** → `ref` con el último código gestionado y comparación contra `session.code` (la misma sala no avisa).
- **El `?code=` se reescribe al entrar en una sala** (efecto existente que refleja `room.code`) → la comparación con `session.code`/`room.code` evita falsos avisos.
- **Sala anterior ya empezada no recibe el aviso inmediato** de la marcha al confirmar (el `leaveRoom` interno de `joinRoom` no difunde) → comportamiento preexistente al cambiar de sala; queda fuera de alcance, pero se documenta. Mitigación opcional futura: difundir el estado de la sala previa.
- **Cancelar tras abrir un enlace** debe devolver al humano a su partida anterior → se reutiliza la reanudación por `roomId`; si la sesión ya caducó (ventana de 2 min), se trata como sin sesión y se muestra el selector.
