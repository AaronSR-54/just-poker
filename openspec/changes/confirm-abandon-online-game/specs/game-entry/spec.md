# Spec Delta

## ADDED Requirements

### Requirement: Una sala sin empezar cuenta como sesión online en curso

El sistema SHALL considerar la sesión online en curso también cuando la sala aún no ha empezado, dentro de la ventana de validez. La tarjeta online del menú SHALL ofrecer «Continuar partida» con el código y el número de jugadores, y al continuar SHALL reentrar en el **lobby** de esa sala en lugar de la mesa.

#### Scenario: Lobby sin empezar en el menú

- **WHEN** el humano abre el menú y tiene una sala online sin empezar en curso
- **THEN** la tarjeta online muestra «Continuar partida» con el código de la sala y el número de jugadores

#### Scenario: Continuar entra en el lobby

- **WHEN** el humano continúa esa sesión de una sala sin empezar
- **THEN** el sistema lo reincorpora al lobby de la sala, no a la mesa de juego

#### Scenario: Empezar una partida nueva con un lobby en curso

- **WHEN** el humano activa «Nueva partida» teniendo una sala sin empezar en curso
- **THEN** el sistema muestra el selector de crear o unirse y mantiene la sala anterior disponible para continuarla
