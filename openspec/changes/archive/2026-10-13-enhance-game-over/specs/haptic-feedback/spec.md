# Spec Delta

## ADDED Requirements

### Requirement: Vibración al terminar la partida
El sistema SHALL emitir una vibración al abrir el modal de fin de partida, con un patrón distinto según el resultado: de éxito si el humano gana y de aviso si pierde.

#### Scenario: Fin de partida con victoria
- **WHEN** el modal de fin de partida se abre y el humano ha ganado la partida
- **THEN** el dispositivo emite una vibración de éxito, una sola vez por partida terminada

#### Scenario: Fin de partida con derrota
- **WHEN** el modal de fin de partida se abre y el humano ha perdido la partida
- **THEN** el dispositivo emite una vibración de aviso, distinta de la de victoria

#### Scenario: Fuera de fin de partida
- **WHEN** termina una mano pero la partida continúa
- **THEN** el dispositivo no emite la vibración de fin de partida

#### Scenario: Vibración desactivada
- **WHEN** el jugador tiene la vibración desactivada y termina la partida
- **THEN** no se emite ninguna vibración
