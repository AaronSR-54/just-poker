# Proposal

## Why

Cuando el humano ya tiene una partida online en curso (un lobby sin empezar o una partida jugando) y abre un enlace de invitación con otro código —o escribe otro código distinto—, el sistema cambia de sala sin avisar: el servidor abandona la sala anterior de forma silenciosa y el jugador pierde su asiento sin querer. En la práctica el cambio no resulta fiable ni predecible, y no hay forma de cancelar para quedarse en la partida anterior.

Además, **recargar la página o la app estando en una sala es frágil**: como la sala sin empezar no se persiste, al recargar se pierde su rastro y puede aparecer un falso «¿abandonar la sala?» (comparando con una sesión vieja de otra partida) que, al cancelar, te lleva a esa partida anterior. Y en una sala sin empezar el servidor libera el asiento al instante al desconectarse el socket, de modo que si eras el último, la sala se borra y al reconectar no reingresas.

## What Changes

- Añadir una **confirmación explícita al entrar en una sala distinta** cuando ya existe una sesión online activa: si el código resuelto apunta a otra sala, el sistema pregunta antes de abandonar la anterior.
  - Aplica tanto al **abrir un enlace de invitación** (`?code=`) como al **escribir/pegar otro código** en el flujo de unirse.
  - Aplica a **cualquier sesión online activa**, sea un lobby sin empezar o una partida ya empezada.
  - Si el código apunta a la **misma sala** en la que ya se está, no se pregunta (no hay abandono).
- Al **confirmar**, el sistema abandona la sala anterior por completo (libera la plaza y avisa al resto, descarta la sesión local) y entra en la nueva.
- Al **cancelar**, el sistema no abandona nada: permanece en la sala anterior (o en el lobby) sin cambios.
- La confirmación usa el diálogo de confirmación ya existente en la app, con texto propio en español e inglés.
- **Persistir la sala en curso** (también las que no han empezado) al crearla o unirse, de modo que al **recargar la página o la app** el sistema reconozca que ya estabas en ella y te reincorpore **sin preguntar** ni saltar a otra partida.
  - El **menú** pasa a ofrecer «Continuar partida» también para una sala sin empezar; al continuar, reentra en el lobby (no en la mesa).
- **Ventana de gracia en el servidor para salas sin empezar**: al desconectarse el socket (recarga, corte o cierre inesperado), el jugador **conserva su asiento y su rol** durante la ventana; si vuelve, lo recupera. Pasada la ventana sin reincorporarse, se libera el asiento (y se borra la sala vacía). Un **abandono explícito** desde el lobby (salir de la sala) sigue siendo inmediato.

## Capabilities

### New Capabilities
<!-- None: no se introduce una capacidad nueva; se modifican las existentes. -->

### Modified Capabilities
- `online-lobby`: requisito de pedir confirmación antes de abandonar una partida online en curso al unirse a una sala distinta (enlace o código); y requisitos de **continuidad al recargar** (sala persistida que reingresa sola) y de **ventana de gracia** para los sockets desconectados de salas sin empezar.
- `game-entry`: la tarjeta online considera también una **sala sin empezar** como partida en curso, ofreciendo «Continuar partida» y reentrando en el lobby.

## Impact

- **Pantalla de juego con amigos** (`src/screens/Online.tsx`): resolución de la entrada (`?code=` y sesión activa), confirmación al cambiar de sala y **persistencia de la sala (lobby o partida) en la sesión** al recibir el estado de la sala.
- **Sesión online** (`src/net/onlineSession.ts`): `getActiveOnlineSession()`/`clearOnlineSession()`, y un indicador de si la sesión ya **empezó** para enrutar «Continuar partida» al lobby o a la mesa.
- **Menú** (`src/screens/Menu.tsx`): «Continuar partida» enruta a la sala (lobby sin empezar) o a la mesa (partida empezada) según la sesión.
- **Servidor** (`server/socket/handlers.ts`): la desconexión de una sala sin empezar pasa a **ventana de gracia** (mismo patrón que las partidas empezadas), deja de borrar la sala al instante y reincorpora al que vuelve; el abandono explícito (`room:leave`) sigue siendo inmediato. Se ignora la desconexión de un socket ya reemplazado por una reconexión.
- **Diálogos y textos**: se reutiliza `ConfirmDialog` (`src/components/ConfirmDialog.tsx`) y se añaden claves i18n en `src/i18n/locales/{es,en}/online.ts`.
- **Reutilización**: no se introduce ningún componente React nuevo. Se reutilizan `ConfirmDialog`, el estado de confirmación ya presente (`pendingMode`) y los helpers de sesión; en el servidor se reutilizan `markDisconnected`/`scheduleAbsenceExpiry`/`expireAbsent` de la ventana de gracia ya existente.
