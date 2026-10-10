# online-play Specification

## Purpose
Define el comportamiento observable de una partida multijugador en tiempo real entre jugadores reales, con el estado de la mesa compartido, las cartas privadas ocultas y sin controles de velocidad.

## Requirements

### Requirement: Mesa compartida en tiempo real
El sistema SHALL mantener una única partida compartida entre todos los jugadores conectados, de modo que cada acción se refleje en la mesa de los demás sin recargar la página.

#### Scenario: Acción visible para todos
- **WHEN** un jugador realiza una acción en su turno (fold, check, call o raise)
- **THEN** los demás jugadores ven la acción aplicada y el estado actualizado de la mesa (turno, bote y fichas) en tiempo real

#### Scenario: Estado consistente entre jugadores
- **WHEN** dos jugadores observan la misma mano al mismo tiempo
- **THEN** ambos ven la misma información pública de la mesa (jugadores activos, bote, cartas comunitarias y turno)

### Requirement: Cartas privadas ocultas
El sistema SHALL mostrar las cartas de cada jugador únicamente a su dueño durante la mano, y SHALL revelarlas a todos en el showdown.

#### Scenario: Cartas propias
- **WHEN** un jugador mira sus cartas durante la mano
- **THEN** solo él ve sus cartas y los demás las ven boca abajo

#### Scenario: Revelación en el showdown
- **WHEN** la mano llega al showdown o termina
- **THEN** las cartas que correspondan se revelan a todos los jugadores

### Requirement: Turnos entre jugadores reales
El sistema SHALL ceder el turno a cada jugador activo en su momento y SHALL aplicar su acción a la partida compartida, aplicando solo acciones legales.

#### Scenario: Turno del jugador
- **WHEN** es el turno de un jugador
- **THEN** solo ese jugador puede actuar y los demás esperan su acción

#### Scenario: Acción fuera de turno
- **WHEN** un jugador intenta actuar sin ser su turno
- **THEN** el sistema no aplica la acción y la partida continúa sin cambios

### Requirement: Solo jugadores reales
El sistema SHALL jugar la partida únicamente con los jugadores reales presentes en el lobby y SHALL no introducir jugadores controlados por IA.

#### Scenario: Partida iniciada con menos de cuatro
- **WHEN** el anfitrión inicia una partida con 2 o 3 jugadores
- **THEN** la partida se juega solo entre esos jugadores y no aparecen asientos controlados por IA

### Requirement: Gestión de desconexiones y reconexión
El sistema SHALL no bloquear la partida cuando un jugador se desconecta: SHALL resolver su turno automáticamente (check si puede, y si no fold) y SHALL permitir que el jugador se reincorpore recuperando la partida en curso. La identidad de sesión SHALL persistir en el dispositivo mientras la partida siga en marcha, de modo que el reingreso sea posible tras un corte de conexión, una recarga o un cierre de la app.

#### Scenario: Desconexión durante el turno del jugador
- **WHEN** un jugador se desconecta durante su turno
- **THEN** el sistema resuelve su turno automáticamente (check si puede, y si no fold) y la partida continúa

#### Scenario: Reconexión a mitad de mano
- **WHEN** un jugador que se había desconectado vuelve a conectarse a la partida
- **THEN** recupera el estado actual de la mesa y sus cartas privadas y puede seguir jugando

#### Scenario: Reingreso tras cerrar o recargar la app
- **WHEN** un jugador cierra o recarga la app y vuelve a entrar mientras su partida sigue en marcha
- **THEN** el sistema le ofrece volver a la partida y, al hacerlo, recupera el estado actual de la mesa y sus cartas privadas

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

### Requirement: Sin controles de velocidad en el modo online
El sistema SHALL no ofrecer ajustes de velocidad de juego durante una partida online.

#### Scenario: Ajustes en partida online
- **WHEN** un jugador abre los ajustes durante una partida online
- **THEN** no se muestra ningún control de velocidad de juego y la partida mantiene su ritmo fijo
