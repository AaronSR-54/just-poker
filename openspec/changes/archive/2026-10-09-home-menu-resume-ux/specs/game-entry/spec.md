# Spec Delta

## Purpose

Define cómo las superficies de entrada al juego (el menú de inicio y el hub online) detectan las partidas en curso, ofrecen continuarlas y ofrecen empezar una partida nueva, con una única acción recomendada.

## ADDED Requirements

### Requirement: El menú no navega automáticamente

Al entrar al menú de inicio, aunque exista una o varias partidas en curso, el sistema SHALL mostrar el menú y no SHALL navegar automáticamente a ninguna partida.

#### Scenario: Apertura del menú con partida en curso

- **WHEN** el humano abre el menú de inicio y existe una partida local o una sesión online en curso
- **THEN** el sistema muestra el menú y permanece en él hasta que el humano elige una acción

### Requirement: Dos tarjetas de modo dinámicas

El menú de inicio SHALL mostrar exactamente dos tarjetas, una por modalidad (local y online), y SHALL reflejar en cada una si esa modalidad tiene una partida en curso. La modalidad online solo se muestra cuando el multijugador está disponible.

#### Scenario: Conteo de tarjetas independiente de las partidas

- **WHEN** el humano abre el menú con ninguna, una o las dos modalidades con partida en curso
- **THEN** el menú muestra siempre dos tarjetas (o una si el multijugador está deshabilitado), cada una reflejando el estado de su modalidad

### Requirement: Estado de tarjeta sin partida

Cuando una modalidad no tiene partida en curso, su tarjeta SHALL mostrar el nombre del modo como título y una descripción breve, y activar la tarjeta SHALL empezar una partida nueva.

#### Scenario: Modalidad local sin partida

- **WHEN** el humano abre el menú y no hay partida local en curso
- **THEN** la tarjeta local muestra el título del modo y la descripción, y activarla empieza una partida nueva

### Requirement: Estado de tarjeta con partida en curso

Cuando una modalidad tiene partida en curso, su tarjeta SHALL dividirse en dos filas independientes sin separación: la superior continúa la partida y la inferior, de ancho completo y en outline, empieza una nueva.

#### Scenario: Partida local en curso

- **WHEN** el humano abre el menú y hay una partida local en curso
- **THEN** la tarjeta local muestra el título arriba, «Continuar partida» con su dificultad y número de mano y la flecha abajo, y una fila «Nueva partida» en outline debajo

#### Scenario: Partida online en curso

- **WHEN** el humano abre el menú y hay una sesión online en curso
- **THEN** la tarjeta online muestra el título arriba, «Continuar partida» con el código de sala y el número de jugadores y la flecha abajo, y una fila «Nueva partida» en outline debajo

### Requirement: Fila de continuar y tarjeta recomendada

La fila superior de una tarjeta con partida SHALL mostrar el nombre del modo como título y, debajo, la etiqueta «Continuar partida» en negrita con el contexto resumido y la flecha a la derecha. SHALL mostrarse rellena cuando sea la tarjeta recomendada y oscura, sin borde, cuando no lo sea; ambas filas SHALL desplazarse a la derecha al pasar el cursor. El contexto local SHALL ser la dificultad y el número de mano; el online, el código de sala y el número de jugadores.

#### Scenario: Fila recomendada y fila no recomendada

- **WHEN** una modalidad con partida en curso es la recomendada y otra no
- **THEN** la fila de continuar de la recomendada se muestra rellena y la de la otra oscura sin borde

### Requirement: Una única tarjeta recomendada

El menú SHALL destacar una única tarjeta como acción recomendada mediante relleno, y SHALL decidirla con este orden: sin partidas en curso, la local; con una partida en curso, esa; con dos, la modalidad jugada más recientemente. Las demás tarjetas no SHALL mostrarse rellenas.

#### Scenario: Sin partidas en curso

- **WHEN** el humano abre el menú sin ninguna partida en curso
- **THEN** la tarjeta local se muestra rellena y la online no

#### Scenario: Dos partidas en curso

- **WHEN** el humano abre el menú con partida local y sesión online en curso
- **THEN** se destaca rellena la modalidad que se jugó más recientemente

### Requirement: Ventana de validez de la sesión online

El sistema SHALL considerar la sesión online en curso solo si su última actividad fue hace 30 minutos o menos. Pasada esa ventana, SHALL tratarla como inexistente, mostrar la tarjeta online en estado sin partida y descartar la sesión.

#### Scenario: Sesión dentro de la ventana

- **WHEN** la última actividad de la sesión online fue hace 10 minutos
- **THEN** la tarjeta online se muestra en estado de partida en curso

#### Scenario: Sesión fuera de la ventana

- **WHEN** la última actividad de la sesión online fue hace más de 30 minutos
- **THEN** la tarjeta online se muestra como sin partida y la sesión se descarta

### Requirement: Reanudar desde el hub online

En el hub de juego con amigos, cuando haya una sesión online en curso, el bloque de acciones SHALL incluir una opción «Volver a la partida» con su contexto como acción principal, y la opción de crear partida SHALL dejar de ser la principal. Sin partida en curso, el hub SHALL mantener su comportamiento actual.

#### Scenario: Hub con partida en curso

- **WHEN** el humano entra al hub online con una sesión en curso
- **THEN** ve «Volver a la partida» (con sala y jugadores) como acción principal y crear partida como secundaria

#### Scenario: Hub sin partida en curso

- **WHEN** el humano entra al hub online sin sesión en curso
- **THEN** ve las opciones de crear partida y unirse con código como hoy

### Requirement: Red de seguridad al continuar sin sala

Si al continuar una partida online la sala ya no existe, el sistema SHALL descartar la sesión, mostrar un aviso claro y ofrecer volver al menú, dejando la tarjeta online como sin partida.

#### Scenario: Sala cerrada al intentar continuar

- **WHEN** el humano continúa una sesión online cuya sala ya no existe
- **THEN** el sistema descarta la sesión, muestra un aviso de que la partida ya no existe y permite volver al menú
