# Spec Delta

## Purpose

Define qué orientaciones admite la app según el tipo de dispositivo, para que las tablets puedan usarse tanto en horizontal como en vertical sin dejar de ser usables, mientras los teléfonos conservan la orientación vertical.

## ADDED Requirements

### Requirement: La tablet admite horizontal y vertical

En dispositivos cuyo ancho mínimo de pantalla es de 600dp o superior (tablets), el sistema SHALL permitir la app tanto en orientación horizontal como vertical, siguiendo la rotación del dispositivo, sin fijar un único sentido.

#### Scenario: Rotación a horizontal en tablet

- **WHEN** el usuario sostiene una tablet en orientación horizontal
- **THEN** la app se muestra en horizontal, ocupando el ancho disponible

#### Scenario: Rotación a vertical en tablet

- **WHEN** el usuario sostiene una tablet en orientación vertical
- **THEN** la app se muestra en vertical

#### Scenario: Cambio de orientación en caliente

- **WHEN** el usuario rota una tablet mientras la app está abierta
- **THEN** la interfaz se reacomoda a la nueva orientación sin reiniciar la app ni perder el estado de la partida en curso

### Requirement: El teléfono permanece en vertical

En dispositivos cuyo ancho mínimo de pantalla es inferior a 600dp (teléfonos), el sistema SHALL mantener la app en orientación vertical aunque el dispositivo se rote.

#### Scenario: Rotación de un teléfono

- **WHEN** el usuario gira un teléfono a horizontal con la app abierta
- **THEN** la app permanece en vertical y no cambia de orientación

### Requirement: La interfaz es usable en horizontal

Cuando la pantalla está en horizontal, el sistema SHALL mostrar todas las pantallas sin recortes, con el contenido esencial visible y los controles principales alcanzables y pulsables, incluida la mesa de juego.

#### Scenario: Mesa de juego en horizontal

- **WHEN** se juega una partida con la pantalla en horizontal en una tablet
- **THEN** la mesa, los asientos, el bote y los controles de acción son visibles y usables, sin elementos cortados ni superpuestos

#### Scenario: Pantallas de entrada en horizontal

- **WHEN** el usuario abre el menú, el hub online o los ajustes con la pantalla en horizontal
- **THEN** el contenido y las acciones de cada pantalla siguen siendo visibles y accionables
