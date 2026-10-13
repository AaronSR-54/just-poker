# Proposal

## Why

El modal de fin de partida es un final plano: un titular («Has ganado» / «Has perdido»),
una tabla de posiciones y botones. No celebra la victoria ni reconoce el esfuerzo de la
partida, y no ofrece ningún resumen de lo jugado (cuánto duró, cuántas manos). Terminar
una partida no se siente como un momento, sino como un formulario.

## What Changes

- Añadir al modal de fin de partida un **resumen de la partida**: duración total jugada y
  número de manos jugadas.
- Dar a **victoria y derrota tratamientos visualmente distintos** (color y copy de
  apoyo), en lugar de solo cambiar el titular.
- Añadir una **animación de celebración al ganar** (ráfaga de fichas), respetando la
  preferencia de reducción de movimiento y la escala de velocidad de juego.
- **Animar los contadores** de la tabla y del resumen al aparecer el modal.
- Emitir **sonido y vibración al terminar la partida**, distintos según el resultado.
- Medir la duración de la partida como **tiempo con la pantalla de juego abierta**:
  acumula mientras la partida está en primer plano y se **pausa al salir al menú**
  (no cuenta el tiempo que la partida queda aparcada para más tarde). Aplica a local y online.
- Persistir el tiempo acumulado para que, al reanudar una partida aparcada, el cómputo
  continúe desde donde se dejó en lugar de reiniciarse.

## Capabilities

### New Capabilities

- `game-over`: el modal de fin de partida y su retroalimentación de resultado — titular
  diferenciado por resultado, tabla de posiciones, resumen de la partida (duración y
  manos), celebración de victoria, contadores animados y sonido de fin de partida.
- `game-duration`: cómputo del tiempo jugado de una partida — acumula solo mientras la
  pantalla de juego está abierta, se pausa al salir al menú, se reanuda desde el valor
  guardado y expone la duración para mostrarla.

### Modified Capabilities

- `game-persistence`: el guardado de la partida local en curso conserva además el tiempo
  jugado acumulado, para reanudarlo al continuar una partida aparcada.
- `haptic-feedback`: se añade una vibración al terminar la partida, distinta según el
  resultado (victoria o derrota), además de las vibraciones existentes.

## Impact

- Pantalla de fin de partida compartida por local y online: `GameOverOverlay`,
  `GameTail`, `GameLayoutProps` / `buildGameLayoutProps` y las pantallas `Game.tsx` y
  `OnlineGame.tsx`.
- Nuevo cómputo de duración (estado/almacén) integrado en local y online, y en el
  guardado local (`saveGame`).
- i18n es/en (nuevas claves de resumen, duración y copy de resultado).
- Audio (`playSfx`) y háptica (`playHaptic`) existentes; puede requerir un efecto nuevo.
- Reutilización: se reutilizan `Modal`, `Button`, `ChipIcon`, `PokerCard`/helpers de
  manos, `playSfx`/`playHaptic`, los tokens y las recetas de `AGENTS.md`. La ráfaga de
  celebración y los contadores animados se extraen como componentes reutilizables (no
  se duplica markup entre local y online). Sin cambios en el motor de juego.
