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

#### Scenario: Consistencia al terminar la mano
- **WHEN** una mano termina
- **THEN** todos los jugadores ven las mismas fichas por jugador (incluido el ganador con lo ganado) y el bote ya repartido

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

### Requirement: Reparto del bote visible tras la mano
Al terminar una mano, el sistema SHALL repartir el bote mostrando las fichas incorporarse a cada ganador, vaciar el bote y actualizar el montón de todos los jugadores con lo ganado.

#### Scenario: Reparto del bote
- **WHEN** una mano termina con uno o varios ganadores
- **THEN** el bote se vacía y el montón de cada ganador muestra las fichas ganadas

#### Scenario: Montón del ganador consistente
- **WHEN** termina la mano y se mira el montón del ganador
- **THEN** tanto el ganador como el resto de jugadores ven su montón final (fichas previas más lo ganado), no el anterior

### Requirement: Fin de partida y revancha en el modo online
Cuando solo queda un jugador con fichas, el sistema SHALL terminar la partida y mostrar el resultado con el ganador y una acción de revancha que solo el anfitrión puede lanzar, además de una acción para salir.

#### Scenario: Fin de partida
- **WHEN** un jugador reúne todas las fichas y los demás se quedan sin ninguna
- **THEN** la partida termina y se muestra el resultado con el ganador y las acciones disponibles

#### Scenario: Revancha del anfitrión
- **WHEN** el anfitrión lanza la revancha tras el fin de partida
- **THEN** todos los jugadores reinician sus fichas y empieza una mano nueva

#### Scenario: Revancha de un invitado
- **WHEN** un invitado intenta lanzar la revancha
- **THEN** la partida no se reinicia

### Requirement: Transición entre calles
Al cerrarse una ronda de apuestas, el sistema SHALL pausar brevemente antes de repartir la siguiente calle o el showdown, en lugar de repartirla de inmediato, de modo que todos puedan ver la acción.

#### Scenario: Pausa entre calles
- **WHEN** se completa una ronda de apuestas y quedan calles por repartir
- **THEN** la siguiente calle aparece tras una pausa breve

#### Scenario: Sincronía de la calle
- **WHEN** se reparte una calle nueva
- **THEN** todos los jugadores ven la misma calle y el mismo turno

### Requirement: Efectos de sonido de la partida online
La partida online SHALL reproducir los mismos efectos de sonido que la partida local (reparto inicial, acciones de apuesta, cartas comunitarias, inicio del turno propio y fichas del bote), respetando el volumen de efectos configurado.

#### Scenario: Reparto y acciones
- **WHEN** empieza una mano o un jugador realiza una acción de apuesta
- **THEN** se reproduce el efecto de sonido correspondiente

#### Scenario: Volumen de efectos a cero
- **WHEN** el volumen de efectos está a cero
- **THEN** no se reproduce ningún sonido de la partida

### Requirement: Temporizador de turno consistente
Todos los jugadores SHALL tener la misma duración de turno, que SHALL mostrarse y ser la que resuelve el turno automáticamente si el jugador no actúa. El sistema SHALL avisar en los últimos segundos y al agotarse, y SHALL reanudar el tiempo restante al cerrar Ajustes.

#### Scenario: Duración única
- **WHEN** es el turno de cualquier jugador
- **THEN** la duración es la misma para todos y coincide con la del turno automático

#### Scenario: Aviso y resolución por tiempo
- **WHEN** quedan pocos segundos del turno o se agota el tiempo
- **THEN** hay aviso sonoro y, al agotarse, se resuelve el turno automáticamente

#### Scenario: Reanudar tras Ajustes
- **WHEN** se cierra Ajustes durante el turno propio
- **THEN** el tiempo del turno continúa donde se quedó

### Requirement: Ajustes acordes al modo online
Los ajustes durante una partida online SHALL mostrar únicamente las acciones aplicables al modo online (volumen, idioma, soporte y salir), sin accesos a Tutorial ni a Guía de manos.

#### Scenario: Sin acciones inaplicables
- **WHEN** un jugador abre los ajustes durante una partida online
- **THEN** no ve accesos a Tutorial ni a Guía de manos

#### Scenario: Acciones aplicables
- **WHEN** el jugador ajusta el volumen, cambia el idioma o elige salir
- **THEN** la acción surte efecto

### Requirement: Salida al menú reanudable
Al salir de una partida online con la acción de volver al menú, el sistema SHALL conservar la sesión en el dispositivo, de modo que el menú siga ofreciendo continuar esa partida, y SHALL notificar la salida a la sala para no bloquear al resto de jugadores.

#### Scenario: Continuar tras salir al menú
- **WHEN** el humano sale de una partida online con la acción de volver al menú
- **THEN** el menú muestra la tarjeta online con «Continuar partida» y, al continuar, se reincorpora a la misma partida

#### Scenario: El resto no queda bloqueado
- **WHEN** el humano sale de una partida online con la acción de volver al menú mientras hay otros jugadores
- **THEN** el resto de jugadores puede seguir jugando (el turno del jugador que sale se resuelve y, si era el anfitrión, otro asume el rol)
