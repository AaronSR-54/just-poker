# Design

## Context

See `proposal.md` - Why. La tarjeta de modo del menú es un único componente reutilizable,
`CtaCard` (`src/components/CtaCard.tsx`). Con partida en curso (`hasGame`) renderiza dos filas
apiladas sin separación (`gap-0`); sin partida, una única fila. El contenedor de la pantalla
(`src/screens/Menu.tsx`) tiene fondo oscuro.

En el menú anterior la fila de continuar de la tarjeta no recomendada se pintaba oscura **sin
borde** (se fundía con el fondo) y, al intentar darle contorno, la unión con «Nueva partida»
mostraba un borde doble, o una de las filas se quedaba con un lado sin dibujar al pasar el cursor
(borde inferior/superior comunitario que cambiaba de grosor).

## Goals / Non-Goals

**Goals:**

- Que las dos filas de una tarjeta con partida se perciban como cajas con forma propia sobre el
  fondo oscuro.
- Que la unión entre las dos filas sea una sola línea, sin doble borde ni aristas abiertas, tanto en
  reposo como al pasar el cursor.
- Resolverlo reutilizando `CtaCard`, sin nuevas utilidades CSS ni componentes, y sin cambiar la
  animación ni la transición.

**Non-Goals:**

- Cambiar textos, navegación, store o i18n.
- Introducir un contorno distinto por rol de fila.

## Decisions

**1. Reutilizar `CtaCard`.**
No se introduce ni extrae ningún componente ni helper; ya es el componente compartido del menú.

**2. Exactamente una fila rellena a la vez.**
Con partida en curso, la fila rellena (`bg-bone text-ink`) es la de continuar en reposo y la
señalada al pasar el cursor; la otra fila queda **sin relleno**. Así la compañera siempre es una
caja con contorno completo (los cuatro lados) y la unión es una sola línea, porque solo una de las
dos filas dibuja el lado compartido en cada estado. Alternativas descartadas: ambas filas con
contorno (unión con doble línea) y una fila con un lado omitido (arista abierta al desplazarse).

**3. Contorno de la compañera y sin cambio de grosor.**
La fila sin relleno lleva `border-[1.5px] border-bone/40` en sus cuatro lados; la fila rellena no
lleva borde. El lado compartido lo aporta, según el estado, la fila que queda con contorno, así que
el grosor percibido del borde no cambia al interactuar. Alternativa considerada: realzar el borde en
hover de `bone/40` a `bone`; se descarta porque el usuario lo percibía como un cambio de grosor.
Se descarta también redondear las esquinas interiores al pasar el cursor (no encajaba).

**4. Sin cambios de animación ni transición.**
Se mantiene `rowMotion` tal cual, incluido `hover:translate-x-2` (la fila señalada se desplaza a la
derecha). El hover se detecta por fila con `onMouseEnter`/`onMouseLeave` sobre un estado local
(`hoveredRow`), reutilizando las clases condicionales del JSX.

**5. `highlighted` solo para tarjetas sin partida.**
Con partida en curso la fila de continuar se rellena siempre, así que `highlighted` deja de influir;
solo decide si la fila única de una tarjeta **sin** partida se muestra rellena. En `Menu.tsx` se
elimina el cálculo de «tarjeta recomendada» por fecha (`localAt`/`onlineAt`/`getLastPlayed`), que
queda muerto: `highlightLocal = !onlineSession`.

## Risks / Trade-offs

- [Se pierde la distinción visual de «tarjeta recomendada» con partida en curso] → Aceptado: el
  usuario prefiere las dos tarjetas iguales y un contorno limpio; `highlighted` se reserva a las
  tarjetas sin partida.
- [Contraste bajo de `bone/40` en pantallas con poca luz] → Es el mismo contraste que ya usa el
  resto de la tarjeta; mantenerlo preserva la coherencia del sistema.

## Migration Plan

Cambio visual atómico en `CtaCard` más limpieza en `Menu.tsx`. Sin migración de datos. Revertir es
deshacer los cambios de utilidades y la simplificación del destacado.
