# Proposal

## Why

La partida online funciona (mesa compartida, turnos, reconexión), pero está por detrás de la partida local en todo lo que pasa **al terminar una mano y entre manos**: no hay animación de reparto del bote, el bote y las fichas del ganador se muestran mal (el ganador aparece con menos fichas y el bote nunca se vacía), los netos/deltas se calculan con índices sin rotar (el invitado ve un neto equivocado), no hay fin de partida ni revancha, no se oyen efectos, el temporizador del turno no es consistente ni avisa, no hay pausa entre calles y los ajustes muestran botones que no hacen nada. Todo esto rompe la paridad con el modo local y confunde a los jugadores.

## What Changes

- **Reparto del bote visible**: al terminar la mano, las fichas del bote vuelan hacia los ganadores (misma animación que en local), el bote se vacía y las fichas de cada jugador reflejan lo ganado.
- **Netos y deltas correctos**: tras rotar el estado para cada jugador, `committed` también se rota, de modo que el neto propio y los deltas de los rivales coinciden en todos los dispositivos.
- **Fin de partida y revancha**: cuando solo queda un jugador con fichas, la partida online termina y muestra el overlay de resultado con revancha (la lanza el anfitrión) y salida; deja de quedarse en un callejón sin salida.
- **Transición entre calles**: pausa breve entre rondas de apuestas antes de repartir la siguiente calle, como en local (no repartir la calle de golpe).
- **Efectos de sonido**: la partida online reproduce los mismos SFX que la local (reparto, acciones, cartas comunitarias, turno, fichas).
- **Temporizador de turno consistente**: una única duración de turno para todos (la misma que resuelve el auto check/fold y que resuelve el anfitrión para un rival que no responde), con avisos sonoros y reanudación del tiempo restante al cerrar Ajustes.
- **Ajustes del modo online**: además de ocultar la velocidad, no se muestran acciones que no aplican en online (Tutorial, Guía de manos).

## Capabilities

### New Capabilities
<!-- Ninguna: el comportamiento vive en la capacidad existente online-play. -->

### Modified Capabilities
- `online-play`: se añaden requisitos de reparto del bote, fin de partida/revancha, transición entre calles, efectos de sonido y temporizador de turno; y se refuerzan los requisitos de mesa compartida (consistencia tras la mano) y de ajustes online (solo acciones aplicables).

## Impact

- **UI de la mesa**: `src/screens/Game/OnlineGame.tsx` (usa `usePotAward`, `useGameSounds`, `useTurnTimer`; overlay de fin de partida; ajustes online), y ajustes en `src/components/GameSettings.tsx` para no renderizar acciones no aplicables.
- **Estado online**: `src/net/onlineGameState.ts` (rotar `committed`), `src/net/useOnlineGame.ts` (autoDeal/pausa entre calles, temporizador único, revancha).
- **Reutilización**: se reutilizan `PotAward` y `usePotAward`, `useGameSounds`, `GameOverOverlay`, `TimerBar`, `useTurnTimer` y `GameOverlays`/`GameSettings`; no se crean componentes ni clases nuevas. Cualquier diferencia entre local y online se resuelve por props, no duplicando markup.
- Sin cambios en el servidor ni en el protocolo salvo, si acaso, reemitir la acción de revancha (ya existe `game:restart`).
