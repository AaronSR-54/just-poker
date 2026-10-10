# Spec Delta

## ADDED Requirements

### Requirement: Salida al menú reanudable
Al salir de una partida online con la acción de volver al menú, el sistema SHALL conservar la sesión en el dispositivo, de modo que el menú siga ofreciendo continuar esa partida, y SHALL notificar la salida a la sala para no bloquear al resto de jugadores.

#### Scenario: Continuar tras salir al menú
- **WHEN** el humano sale de una partida online con la acción de volver al menú
- **THEN** el menú muestra la tarjeta online con «Continuar partida» y, al continuar, se reincorpora a la misma partida

#### Scenario: El resto no queda bloqueado
- **WHEN** el humano sale de una partida online con la acción de volver al menú mientras hay otros jugadores
- **THEN** el resto de jugadores puede seguir jugando (el turno del jugador que sale se resuelve y, si era el anfitrión, otro asume el rol)
