# Spec Delta

## ADDED Requirements

### Requirement: Espera en el showdown antes del modal
Al terminar la mano que cierra la partida, el sistema SHALL esperar una pausa fija posterior al showdown antes de abrir el modal de fin de partida, tanto en la partida local como en la online, de modo que la mano final y el reparto del bote se vean antes del modal. En local la espera SHALL respetar la velocidad de juego configurada.

#### Scenario: Fin de partida online
- **WHEN** la mano que cierra una partida online termina en showdown
- **THEN** las cartas finales y el reparto del bote se ven durante la pausa antes de que aparezca el modal de fin de partida

#### Scenario: Fin de partida local
- **WHEN** la mano que cierra una partida local termina en showdown
- **THEN** las cartas finales y el reparto del bote se ven durante la pausa antes de que aparezca el modal de fin de partida

#### Scenario: Velocidad de juego en local
- **WHEN** el jugador ha configurado una velocidad de juego más rápida o más lenta en local
- **THEN** la pausa previa al modal se ajusta a esa velocidad manteniendo la proporción con el resto de la partida

#### Scenario: Ajustes abiertos
- **WHEN** el modal de fin de partida corresponde y el jugador tiene los ajustes abiertos
- **THEN** el modal no se abre por debajo de los ajustes y aparece al cerrarlos una vez cumplida la pausa
