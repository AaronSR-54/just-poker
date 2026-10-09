# Proposal

## Why

El smoke manual del refactor (`refactor-full-app`) destapó tres bugs **preexistentes** que degradan la partida local: recargar a mitad de mano pierde la partida, el temporizador del turno se reinicia al abrir/cerrar Ajustes, y en la mano guiada se puede ir all-in saltándose pasos. Se corrigen ahora porque el refactor acaba de tocar estas mismas rutas.

## What Changes

- **Persistencia/reanudación**: al iniciar o jugar una partida local, la URL queda marcada para reanudar, de modo que recargar a mitad de mano restaura mano, fichas, calle y cartas del humano en vez de repartir una partida nueva.
- **Temporizador de turno**: al abrir Ajustes el turno del humano se pausa conservando el tiempo restante; al cerrar se reanuda desde ese punto, sin reiniciar la cuenta.
- **Mano guiada**: se impide el all-in; la subida se acota por debajo del importe de all-in para no ganar la mano antes de tiempo ni saltarse pasos del tutorial.

## Capabilities

### New Capabilities

- `game-persistence`: guardado y reanudación de la partida local en curso.
- `turn-timer`: cuenta atrás del turno humano, incluidas sus pausas.
- `guided-tutorial`: comportamiento de la mano guiada y las acciones permitidas al humano.

### Modified Capabilities

Ninguna.

## Impact

- **Código**: `src/screens/Game/hooks/useLocalGameInit.ts` (reanudación), `src/screens/Game/hooks/useTurnTimer.ts` y `src/screens/Game/Game.tsx` (temporizador), y la subida del tutorial en `src/screens/Game/components/{ActionButtons,RaiseControls}.tsx` (+ lógica asociada en `Game.tsx`).
- **Dependencias**: sin cambios.
- **Persistencia**: formato `just-poker-active-game` (`VERSION = 1`) sin cambios.
- **Verificación**: `npx tsc -b`, `npx oxlint src/`, `npm test`, `npm run build` y smoke manual móvil + desktop.
