# Spec Delta

## ADDED Requirements

### Requirement: Confirmar antes de entrar en otra partida con una en curso

El sistema SHALL pedir confirmación antes de abandonar una partida online en curso para entrar en una sala **distinta**, tanto al abrir un enlace de invitación como al escribir o pegar un código. Se considera partida en curso cualquier sesión online activa, sea un lobby sin empezar o una partida ya empezada. Mientras el humano no confirme, el sistema no SHALL abandonar la partida anterior ni incorporarlo a la nueva.

#### Scenario: Abrir un enlace con una partida ya empezada

- **WHEN** el humano tiene una partida online ya empezada y abre un enlace de invitación con el código de otra sala
- **THEN** el sistema le pregunta si quiere abandonar la partida anterior y entrar en la nueva, sin abandonarla ni entrar en la otra todavía

#### Scenario: Abrir un enlace con un lobby sin empezar

- **WHEN** el humano está en una sala sin empezar y abre un enlace de invitación con el código de otra sala
- **THEN** el sistema le pregunta si quiere abandonar la sala anterior y entrar en la nueva

#### Scenario: Escribir otro código con una partida en curso

- **WHEN** el humano tiene una partida online en curso y escribe o pega el código de otra sala en el flujo de unirse
- **THEN** el sistema le pregunta si quiere abandonar la partida anterior y entrar en la nueva

#### Scenario: Mismo código que la sala actual

- **WHEN** el humano tiene una partida online en curso y abre un enlace o escribe el código de esa misma sala
- **THEN** el sistema no pide confirmación y permanece en su partida

#### Scenario: Confirmar el abandono

- **WHEN** el humano confirma que quiere abandonar la partida anterior y entrar en la nueva
- **THEN** el sistema abandona la partida anterior (libera su plaza y lo notifica al resto) y lo incorpora a la nueva sala

#### Scenario: Cancelar el abandono

- **WHEN** el humano cancela la confirmación
- **THEN** el sistema no abandona la partida anterior y el humano permanece en ella sin cambios

#### Scenario: Destino no disponible tras confirmar

- **WHEN** el humano confirma entrar en una sala que ya no está disponible (inexistente, llena o ya empezada)
- **THEN** el sistema muestra que la partida no está disponible y no lo incorpora a ninguna sala nueva

### Requirement: Continuidad de la sala al recargar

El sistema SHALL conservar en el dispositivo la sala en curso aunque no haya empezado, y al recargar o reabrir la página o la app SHALL reincorporar al humano a esa misma sala sin pedir confirmación y sin llevarlo a otra partida. La sesión SHALL seguir la misma ventana de validez por inactividad que el resto de sesiones online.

#### Scenario: Recargar en una sala sin empezar

- **WHEN** el humano está en una sala sin empezar y recarga la página o reabre la app
- **THEN** el sistema lo reincorpora a esa misma sala, con su código y sus jugadores, sin pedir confirmación

#### Scenario: Sesión antigua de otra partida en el dispositivo

- **WHEN** el humano recarga una sala y en el dispositivo queda registrada una sesión de otra partida
- **THEN** el sistema lo reincorpora a la sala de la dirección y no le pregunta por la partida ajena ni lo lleva a ella

#### Scenario: Sala ya no disponible al recargar

- **WHEN** el humano recarga una sala que ya no existe o cuya ventana de validez ha caducado
- **THEN** el sistema muestra que la partida ya no está disponible y no lo incorpora a ninguna sala

### Requirement: Ventana de gracia en salas sin empezar

Cuando un jugador se desconecta de una sala que no ha empezado (recarga, corte o cierre inesperado), el sistema SHALL conservar su asiento y su rol durante la ventana de gracia, y SHALL reincorporarlo a ese asiento si vuelve dentro de ella. Pasada la ventana sin volver, SHALL liberar su asiento y, si era el último, eliminar la sala y su código. Un abandono explícito de la sala SHALL liberar el asiento de inmediato.

#### Scenario: Reconexión dentro de la ventana

- **WHEN** un jugador se desconecta de una sala sin empezar y vuelve dentro de la ventana
- **THEN** recupera su asiento y ve la sala actualizada, sin duplicar su entrada

#### Scenario: Expulsión pasada la ventana

- **WHEN** un jugador lleva más de la ventana sin reincorporarse a la sala sin empezar
- **THEN** su asiento se libera y, si era el último, la sala se elimina y su código deja de ser válido

#### Scenario: El anfitrión desconectado conserva su rol dentro de la ventana

- **WHEN** el anfitrión se desconecta de una sala sin empezar y vuelve dentro de la ventana
- **THEN** vuelve a ser el anfitrión de esa sala

#### Scenario: Abandono explícito inmediato

- **WHEN** el humano abandona explícitamente una sala sin empezar
- **THEN** su plaza se libera de inmediato, sin esperar la ventana de gracia
