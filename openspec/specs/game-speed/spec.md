# game-speed Specification

## Purpose

Define cómo la velocidad de juego elegida determina la duración efectiva de los temporizadores y pausas de la partida local, y cómo estos se mantienen coherentes al cambiarla en mitad de una partida.

## Requirements

### Requirement: Duración efectiva según la velocidad
El sistema SHALL aplicar la velocidad de juego elegida a las esperas de resolución y a la duración del turno, de modo que una velocidad mayor acorte el tiempo real y una menor lo alargue.

#### Scenario: Velocidad alta acorta el turno
- **WHEN** el jugador aumenta la velocidad de juego
- **THEN** la duración real del turno y de las esperas de resolución se reduce en la misma proporción

#### Scenario: Velocidad baja alarga el turno
- **WHEN** el jugador reduce la velocidad de juego
- **THEN** la duración real del turno y de las esperas de resolución aumenta en la misma proporción

### Requirement: Cambiar la velocidad durante el turno propio conserva el tiempo restante
Cuando la velocidad cambia mientras transcurre el turno propio, el sistema SHALL conservar el tiempo restante de forma coherente con la nueva velocidad y SHALL NOT reiniciar la cuenta atrás a la duración completa.

#### Scenario: Subir la velocidad con tiempo restante
- **WHEN** es el turno propio y el jugador aumenta la velocidad mientras aún queda tiempo
- **THEN** el tiempo restante se ajusta a la nueva velocidad y el turno NO vuelve a empezar con la duración completa

#### Scenario: Bajar la velocidad con tiempo restante
- **WHEN** es el turno propio y el jugador reduce la velocidad mientras aún queda tiempo
- **THEN** el tiempo restante se ajusta a la nueva velocidad y el turno NO se resuelve antes de agotar ese tiempo

### Requirement: El tiempo visible coincide con el tiempo que resuelve el turno
El sistema SHALL mostrar el tiempo restante real del turno de forma que el indicador visible y la resolución automática del turno sean coherentes; el sistema SHALL NOT mantener una cuenta paralela que pueda desincronizarse del indicador.

#### Scenario: Indicador coherente tras cambiar la velocidad
- **WHEN** cambia la velocidad durante el turno propio
- **THEN** el indicador de tiempo visible refleja el tiempo restante y el turno se resuelve cuando ese indicador se agota

### Requirement: Cambiar la velocidad no reinicia las pausas de resolución pendientes
Cuando cambia la velocidad mientras hay una espera de resolución pendiente (fin de calle o fin de partida), el sistema SHALL ajustar el tiempo restante de esa espera a la nueva velocidad sin reiniciarla desde el principio.

#### Scenario: Cambio de velocidad durante el fin de calle
- **WHEN** hay una espera de resolución de calle pendiente y cambia la velocidad
- **THEN** la espera continúa desde el tiempo restante ajustado a la nueva velocidad

#### Scenario: Cambio de velocidad durante el fin de partida
- **WHEN** hay una espera antes de mostrar el fin de partida y cambia la velocidad
- **THEN** la espera no se reinicia desde el principio

### Requirement: Cambiar la velocidad durante el turno de un rival no altera su decisión
Cuando la velocidad cambia durante el turno de un rival, el sistema SHALL NOT rehacer la decisión ya en curso, ni extender indebidamente el turno, ni alterar el estado acumulado del rival.

#### Scenario: Cambio de velocidad en el turno del rival
- **WHEN** es el turno de un rival y cambia la velocidad
- **THEN** el rival mantiene su decisión y su turno se resuelve una sola vez
