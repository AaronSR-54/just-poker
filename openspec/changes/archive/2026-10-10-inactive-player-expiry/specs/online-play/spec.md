# Spec Delta

## ADDED Requirements

### Requirement: Expulsión por inactividad
Un jugador que deja de estar en la sala SHALL conservar su asiento durante una ventana de gracia y, pasada esa ventana sin reincorporarse, el sistema SHALL expulsarlo: liberar su asiento, dejar de aceptar su reingreso y avisar al resto. En una partida en curso, el asiento expulsado SHALL eliminarse del juego, de modo que un jugador ausente no pueda ganar la mano ni la partida.

#### Scenario: Reingreso dentro de la ventana de gracia
- **WHEN** un jugador sale de la sala o se desconecta y vuelve a entrar dentro de la ventana de gracia
- **THEN** recupera su asiento y continúa la partida con el estado actual

#### Scenario: Expulsión pasada la ventana de gracia
- **WHEN** un jugador lleva más de la ventana de gracia sin estar en la sala
- **THEN** se le expulsa, su asiento se libera y deja de aceptarse su reingreso

#### Scenario: Un jugador ausente no gana por no apostar
- **WHEN** llega el turno de un jugador ausente
- **THEN** se retira (fold) en vez de seguir en la mano, y no puede ganar el bote ni la partida por estar fuera

#### Scenario: Fin de partida tras la expulsión
- **WHEN** tras expulsar a un jugador solo queda uno con fichas
- **THEN** la partida termina y gana el jugador que permanece
