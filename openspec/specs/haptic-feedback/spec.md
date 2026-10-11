# haptic-feedback Specification

## Purpose

Define cuándo el dispositivo vibra como retroalimentación en la app, cómo el usuario lo activa o desactiva y cómo se degrada en plataformas sin soporte.

## Requirements

### Requirement: Vibración breve en las pulsaciones
El sistema SHALL producir una vibración breve y sutil cada vez que el jugador pulsa un control interactivo habilitado (botones), tanto en el menú como durante la partida y en los ajustes.

#### Scenario: Pulsación de un botón
- **WHEN** el jugador pulsa un botón habilitado
- **THEN** el dispositivo emite una vibración breve

#### Scenario: Pulsación de un control deshabilitado
- **WHEN** el jugador pulsa un botón deshabilitado
- **THEN** no se emite vibración

### Requirement: Vibración al empezar el turno del jugador
El sistema SHALL emitir una vibración cuando el turno pasa a ser del jugador humano y este debe actuar, tanto en partida local como online.

#### Scenario: Inicio del turno propio
- **WHEN** el turno pasa a ser del jugador humano y la mano sigue en curso
- **THEN** el dispositivo emite una vibración de aviso de turno

#### Scenario: Turno de otro jugador
- **WHEN** el turno pasa a ser de un rival
- **THEN** el dispositivo no emite la vibración de aviso de turno

### Requirement: Vibración sutil en la cuenta atrás
El sistema SHALL emitir una vibración breve y sutil en cada pulso de la cuenta atrás del turno propio durante los últimos segundos, para avisar de que el tiempo se agota sin resultar molesta.

#### Scenario: Pulso en los últimos segundos
- **WHEN** la cuenta atrás del turno propio avanza un segundo dentro de los últimos segundos
- **THEN** el dispositivo emite una vibración breve y sutil

#### Scenario: Fuera de los últimos segundos
- **WHEN** la cuenta atrás del turno propio avanza un segundo con tiempo de sobra
- **THEN** el dispositivo no emite la vibración de cuenta atrás

### Requirement: Vibración al agotarse el tiempo del turno
El sistema SHALL emitir una vibración cuando la cuenta atrás del turno propio llega a cero y el turno se resuelve automáticamente.

#### Scenario: Expiración del tiempo del turno
- **WHEN** la cuenta atrás del turno propio llega a cero
- **THEN** el dispositivo emite una vibración de aviso, además de resolver el turno

#### Scenario: Tiempo restante
- **WHEN** la cuenta atrás del turno propio aún tiene tiempo restante
- **THEN** el dispositivo no emite la vibración de expiración

### Requirement: Vibración al ganar una mano
El sistema SHALL emitir una vibración de éxito cuando el jugador humano gana una mano y recibe el bote.

#### Scenario: Victoria del jugador
- **WHEN** el jugador humano gana una mano y se reparte el bote
- **THEN** el dispositivo emite una vibración de éxito, una sola vez por mano

#### Scenario: Victoria de un rival
- **WHEN** un rival gana la mano
- **THEN** el dispositivo no emite la vibración de éxito

### Requirement: Ajuste de vibración desactivable y persistente
El sistema SHALL ofrecer en Ajustes un control para activar o desactivar la vibración, con valor por defecto activado, y SHALL conservar la preferencia elegida entre sesiones y recargas.

#### Scenario: Desactivar la vibración
- **WHEN** el jugador desactiva la vibración en Ajustes
- **THEN** ninguno de los eventos de vibración produce efecto mientras siga desactivada

#### Scenario: Persistencia de la preferencia
- **WHEN** el jugador cambia el ajuste de vibración y vuelve a abrir la app
- **THEN** el ajuste conserva el valor que el jugador había elegido

### Requirement: Degradación sin soporte
El sistema SHALL no producir errores ni alterar el resto de la experiencia cuando la plataforma no puede vibrar.

#### Scenario: Plataforma sin soporte de vibración
- **WHEN** ocurre un evento de vibración en un dispositivo o navegador que no la soporta
- **THEN** la app continúa con normalidad y no se emite ningún mensaje de error
