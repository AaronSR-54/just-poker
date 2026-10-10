# Spec Delta

## MODIFIED Requirements

### Requirement: Estado de tarjeta con partida en curso
Cuando una modalidad tiene partida en curso, su tarjeta SHALL dividirse en dos filas independientes sin separación: la superior continúa la partida y la inferior, de ancho completo y en outline, empieza una nueva.

#### Scenario: Partida local en curso
- **WHEN** el humano abre el menú y hay una partida local en curso
- **THEN** la tarjeta local muestra el título arriba, «Continuar partida» con su dificultad y número de mano y la flecha abajo, y una fila «Nueva partida» en outline debajo

#### Scenario: Partida online en curso
- **WHEN** el humano abre el menú y hay una sesión online en curso
- **THEN** la tarjeta online muestra el título arriba, «Continuar partida» con el código de sala y el número de jugadores y la flecha abajo, y una fila «Nueva partida» en outline debajo

#### Scenario: Empezar una partida online nueva con otra en curso
- **WHEN** el humano activa la fila «Nueva partida» de la tarjeta online teniendo una sesión online en curso
- **THEN** el sistema muestra el selector de crear o unirse, sin reanudar la sala en curso, y mantiene la sesión anterior disponible para continuarla desde el menú

### Requirement: Reanudar desde la pantalla de juego con amigos
Cuando el humano abre la pantalla de juego con amigos sin pedir explícitamente una partida nueva y existe una sesión online en curso (dentro de la ventana de validez), el sistema SHALL mostrar directamente el lobby de esa partida con su código y jugadores. Sin sesión, o cuando el humano llega pidiendo una partida nueva, SHALL mostrar el selector de crear o unirse.

#### Scenario: Entrar con partida en curso
- **WHEN** el humano abre la pantalla de juego con amigos con una sesión online en curso, sin pedir una partida nueva
- **THEN** ve el lobby de su partida, con su código y jugadores, en lugar del selector

#### Scenario: Entrar sin partida en curso
- **WHEN** el humano abre la pantalla de juego con amigos sin sesión en curso
- **THEN** ve las opciones de crear partida y unirse con código

#### Scenario: Entrar pidiendo una partida nueva con otra en curso
- **WHEN** el humano abre la pantalla de juego con amigos pidiendo una partida nueva y tiene una sesión online en curso
- **THEN** ve las opciones de crear partida y unirse con código, en lugar de la sala en curso

#### Scenario: La sesión anterior sigue disponible
- **WHEN** el humano abre una partida nueva, no crea ninguna sala y vuelve al menú
- **THEN** el menú sigue ofreciendo continuar la sesión anterior
