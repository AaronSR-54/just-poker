# Design

## Context

La fase de lobby vive hoy entera en `src/screens/Online.tsx` (pantalla única de juego con amigos introducida por `unify-online-lobby-screen`). Ver `proposal.md` para la motivación. Los hechos de partida relevantes:

- El estado del lobby es local a `Online.tsx` (`mode`, `room`, `code`, `error`, `busy`, `copied`…). El socket se conecta y registra listeners en un `useEffect` de montaje único; la entrada (`?code=` o sesión activa) se resuelve ahí y no vuelve a tocarse.
- Las tarjetas de modo se deshabilitan con `disabled={Boolean(room)}` (`SelectableCard`), de ahí que el lobby no permita cambiar de modo.
- Salir es la función `leave()` (emite `room:leave`, limpia sesión y estado) atada al botón «Abandonar sala»; `goMenu()` la reutiliza.
- `useSearchParams` solo se **lee** al montar (`params.get('code')`); la dirección nunca se escribe, así que recargar reinicia en `/online` aunque la sesión siga viva.
- La sesión se persiste en `localStorage` (`src/net/onlineSession.ts`) y `getActiveOnlineSession()` la descarta pasados 30 min. La reconexión por corte ya se resuelve reemitiendo `room:join` en el evento `connect` (patrón de `src/net/useOnlineGame.ts:196-220`).
- El servidor ya elimina la sala y libera el código cuando sale el último jugador (`server/game/GameManager.leaveRoom`). No hace falta tocar el protocolo.
- Existen `ConfirmDialog` (overlay con `danger`, reutilizado por `Local`) y `PageHeader` (botón ← + Wordmark), además de `Panel`, `PersonCard`, `Badge`, `Avatar`, `CtaButton`, `NameField`, `QrDialog`, `ScreenTitle`.

## Goals / Non-Goals

**Goals:**

- Sacar al humano del callejón sin salida: poder cambiar de modo sin perder la plaza por accidente y salir siempre con confirmación, también con el atrás del navegador y de Android.
- Que la dirección sea un reflejo fiel de la sala, para recargar o reiniciar y volver a entrar.
- Que el lobby comunique su estado (conexión, plazas) con jerarquía propia y el lenguaje visual de `Local`.
- Cero cambios de servidor, protocolo o esquema de datos.

**Non-Goals:**

- Renombrar el nombre dentro del lobby (descartado explícitamente por el usuario).
- Estado «listo», chat, reacciones o expulsar jugadores.
- Rediseñar `Local` u otras pantallas.

## Decisions

### 1. Data router + bloqueo de navegación

`src/App.tsx` pasa de `BrowserRouter` + `Routes` a `createBrowserRouter` + `RouterProvider`, con una **ruta de layout** que conserva `Background`, `CrtOverlay`, `OnboardingCoach`, el `AnimatePresence` de transiciones (clave `location.pathname`) y `useAndroidBackButton`. En `Online.tsx`, `useBlocker` bloquea la navegación mientras hay `room`: condición sobre refs (`roomRef.current` presente, `bypassBlockRef.current` falso y cambio de `pathname`), de modo que las escrituras de `?code=` con `replace` no se bloquean.

- Al bloquearse (`blocker.state === 'blocked'`) se muestra el diálogo; confirmar limpia la sala y navega al menú (`navigate('/', { replace: true })`); cancelar hace `blocker.reset()`.
- La acción de volver visible llama a `navigate('/')` y deja que el bloqueador muestre el diálogo (una sola vía de salida). El atrás de Android (`navigate(-1)`) queda bloqueado igual.
- **Carga directa (enlace o recarga)**: en una entrada inicial del historial (`history.state.idx === 0`) no hay destino al que volver dentro del documento, así que el atrás del navegador sería una navegación entre documentos que `useBlocker` no puede interceptar. Al activarse la sala se **empuja una entrada idéntica** (con `bypassBlockRef`) para que ese atrás sea un `POP` dentro del documento y pase por el bloqueador; así la salida se confirma y se emite `room:leave` (sin fantasmas). El push no cambia `pathname`, así que no dispara transición de pantalla.
- Un `bypassBlockRef` se activa justo antes de navegar a la mesa al empezar la partida, para no bloquear ese salto.
- `detachRoom()` pone `roomRef.current = null` de forma síncrona para que la navegación de salida no vuelva a bloquearse.

*Alternativa considerada:* interceptar `popstate` a mano o usar `beforeunload`. Se descartan: react-router ya procesa `popstate` y compite con el guard; `beforeunload` mostraría el diálogo nativo también al recargar (que debe reincorporar sin fricción).

### 2. Salida de la pantalla vs. cambio de modo

Salir de la pantalla (atrás del navegador/Android, acción de volver, menú) lo cubre `useBlocker`. El **cambio de modo** no navega (sigue en `/online`), así que se gestiona con un estado local `pendingMode` y el mismo diálogo. Confirmar: limpiar la sala + (`navigate('/')` | `setMode(pendingMode)`); cancelar: `blocker.reset()` | limpiar `pendingMode`.

