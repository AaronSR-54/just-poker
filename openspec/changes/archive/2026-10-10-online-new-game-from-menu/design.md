# Design

## Context

See `proposal.md` - Why. Hoy, la tarjeta online del menú navega a `/online` sin distinguir entre
continuar y empezar una partida nueva (`Menu.tsx`). La pantalla `Online` resuelve la sesión al
montar: si hay una sesión activa (`getActiveOnlineSession`), hace `room:join` con su `roomId` y, al
estar la partida empezada, el evento `room:starting` redirige a `/game/online-…`. La sesión se
conserva deliberadamente para poder reanudar (cambio `online-leave-resumable`).

## Goals / Non-Goals

**Goals:**

- Distinguir «empezar una partida nueva» de «entrar en la pantalla de juego con amigos» a secas.
- Mantener la reanudación automática al abrir la pantalla sin esa intención (enlace directo, recarga).

**Non-Goals:**

- No cambia el servidor, las reglas de la sala ni la expulsión por inactividad.
- No cambia el flujo offline ni el almacenamiento de la sesión.

## Decisions

**1. La intención de partida nueva viaja como estado de navegación, no por URL.**
La fila «Nueva partida» navega con `navigate('/online', { state: { newGame: true } })`, y `Online` la
lee con `useLocation().state`. Alternativa considerada: un parámetro `?new`; se descarta porque la
dirección ya transporta `?code=` (requisito «Código de la sala en la dirección») y mezclar intención
y código añade contrato de URL y limpieza. Alternativa: limpiar la sesión al pulsar «Nueva partida»;
se descarta porque abandonaría la partida en curso de inmediato, en contra del comportamiento
acordado (mantenerla reanudable hasta crear/entrar a otra).

**2. `Online` omite la reanudación solo con esa intención explícita.**
En el efecto de montaje, si llega la intención de partida nueva, se salta la rama de sesión y se
muestra el selector (modo por defecto, crear). Sin la intención, se conserva la rama actual de
reanudación. La sesión no se borra: se sustituye sola cuando la sala nueva arranca (`setOnlineSession`
en `room:starting`), reutilizando el flujo existente.

**3. Sin componentes ni helpers nuevos.**
Se reutilizan `CtaCard` (`src/components/CtaCard.tsx`), la pantalla `Online` y
`getActiveOnlineSession` (`src/net/onlineSession.ts`). No hay markup, lógica ni helper duplicado que
extraer: el cambio es una condición y una propiedad de navegación puntuales.

## Risks / Trade-offs

- [El estado de navegación se pierde al recargar o al volver atrás] → En ese caso la pantalla vuelve
  a reanudar la sesión, que es el comportamiento por defecto y sigue siendo correcto.
- [La sesión anterior queda viva tras empezar una partida nueva] → Al crear/unirse a una sala nueva,
  el servidor libera la anterior (la sala caduca por la ventana de inactividad) y la sesión local se
  sustituye; es el comportamiento acordado.
