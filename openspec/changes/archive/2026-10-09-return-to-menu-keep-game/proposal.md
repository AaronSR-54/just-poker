# Proposal

## Why

En los ajustes de una partida local, el botón «Salir de la partida» borra el guardado y devuelve al menú. El jugador que solo quiere pausar y volver luego pierde el progreso sin necesidad, aunque la app ya sabe guardar y reanudar partidas en curso.

## What Changes

- El botón de los ajustes dentro de una partida local pasa de «Salir de la partida» a «Volver al menú».
- Al pulsarlo se navega al menú **sin** borrar el guardado, de modo que la partida sigue disponible para reanudar desde el menú («Continuar partida»).
- Se elimina el diálogo de confirmación destructivo asociado a esa acción, ya que dejar de mostrar la mesa no pierde ningún progreso.
- Las partidas terminadas siguen descartándose con normalidad (comportamiento actual de `game-persistence`).
- El tutorial guiado no cambia: no es una partida guardable y queda fuera de este cambio.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `game-persistence`: se añade un requisito para que volver al menú desde los ajustes de una partida local conserve el guardado y permita reanudar, en lugar de borrarlo.

## Impact

- `src/components/GameSettings.tsx` (etiqueta del botón y semántica de la acción).
- `src/screens/Game/Game.tsx` (`leaveGame`/`confirmLeaveGame`, eliminación del borrado del guardado).
- `src/screens/Game/components/GameOverlays.tsx` y `src/components/ConfirmDialog` (retirada del diálogo de confirmación de salida de partida).
- Diccionarios i18n `es`/`en` (`settings.leave` y claves de `game.leave*`).
- Sin cambios en el motor de juego ni en el formato del guardado.
