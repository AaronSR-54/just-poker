# Design

## Context

- La partida online es **host-autoritativa**: el anfitrión ejecuta `PokerGame` y difunde el estado; el resto recibe `game:state` y lo rota para que su asiento quede en el índice 0 (`src/net/useOnlineGame.ts`, `src/net/onlineGameState.ts`). Las cartas privadas solo se difunden en showdown/mano terminada.
- `GameOverOverlay` se comparte entre local y online y siempre pinta la clasificación final. `GameTail` y los dos layouts (`MobileGameLayout`, `DesktopGameLayout`) son también compartidos.
- Hoy `OnlineGame.tsx` trata como «fin de partida» dos cosas distintas: `state.gameOver` (fin real) y `handOver` con el humano sin fichas (eliminación). Ambas abren el mismo modal tras `GAME_OVER_DELAY` (2,2 s).
- Tras una mano, el anfitrión es quien pulsa «Nueva mano» (`ActionButtons`); no hay reparto automático en online. Si el anfitrión queda eliminado, la partida se bloquearía.
- `usePotAward` lanza el vuelo de fichas del bote y lo da por terminado con `onDone`; dura del orden de 2–3 s.

Ver `proposal.md` para la motivación y `specs/` para el contrato de comportamiento.

## Goals / Non-Goals

**Goals:**

- Separar eliminación (la partida sigue) de fin de partida (solo queda uno con fichas).
- Dar al eliminado un modo espectador real, con aviso en el área de acciones y un modal con dos salidas.
- Evitar que el anfitrión eliminado bloquee a los demás.
- Retrasar el modal lo suficiente para ver la mano final y el reparto del bote, en local y online.

**Non-Goals:**

- Cambiar el motor, el contrato de red, el servidor de salas o Redis.
- Añadir espectadores externos (sin asiento) o salas de solo lectura.
- Cambiar el comportamiento del jugador local que se queda sin fichas (en local, al quedarse sin fichas la partida termina para el humano y se mantiene el modal actual).
- Añadir controles de espectador (cámara, pausa, cambiar de jugador).

## Decisions

### 1. Dos condiciones distintas en `OnlineGame`

Se calculan por separado:

- `gameOverForAll = state.gameOver` → modal de fin de partida actual (`GameOverOverlay`), sin cambios de contenido.
- `eliminatedForHuman = state.handOver && !state.gameOver && (human.chips <= 0 || human.eliminated)` → modal de eliminación.

`spectating` (para la UI) = `eliminatedForHuman || (!state.handOver && !state.gameOver && human.eliminated)`, de modo que el aviso de espectador siga visible en las manos posteriores aunque el humano ya no reciba cartas.

La condición «el humano está fuera» se encapsula en un helper puro `isHumanEliminated(state)` en `gameView.ts` (sin fichas tras la mano o marcado como eliminado), que consumen `eliminatedForHuman` y `spectating` para no repetir la regla. Se cubre con tests unitarios junto a `maxRaiseFor`.

Alternativa descartada: ampliar `GameOverOverlay` con un modo «eliminación». Su contenido (clasificación, resumen, revancha) no aplica a media partida y complicaría el modal que sí usan local y el fin real.

### 2. Nuevo `EliminationOverlay` reutilizando `Modal` y `Button`

Se extrae un componente único `src/screens/Game/components/EliminationOverlay.tsx` con:

- Título «Has perdido» (clave existente `game.overLost`) y un apoyo nuevo sobre que los amigos siguen jugando.
- Acción primaria «Quedarse a ver la partida» (`game.watchGame`).
- Acción secundaria «Volver al menú» (`game.backHome`, ya existente).

Se aloja en `GameTail` como prop opcional (`elimination`), que ambos layouts pasan tal cual; solo `OnlineGame` la aporta. Así no se duplica el markup del modal ni se toca la mesa local.

### 3. `ActionButtons` con estado de espectador

Se añade `spectating?: boolean` a `ActionButtonsProps` y a `ActionButtonInput` (que rellena `buildActionButtonProps`). Cuando es `true`, `ActionButtons` pinta un aviso de «Has perdido» (`game.spectating`) en lugar del bloque de «Nueva mano»/«Esperando al anfitrión», con las mismas recetas tipográficas que el resto de avisos. No se añade lógica nueva de acciones.

