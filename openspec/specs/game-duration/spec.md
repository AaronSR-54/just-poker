# game-duration Specification

## Purpose

Mide cuánto se ha jugado una partida. En local acumula solo el tiempo con la pantalla
de juego abierta; en online es un tiempo compartido de la partida, igual para todos los
jugadores y reiniciado en la revancha.

## Requirements

### Requirement: Tiempo jugado local con la pantalla abierta
En una partida local, el sistema SHALL acumular el tiempo jugado mientras la pantalla de juego está abierta, incluyendo el tiempo con los ajustes abiertos, y SHALL detener la acumulación cuando la pantalla no está en primer plano.

#### Scenario: Jugar varias manos (local)
- **WHEN** el humano juega varias manos con la pantalla de partida local abierta
- **THEN** el tiempo jugado acumulado crece de forma continua

#### Scenario: Ajustes abiertos (local)
- **WHEN** el humano mantiene abiertos los ajustes durante la partida local
- **THEN** el tiempo jugado sigue acumulándose mientras la pantalla de juego permanece abierta

#### Scenario: App en segundo plano (local)
- **WHEN** la pantalla de juego local deja de estar en primer plano
- **THEN** el tiempo jugado deja de acumularse

### Requirement: Pausa al salir al menú y reanudación al continuar (local)
En una partida local, el sistema SHALL pausar el tiempo jugado al salir de la partida hacia el menú y SHALL reanudarlo, desde el valor acumulado, al continuar esa misma partida aparcada.

#### Scenario: Aparcar la partida en el menú
- **WHEN** el humano sale de una partida local hacia el menú y espera un rato antes de continuar
- **THEN** el tiempo jugado acumulado no incluye el tiempo transcurrido en el menú

#### Scenario: Continuar una partida aparcada
- **WHEN** el humano continúa una partida local que había aparcado
- **THEN** el tiempo jugado continúa a partir del valor acumulado antes de aparcarla

### Requirement: La partida local nueva empieza con tiempo a cero
En una partida local, el sistema SHALL iniciar el tiempo jugado en cero al empezar una partida nueva y SHALL descartar el tiempo acumulado de la partida anterior.

#### Scenario: Empezar una partida nueva
- **WHEN** el humano empieza una partida local nueva tras haber jugado otra
- **THEN** el tiempo jugado de la partida nueva empieza en cero

#### Scenario: Revancha
- **WHEN** el humano reinicia la partida local desde el modal de fin de partida
- **THEN** el tiempo jugado se reinicia para la partida reiniciada

### Requirement: Duración compartida de la partida online
En una partida online, el sistema SHALL mostrar a todos los jugadores la misma duración, contada desde el inicio de la partida, y SHALL reiniciarla para todos al empezar una revancha.

#### Scenario: Host e invitado ven el mismo tiempo
- **WHEN** una partida online lleva un rato en curso y termina, y tanto el anfitrión como un invitado ven el fin de partida
- **THEN** ambos muestran la misma duración

#### Scenario: Revancha reinicia para todos
- **WHEN** el anfitrión reinicia la partida online
- **THEN** la duración vuelve a cero para el anfitrión y para los invitados

#### Scenario: Reconectar a una partida en curso
- **WHEN** un jugador se reincorpora a una partida online ya empezada
- **THEN** su duración coincide con la del resto de la mesa

### Requirement: La duración online no se pausa por un jugador
En una partida online, el sistema SHALL seguir contando la duración compartida aunque un jugador salga al menú o ponga la app en segundo plano, siempre que la partida siga en curso.

#### Scenario: Un jugador se ausenta
- **WHEN** un jugador online sale al menú y la partida continúa
- **THEN** la duración compartida sigue avanzando para el resto de la mesa
