# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Una única tarjeta recomendada`
- TO: `### Requirement: Relleno de la tarjeta destacada`

## MODIFIED Requirements

### Requirement: Fila de continuar y tarjeta recomendada
Una tarjeta con partida en curso SHALL mostrar dos filas: la superior «Continuar partida» (título
del modo, la etiqueta «Continuar partida» en negrita con el contexto resumido y la flecha a la
derecha) y la inferior «Nueva partida». En todo momento SHALL haber **exactamente una fila rellena**
(`bg-bone`): la de continuar en reposo y la señalada al pasar el cursor. La otra fila SHALL mostrar
un contorno con sus **cuatro lados**, de modo que la unión entre las dos filas sea **una sola
línea** (sin doble borde y sin aristas abiertas). Ambas filas SHALL desplazarse a la derecha al
pasar el cursor. El contexto local SHALL ser la dificultad y el número de mano; el online, el código
de sala y el número de jugadores. Una tarjeta sin partida SHALL ser una única fila, rellena si es la
tarjeta destacada y con contorno si no lo es.

#### Scenario: Fila recomendada y fila no recomendada
- **WHEN** una modalidad con partida en curso es la recomendada y otra no
- **THEN** la fila de continuar de las dos se muestra rellena en reposo (con partida la fila de continuar se rellena siempre) y el contorno lo lleva la fila de «Nueva partida»

#### Scenario: Fila rellena en reposo y compañera con contorno completo
- **WHEN** una tarjeta tiene partida en curso y no se pasa el cursor sobre ella
- **THEN** la fila de continuar se muestra rellena y la de «Nueva partida» con contorno en sus cuatro lados

#### Scenario: La fila señalada se rellena y la compañera marca el contorno
- **WHEN** el humano pasa el cursor sobre una de las dos filas de una tarjeta con partida en curso
- **THEN** la fila señalada se muestra rellena y la otra queda con contorno en sus cuatro lados, con una sola línea en la unión

#### Scenario: Unión de una sola línea y sin aristas abiertas
- **WHEN** la tarjeta con partida en curso está en reposo o con una de sus filas señalada
- **THEN** la unión entre las dos filas muestra una sola línea y ninguna fila deja un lado del contorno sin dibujar

#### Scenario: Tarjeta sin partida
- **WHEN** la tarjeta no tiene partida en curso
- **THEN** se muestra como una única fila, rellena si es la tarjeta destacada y con contorno si no lo es

### Requirement: Relleno de la tarjeta destacada
El menú SHALL decidir la tarjeta destacada de las tarjetas **sin** partida en curso: la local cuando
no hay sesión online, y ninguna otra. Una tarjeta sin partida SHALL mostrarse rellena solo si es la
destacada y con contorno en caso contrario. Las tarjetas **con** partida en curso SHALL mostrar
siempre su fila de continuar rellena, con independencia de cuál sea la destacada.

#### Scenario: Sin partidas en curso
- **WHEN** el humano abre el menú sin ninguna partida en curso
- **THEN** la tarjeta local se muestra rellena y la online no

#### Scenario: Dos partidas en curso
- **WHEN** el humano abre el menú con partida local y sesión online en curso
- **THEN** las dos tarjetas muestran rellena su fila de continuar y la de «Nueva partida» con contorno en sus cuatro lados
