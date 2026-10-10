# Proposal

## Why

Cuando el menú muestra una tarjeta con partida en curso, la fila superior («Continuar partida») y
la inferior («Nueva partida») comparten una unión. En el menú anterior la fila de continuar podía
quedarse oscura **sin borde** sobre el fondo oscuro (se fundía y la tarjeta parecía rota) o, al
intentar darle contorno, la unión mostraba un **borde doble** o una fila se quedaba con un lado del
contorno sin dibujar al pasar el cursor.

## What Changes

- Con partida en curso, la tarjeta mantiene en todo momento **exactamente una fila rellena**
  (`bg-bone`): la de continuar en reposo y la señalada al pasar el cursor.
- La otra fila queda como una caja con **contorno completo en sus cuatro lados**, de modo que la
  unión entre las dos filas es **una sola línea**: sin doble borde y sin aristas abiertas, tanto en
  reposo como al pasar el cursor.
- La fila señalada se sigue desplazando a la derecha al pasar el cursor, con la **misma animación y
  transición** que antes.
- Como la fila de continuar queda rellena también en reposo, la distinción de «tarjeta recomendada»
  deja de aplicar a las tarjetas con partida en curso; solo sigue aplicando a las tarjetas sin
  partida (de una sola fila), que se muestran rellenas si están destacadas.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `game-entry`:
  - se modifica el requisito «Fila de continuar y tarjeta recomendada» (una única fila rellena, la
    compañera con contorno completo y una sola línea en la unión);
  - se renombra «Una única tarjeta recomendada» a «Relleno de la tarjeta destacada» y se modifica:
    el relleno por recomendación solo aplica a las tarjetas sin partida; las que tienen partida
    muestran siempre rellena su fila de continuar.

## Impact

- `src/components/CtaCard.tsx`: estado de hover y recetas de utilidades de las dos filas.
- `src/screens/Menu.tsx`: se elimina el cálculo de tarjeta recomendada por fecha (queda muerto al no
  aplicar a las tarjetas con partida); `highlighted` solo se usa en las tarjetas sin partida.
- `openspec/specs/game-entry/spec.md`: requisito y escenarios.
- Sin cambios en i18n, navegación, store ni dependencias. Se reutiliza el componente existente
  `CtaCard` (no se extrae ni introduce ningún componente nuevo).
