# Design

## Context

Ver `proposal.md - Why`. La mesa online (`src/screens/Game/OnlineGame.tsx`) reutiliza los mismos layouts que la local (`DesktopGameLayout`/`MobileGameLayout`) y `buildGameView`, pero el anfitrión ejecuta el motor (`useOnlineGame`) y difunde el estado; los invitados solo lo reciben y lo rotan con `rotateState`. Esa asimetría explica por qué varias piezas que el modo local ya resuelve no están conectadas en online.

Estado actual relevante:

- `gameView` ya calcula `displayedChips`, `displayedPot`, `potEmpty` y `humanNet` a partir de `awardProgress`/`potRemaining`/`winAmounts`/`committed`. Online les pasa `awardProgress: {}` y `potRemaining: null`, así que el reparto queda a medias.
- `rotateState` reasigna `winAmounts`, `winner`, `currentPlayer`, `dealer` y `actions`, pero **no** `committed`.
- El anfitrión crea el motor con `autoDeal` por defecto (`true`), así que no hay pausa entre calles; la local usa `setAutoDeal(false)` + `useCommitState`.
- Online no usa `useGameSounds` ni `useTurnTimer`; su temporizador es un `setTimeout` propio y el anfitrión resuelve a los rivales con otra constante (`REMOTE_TURN_MS = 35000` frente a `TURN_DURATION = 30`).
- `gameOverModal` es siempre `false` y los ajustes reciben `onTutorial`/`onHandsGuide` como `noop`.

## Goals / Non-Goals

**Goals:**
- Que el fin de mano, el reparto del bote, la transición entre calles, los sonidos, el temporizador y el fin de partida se comporten igual que en local, sin duplicar la lógica ya existente.
- Corregir la consistencia entre dispositivos (fichas/bote/netos) tras rotar el estado.

**Non-Goals:**
- No se toca el servidor ni el protocolo (ya existe `game:restart`), ni el motor de póker, ni el flujo de lobby/reconexión.
- No se rehace el diseño visual de la mesa ni se añaden componentes nuevos: todo se resuelve por props sobre los componentes compartidos.

## Decisions

### 1. Reutilizar `usePotAward` en `OnlineGame`

El hook (`src/screens/Game/hooks/usePotAward.ts`) solo depende de `PokerState`, así que funciona igual online. Se conectan `potAward`, `awardProgress`, `potRemaining`, `handlePotAwardLanded`, `finishPotAward` y `resetPotAward` a `buildGameView` y al layout, y se llama a `resetPotAward()` al empezar una mano nueva. Esto arregla de raíz las fichas del ganador y el bote, porque `gameView` ya está escrito para esos valores.

*Alternativas:* calcular en `gameView` una rama "sin animación" cuando no hay reparto → se descarta: duplica la lógica de la vista y no muestra el reparto.

### 2. Rotar `committed` en `rotateState`

Añadir `committed: order.map(i => state.committed[i] ?? 0)` al estado rotado (igual que ya se hace con `winAmounts`). Con eso `humanNet` y los deltas de `RivalSlot` usan índices coherentes.

*Alternativa:* recalcular el neto sin `committed` → se descarta: `committed` es la fuente para side pots y el delta por jugador.

### 3. Generalizar `GameOverOverlay` para el fin de partida online

Añadir props opcionales al componente compartido (`restartLabel`, `restartDisabled` + texto de espera, y `onSelectDifficulty` opcional). Online muestra la revancha (habilitada solo para el anfitrión, "esperando al anfitrión" para el resto) y oculta "Seleccionar dificultad". El anfitrión lanza `restartGame` (ya emite `game:restart` y difunde el estado nuevo). `gameOverModal` se deriva de `state.gameOver` con `GAME_OVER_DELAY`, como en local.

*Alternativa:* componente de fin de partida aparte → se descarta: duplica markup y estilos.

### 4. Pausa entre calles dirigida por el anfitrión

En `useOnlineGame`, crear el motor con `setAutoDeal(false)`. Tras cada `hostPush`, si el estado queda en `streetPending`, programar `resolveStreet()` tras `STREET_DELAY` y volver a difundir. Los invitados solo pintan el estado pendiente (las apuestas de la ronda siguen visibles).

Para no copiar la lógica de `useCommitState`, se extrae el temporizador de calle a un helper compartido (p. ej. `src/screens/Game/hooks/streetDelay.ts` o un hook `useStreetDelay`) usado por `useCommitState` (local) y por el anfitrión online. Justificación de la asimetría restante: la local llama a `setGameState`, el anfitrión online difunde; solo cambia el "qué hacer al repartir", no el retardo.

### 5. Temporizador único con avisos y reanudación

Unificar la duración: la resolución del turno humano y el timeout del anfitrión para un rival usan `TURN_DURATION * 1000`. Para los avisos (tick/expire) y la reanudación al cerrar Ajustes, se extrae el núcleo de cuenta atrás de `useTurnTimer` a un hook compartido (p. ej. `useTurnCountdown`) que gestiona segundos, SFX y pausa/reanudación, y recibe un `onExpire`. `useTurnTimer` (local) lo usa aplicando check/fold al motor; `OnlineGame` lo usa emitiendo la acción (`online.handleAction`). Se mantiene `TimerBar` con `duration` + `paused`.

*Alternativa:* `setTimeout` propio en online (lo actual) → se descarta: no avisa, no reanuda y duplica el comportamiento.

### 6. Sonidos y ajustes

`OnlineGame` llama a `useGameSounds(state)` (mismo hook que local). En los ajustes online se pasan `onTutorial`/`onHandsGuide` como `undefined` para que `GameSettings` no pinte la sección "Aprender" (su render ya es condicional a que existan).

## Risks / Trade-offs

- [El reparto del bote se dispara en cada cliente al recibir `handOver` y podría repetirse al reconectar a mitad de mano] → `usePotAward` ya lo limita una vez por `handNumber`; además se llama a `resetPotAward()` al empezar mano.
- [La pausa entre calles añade latencia percibida] → es la misma que en local (`STREET_DELAY`) y la fija el anfitrión, así que todos ven la pausa a la vez.
- [Rotar `committed` puede afectar a otros consumidores] → hoy `committed` solo lo usa `gameView` (neto/delta); se revisa que ningún otro punto dependa del índice sin rotar.
- [La revancha depende del anfitrión vigente] → si cambia el anfitrión, el nuevo puede lanzarla; los invitados ven "esperando".
- [Extraer hooks compartidos puede tocar el modo local] → se hace manteniendo el comportamiento actual y verificando que local sigue igual (tests + partida local).

## Migration Plan

No hay migración de datos ni de protocolo. El cambio es de cliente: al desplegar, las partidas online nuevas ya usan el motor con pausa entre calles; las partidas en curso siguen funcionando. Rollback = revertir el cliente.