Se pasa `spectating` solo desde `OnlineGame` para no alterar la partida local.

### 4. Pausa de showdown única y compartida

Se sustituye `GAME_OVER_DELAY` por `SHOWDOWN_HOLD_MS` en `gameConfig.ts` (3,5 s, por encima de la duración del vuelo del bote). Se aplica:

- En `OnlineGame`: tanto al modal de eliminación como al de fin de partida, con temporizador por mano (`handNumber`) y pausa al abrir Ajustes, como hoy.
- En `Game`: al modal de fin de partida, manteniendo la escala por `speed` que ya usa la partida local.

No se encadena al `onDone` del reparto del bote: un temporizador fijo es más simple y predecible, y 3,5 s cubre el vuelo completo (retención + fichas + aterrizaje).

### 5. Reparto automático del anfitrión eliminado

En `OnlineGame`, un efecto detecta `isHost && spectating && state.handOver && !state.gameOver` y programa `startNewHand()` (la misma función que usa el botón, con `resetPotAward`) tras `SHOWDOWN_HOLD_MS`. Se guarda la `handNumber` ya repartida en un ref para que el temporizador no reparta dos veces y se limpia al desmontar o al salir.

Alternativa descartada: transferir el rol de anfitrión al eliminarse. Exigiría mover el snapshot y el ciclo de `room:host` en mitad de la mano; el reparto automático resuelve el bloqueo con menos superficie y el failover existente ya cubre la salida al menú.

### 6. Salida y reingreso sin cambios de red

«Volver al menú» usa el `leave()` actual: conserva la sesión y notifica `room:leave`. Al reincorporarse, el estado rotado ya marca al humano como eliminado, así que la mesa entra directamente en modo espectador. No hace falta ningún mensaje ni bandera nueva en el servidor.

### 7. i18n y estilos

Claves nuevas en `es` y `en` (`game.eliminatedSupport`, `game.watchGame`, `game.spectating`). Todo el texto pasa por `t(...)`, incluidos `aria-label`. El modal y el aviso usan utilidades nativas y tokens existentes (`Modal`, `Button`, `font-display`, `text-fs-*`, `opacity-*`).

## Reutilización

- **Se reutilizan:** `Modal` y `Button` (`src/components/`), `GameOverOverlay` para el fin real, `GameTail` y los layouts compartidos, `ActionButtons`, `usePotAward`, y las claves i18n ya existentes `game.overLost` y `game.backHome`.
- **Se extrae:** `EliminationOverlay` (un solo sitio para el modal de eliminación, en vez de duplicarlo en móvil y escritorio).
- **Se extiende:** `ActionButtons` con el estado `spectating`, reutilizando su bloque de avisos en vez de crear otro componente.
- **No se duplica:** la temporización del modal vive en una constante y en la lógica existente de cada pantalla; la clasificación final sigue en `GameOverOverlay`; no se copia markup entre layouts (se pasa por `GameTail`).

## Risks / Trade-offs

- **El anfitrión eliminado reparte mientras su modal sigue abierto** → los amigos no esperan; el modal queda por encima de una mano ya en curso y se cierra al elegir «Quedarse». Se acepta a cambio de no bloquear la partida.
- **Doble reparto por temporizadores solapados** → guard por `handNumber` y limpieza del timer en cada cambio de estado/desmontaje.
- **Modal de fin real y modal de eliminación compitiendo** → `eliminatedForHuman` exige `!state.gameOver`; cuando la partida termina de verdad solo puede abrirse el modal final.
- **Espectador que cierra la app** → sigue sujeto a la ventana de gracia y a la expulsión existentes; `eliminate()` sobre un asiento ya eliminado es inocuo.
- **Espera demasiado larga en partidas rápidas locales** → la pausa local se escala por velocidad; en online el ritmo es fijo por diseño.

## Migration Plan

No hay migración de datos ni de red. El cambio es de UI y temporización; se despliega con la app web y el siguiente build de Android. Rollback: revertir el commit, sin estado persistido afectado.

## Open Questions

Ninguna: el alcance (anfitrión automático, sesión reanudable y pausa en ambos modos) quedó resuelto antes de planificar.
