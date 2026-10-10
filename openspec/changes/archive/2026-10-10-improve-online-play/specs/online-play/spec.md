# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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
