# app-links Specification

## Purpose
Permite que los enlaces de invitación a una partida abran la app de Android cuando está instalada y lleven directamente a esa sala, manteniendo el navegador como alternativa cuando la app no está instalada.

## Requirements

### Requirement: La app instalada abre los enlaces de invitación

En dispositivos Android con la app instalada, el sistema SHALL abrir los enlaces de invitación a una partida directamente en la app, sin pasar por el navegador ni mostrar el diálogo de elección de aplicación, y SHALL mostrar la pantalla de juego con amigos en el modo de unirse con el código de la sala rellenado. El sistema no SHALL incorporar al jugador a la sala hasta que confirme la unión.

#### Scenario: Enlace de invitación con la app instalada

- **WHEN** un usuario con la app instalada abre un enlace de invitación válido de una partida
- **THEN** el sistema abre la app en la pantalla de juego con amigos, con el modo de unirse seleccionado y el código de esa partida rellenado

#### Scenario: Apertura sin diálogo de elección

- **WHEN** un usuario con la app instalada abre un enlace de invitación y el dominio está asociado a la app
- **THEN** el sistema abre la app directamente, sin mostrar el selector entre app y navegador

#### Scenario: Invitado sin nombre guardado

- **WHEN** un usuario que nunca ha jugado online abre un enlace de invitación en la app
- **THEN** el sistema muestra el modo de unirse con el código rellenado y un nombre propuesto, sin sacarlo de la pantalla ni vaciar el código

#### Scenario: Invitado con nombre guardado

- **WHEN** un usuario que ya tiene un nombre guardado abre un enlace de invitación en la app
- **THEN** el sistema muestra el modo de unirse con el código rellenado y ese nombre como valor inicial, sin entrar en la sala automáticamente

### Requirement: Sin la app instalada, el enlace abre la sala en el navegador

Cuando el dispositivo no tiene la app instalada, el sistema SHALL abrir el enlace de invitación en el navegador y SHALL mostrar la pantalla de juego con amigos en el modo de unirse con el código rellenado. El sistema no SHALL incorporar al jugador a la sala hasta que confirme la unión.

#### Scenario: Enlace de invitación sin la app instalada

- **WHEN** un usuario sin la app instalada abre un enlace de invitación válido
- **THEN** el sistema abre la pantalla de juego con amigos en el navegador, con el modo de unirse seleccionado y el código de esa partida rellenado

#### Scenario: Misma entrada en web y en app

- **WHEN** un usuario abre el mismo enlace de invitación en el navegador o en la app
- **THEN** el sistema lo lleva en ambos casos al mismo paso de unirse con el código rellenado

### Requirement: El código de la sala viaja con el enlace de invitación

El sistema SHALL conservar el código de la sala al abrir el enlace en la app o en el navegador y SHALL rellenarlo en el paso de unirse, de modo que el usuario acabe en la misma sala que indicaba el enlace al confirmar. Si la sala no está disponible, el sistema SHALL conservar el código rellenado y explicar por qué no puede entrar.

#### Scenario: Arranque en frío desde el enlace

- **WHEN** la app no estaba abierta y el usuario la inicia abriendo un enlace de invitación
- **THEN** la app se abre en el paso de unirse con el código de ese enlace rellenado

#### Scenario: Partida no disponible al abrir el enlace

- **WHEN** el usuario abre un enlace de invitación de una partida llena, ya empezada o inexistente
- **THEN** el sistema muestra que la partida no está disponible, mantiene el código rellenado y no lo incorpora a ninguna sala

### Requirement: Recibir enlaces con la app ya en marcha

Cuando la app ya está abierta o en segundo plano, el sistema SHALL traerla al frente al abrir un enlace de invitación y SHALL mostrar el modo de unirse con el código de esa partida rellenado, sin incorporar al jugador hasta que confirme. Si ya hay una partida en curso, el sistema SHALL pedir confirmación antes de abandonarla.

#### Scenario: App en segundo plano

- **WHEN** la app está abierta o en segundo plano y el usuario abre un enlace de invitación
- **THEN** el sistema trae la app al frente y muestra el modo de unirse con el código rellenado

#### Scenario: App abierta en otra pantalla

- **WHEN** la app está en el menú o en otra pantalla sin sala y el usuario abre un enlace de invitación
- **THEN** el sistema navega a la pantalla de juego con amigos y muestra el modo de unirse con el código rellenado

### Requirement: Solo los enlaces de invitación abren la app

El sistema SHALL abrir en la app únicamente los enlaces de invitación a partidas; cualquier otro enlace del mismo dominio SHALL seguir abriéndose en el navegador.

#### Scenario: Enlace que no es de invitación

- **WHEN** el usuario abre en el dominio un enlace que no es de invitación a una partida
- **THEN** el sistema lo abre en el navegador y no en la app