### 3. Sincronización de la dirección

`useSearchParams` pasa a escribirse:

- Al entrar o recibir `room:state` con `room.code` distinto del parámetro, `setSearchParams({ code }, { replace: true })`.
- Al salir, se retira el código de la dirección.
- En el arranque, orden de resolución: sesión activa → rejoin; si no hay sesión pero hay `?code=`, se rellena el código y se abre el flujo de unirse.

Se usa `replace: true` para no apilar entradas de historial; el bloqueo del atrás lo aporta `useBlocker`, no el historial.

*Alternativa considerada:* `navigate('/online?code=X')` en cada transición (push). Se descarta porque ensucia el historial.

### 4. Estado de conexión del lobby

Mientras `room` existe, se registra un flag `connected` a partir de `socket.on('connect')` / `socket.on('disconnect')`. En `disconnect` se muestra el aviso de conexión perdida; en `connect` se reemite `room:join` (patrón de `useOnlineGame.ts`) y se oculta el aviso. El aviso es una línea dentro del panel de sala, no un overlay.

### 5. Rediseño del panel de sala

- **Código protagonista**: código de sala centrado y activable (en negrita), con contador de plazas (`n/4`) y, solo para el anfitrión, el chip de rol (Anfitrión) en el encabezado.
- **Invitación directa**: se retiran los botones de copiar y la fila con la URL. **Activar el código copia el enlace de invitación** (con confirmación); a su lado hay un **QR pequeño, de la misma altura que el código**, que al activarlo **abre el QR en grande** en un diálogo (`QrDialog`). El QR se dibuja con `QrCode` sobre fondo claro (y `QrCode` cede el tamaño de visualización a las utilidades).
- **Plazas uniformes**: cada plaza es una fila con avatar pequeño, nombre y, para el jugador actual, «(Tú)» junto al nombre y en **negrita** (el resto, sin negrita); sin números de asiento ni chips por fila (el chip de anfitrión vive en el encabezado). Se reutiliza `PersonCard` ampliado (ver decisión 6).
- **Estado «solo»**: mensaje que guía a invitar y CTA del anfitrión con etiqueta estable («Empezar partida»), redondeado, y el requisito de 2 jugadores como texto de ayuda.
- **Movimiento**: las plazas entran y salen con `AnimatePresence` + `popLayout` (la que sale libera su hueco al instante) y `layout` para reacomodar; ocupar/liberar un asiento es un **fundido en la misma posición** (sin fantasma). Las plazas libres se **clavan por índice de asiento** para que no se descoloquen al cambiar el número de jugadores, y el aviso de conexión entra con `fadeDown`.
- **Tamaños**: el panel se compacta (gap/padding reducidos, avatar 36/40, código `text-fs-700`) para **no requerir scroll vertical en escritorio** a partir de 1280×720; en móvil se apila sin desbordamiento horizontal.

### 6. `PersonCard` ampliado, no duplicado

Se añaden a `src/components/PersonCard.tsx` las props `avatarName` (inicial del avatar cuando el nombre visible es «Libre») y `muted` (fila atenuada para plazas vacías). Online compone las plazas con `PersonCard` en vez de replicar el markup. Si un tercer consumidor necesita la noción de «plaza», se promoverá un `PlayerSlot` dedicado.

### 7. Feedback de copia

`copied: 'code' | 'link' | null` para que el código y el enlace confirmen cada uno su propia acción. No se extrae helper: la operación `navigator.clipboard.writeText` + timeout solo existe aquí.

### 8. i18n

Se añaden claves en `src/i18n/locales/{es,en}/online.ts` para: diálogo de salida (título/mensaje/confirmar), conexión perdida y recuperada, plaza libre, invitación (enlace copiable/QR), contador de plazas, guía de «solo» y requisito de jugadores. Se retiran las claves que queden sin uso. `common.ts` ya aporta `common.cancel`.

## Risks / Trade-offs

- [La migración a data router altera transiciones o el atrás de Android] → La ruta de layout conserva `AnimatePresence` y `useAndroidBackButton`; se verifica con `npm run build` y el recorrido manual.
- [`useBlocker` bloquearía también el salto a la mesa al empezar] → `bypassBlockRef` desactiva el bloqueo justo antes de esa navegación.
- [El QR inline ocupa demasiado en móvil] → tamaño responsive y bloque a ancho completo; se comprueba que no desborde.
- [Recargar con `?code=` de una sala a la que no pertenecías] → La sesión activa manda: si `getActiveOnlineSession()` existe, se reincorpora a esa sala y se reescribe la dirección; si no, se cae al flujo de unirse con el código rellenado (y sala inexistente → aviso).
- [Carrera entre `setSearchParams` y `room:state`] → Escribir solo cuando el código cambia respecto al parámetro actual evita bucles de render.
- [Duplicar la sesión al reconectar] → El servidor trata `room:join` del mismo `playerId` como reincorporación (actualiza socket, no añade plaza).

## Open Questions

- Ninguna que cambie specs, enfoque o desglose de tareas.
