# Proposal

## Why

En una partida online con 3 o 4 amigos, el primero que se queda sin fichas recibe el modal de fin de partida aunque la partida siga: el modal tapa la mesa, muestra una clasificación que no es definitiva y le impide seguir viendo cómo juegan los demás. Además, el modal se abre tan pronto termina la mano, sin dar tiempo a ver la mano final del showdown ni el reparto del bote.

## What Changes

- Cuando el humano se queda sin fichas en una partida online que **sigue en marcha**, deja de ver el modal de fin de partida y pasa a un estado de eliminado que, tras la pausa de showdown, abre un modal de eliminación con dos acciones: **quedarse a ver la partida** y **volver al menú**.
- Al elegir quedarse, el modal se cierra y la mesa entra en **modo espectador**: se sigue viendo la partida de los amigos en tiempo real (turnos, acciones, cartas comunitarias, showdown y movimiento de fichas), sin poder actuar.
- En modo espectador, el área de acciones muestra un aviso de «Has perdido» en lugar de los botones de juego o de reparto.
- Si el jugador eliminado es el **anfitrión**, su cliente reparte automáticamente la siguiente mano tras el showdown, para que los amigos no se queden esperando a que pulse «Nueva mano». Si sale al menú, el rol de anfitrión pasa a otro jugador como hasta ahora.
- Al elegir **volver al menú** desde el modal de eliminación se conserva la sesión online (como hoy): el menú sigue ofreciendo continuar la partida y, al volver, el jugador se reincorpora como espectador.
- El **modal de fin de partida real** (cuando solo queda un jugador con fichas) se mantiene: clasificación final, revancha solo para el anfitrión y volver al inicio. Solo se abre cuando la partida termina de verdad.
- **Pausa de showdown**: tanto en online como en local, el modal de fin de partida espera un tiempo fijo tras el showdown para que se vea la mano final y el reparto del bote antes de abrirse. En local la espera mantiene su escala por velocidad de juego.
- El aviso de eliminación y el espectador no aplican a partidas de 2 jugadores: si el humano se queda sin fichas, la partida termina y se muestra el modal de fin de partida actual.

## Capabilities

### New Capabilities
- `online-spectator`: comportamiento del jugador que se queda sin fichas en una partida online que continúa (modal de eliminación, quedarse a mirar, aviso de «Has perdido», reparto automático del anfitrión eliminado y reingreso como espectador).

### Modified Capabilities
- `game-over`: se añade la espera en el showdown antes de abrir el modal de fin de partida, aplicable a la partida local y a la online.

## Impact

- **Código:** `src/screens/Game/OnlineGame.tsx` (estado de eliminado/espectador, temporización del modal y reparto automático del anfitrión), `src/screens/Game/Game.tsx` (pausa de showdown en local), `src/screens/Game/gameConfig.ts` (constante de espera), `src/screens/Game/components/ActionButtons.tsx` (aviso de espectador), `src/screens/Game/components/GameTail.tsx` y las props de los layouts (`mobile`/`desktop`, `buildGameLayoutProps.ts`) para alojar el nuevo modal. Nuevo `src/screens/Game/components/EliminationOverlay.tsx`.
- **i18n:** claves nuevas en `src/i18n/locales/es/game.ts` y `src/i18n/locales/en/game.ts` (título y apoyo de eliminación, «Quedarse a ver la partida», aviso de espectador).
- **Reutilización:** se reutilizan `Modal` y `Button` de `src/components/`, `GameOverOverlay` para el fin de partida real y los componentes de mesa existentes (`RivalList`, `ActionLog`, `ShowdownCards`) sin duplicar markup. Se extrae un único componente `EliminationOverlay` para el modal de eliminación y se extiende `ActionButtons` con el aviso de espectador; no se duplica la lógica de fin de partida.
- **Sin cambios** en el motor de juego, el servidor de salas, Redis ni el contrato de red: el espectador consume el mismo estado público ya difundido.
