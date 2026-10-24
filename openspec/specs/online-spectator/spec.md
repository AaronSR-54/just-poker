# online-spectator Specification

## Purpose

Define qué ve y qué puede hacer un jugador que se queda sin fichas en una partida online que continúa, para que pueda seguir la partida de sus amigos en lugar de recibir un fin de partida que aún no ha llegado.

## Requirements

### Requirement: Aviso de eliminación con la partida en marcha
Cuando el jugador humano se queda sin fichas al terminar una mano y la partida online sigue con otros jugadores, el sistema SHALL mostrarle un aviso de eliminación tras la pausa de showdown, en lugar del modal de fin de partida. El aviso SHALL ofrecer dos acciones: quedarse a ver la partida y volver al menú.

#### Scenario: El humano se queda sin fichas y siguen jugando
- **WHEN** el humano pierde todas sus fichas al terminar una mano y al menos dos jugadores más conservan fichas
- **THEN** tras la pausa de showdown aparece un aviso de eliminación con las acciones de quedarse a ver la partida y volver al menú, y no aparece el modal de fin de partida

#### Scenario: La mano final se ve antes del aviso
- **WHEN** el humano se queda sin fichas en el showdown
- **THEN** la mano final y el reparto del bote se ven antes de que aparezca el aviso de eliminación

#### Scenario: Partida de dos jugadores
- **WHEN** el humano se queda sin fichas y no queda ningún otro jugador con fichas
- **THEN** la partida termina y se muestra el modal de fin de partida actual, sin aviso de eliminación

### Requirement: Modo espectador al quedarse a mirar
Al elegir quedarse a ver la partida, el sistema SHALL cerrar el aviso y mantener al jugador en la mesa como espectador: SHALL seguir mostrando la partida de los demás en tiempo real, SHALL impedirle actuar y SHALL sustituir los controles de acción por un aviso de que ha perdido.

#### Scenario: Elegir quedarse
- **WHEN** el jugador elige quedarse a ver la partida en el aviso de eliminación
- **THEN** el aviso se cierra y la mesa sigue visible con la partida en curso

#### Scenario: Sin controles de acción
- **WHEN** el jugador está eliminado y la partida continúa
- **THEN** el área de acciones muestra un aviso de que ha perdido en lugar de los botones de jugar o de repartir, y no puede realizar ninguna acción de apuesta

#### Scenario: Partida visible en tiempo real
- **WHEN** los amigos siguen jugando tras la eliminación
- **THEN** el espectador ve las mismas cartas comunitarias, turnos, acciones, fichas y showdown que el resto de la mesa

#### Scenario: El aviso no se repite
- **WHEN** el jugador ya se ha quedado a mirar y termina otra mano
- **THEN** el aviso de eliminación no vuelve a abrirse

### Requirement: Fin de partida real visible para el espectador
Cuando la partida termina de verdad, el sistema SHALL mostrar el modal de fin de partida también al jugador eliminado, con la clasificación final, la revancha reservada al anfitrión y la acción de volver al inicio.

#### Scenario: El espectador ve el final
- **WHEN** solo queda un jugador con fichas y el humano eliminado sigue mirando
- **THEN** aparece el modal de fin de partida con el ganador y las acciones disponibles

#### Scenario: Revancha del espectador
- **WHEN** el espectador eliminado no es el anfitrión
- **THEN** no puede lanzar la revancha y ve el aviso de espera al anfitrión

### Requirement: Reparto automático del anfitrión eliminado
Si el jugador eliminado es el anfitrión y se queda a mirar, el sistema SHALL repartir automáticamente la siguiente mano tras el showdown, sin exigirle pulsar ninguna acción, para que el resto de jugadores pueda seguir jugando.

#### Scenario: El anfitrión cae y sigue la partida
- **WHEN** el anfitrión se queda sin fichas, se queda a mirar y la partida continúa
- **THEN** la siguiente mano se reparte automáticamente tras el showdown y los demás jugadores siguen jugando sin esperar al anfitrión

#### Scenario: El anfitrión eliminado sale de la partida
- **WHEN** el anfitrión eliminado elige volver al menú
- **THEN** el rol de anfitrión pasa a otro jugador como en el resto de salidas y la partida continúa

### Requirement: Reingreso como espectador
Al volver al menú desde el aviso de eliminación, el sistema SHALL conservar la sesión online de modo que el menú siga ofreciendo continuar la partida, y al reincorporarse SHALL devolver al jugador a la mesa como espectador de sus amigos.

#### Scenario: Continuar tras salir eliminado
- **WHEN** el jugador eliminado elige volver al menú
- **THEN** el menú muestra la tarjeta online con la opción de continuar la partida

#### Scenario: Reincorporación
- **WHEN** el jugador eliminado vuelve a entrar en esa partida mientras sus amigos siguen jugando
- **THEN** se reincorpora a la mesa como espectador, ve la partida en tiempo real y no puede actuar
