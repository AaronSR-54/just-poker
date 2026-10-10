# Proposal

## Why

Cuando hay una sesión online en curso, la fila «Nueva partida» de la tarjeta online del menú abre la
pantalla de juego con amigos, pero esa pantalla reanuda automáticamente la sesión activa y redirige a
la partida en marcha. El resultado es que no se puede empezar una partida online nueva mientras haya
una en curso: la nueva intención se pierde y el humano vuelve a la sala anterior.

## What Changes

- La fila «Nueva partida» de la tarjeta online SHALL abrir el selector de crear/unirse, sin reanudar
  la sesión online activa.
- Abrir la pantalla de juego con amigos **sin** esa intención explícita (p. ej. enlace directo,
  recarga) SHALL seguir reanudando la partida en curso dentro de su ventana de validez.
- La sesión anterior SHALL mantenerse reanudable desde el menú hasta que el humano cree una sala o se
  una a una; en ese momento se sustituye por la nueva.
- No cambian las reglas de la sala, la expulsión por inactividad ni el flujo offline.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `game-entry`: se matiza el requisito de reanudar la sesión online desde la pantalla de juego con
  amigos y el de la tarjeta con partida en curso, para distinguir «empezar una partida nueva» de
  «reanudar la existente».

## Impact

- **Cliente**: `src/screens/Menu.tsx` (la fila «Nueva partida» de la tarjeta online comunica la
  intención de partida nueva) y `src/screens/Online.tsx` (resuelve si reanuda la sesión o muestra el
  selector según esa intención).
- **Reutilización**: se reutilizan `CtaCard` (`src/components/CtaCard.tsx`), la pantalla online
  existente y `getActiveOnlineSession` (`src/net/onlineSession.ts`). No se introducen ni extraen
  componentes, helpers ni textos nuevos.
