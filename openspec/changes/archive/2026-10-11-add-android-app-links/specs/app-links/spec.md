# Spec Delta

## Purpose

Permite que los enlaces de invitación a una partida abran la app de Android cuando está instalada y lleven directamente a esa sala, manteniendo el navegador como alternativa cuando la app no está instalada.

## ADDED Requirements

### Requirement: La app instalada abre los enlaces de invitación

En dispositivos Android con la app instalada, el sistema SHALL abrir los enlaces de invitación a una partida directamente en la app, sin pasar por el navegador ni mostrar el diálogo de elección de aplicación, e incorporar al usuario a la sala indicada.

#### Scenario: Enlace de invitación con la app instalada

- **WHEN** un usuario con la app instalada abre un enlace de invitación válido de una partida
- **THEN** el sistema abre la app y lo incorpora a la sala indicada

#### Scenario: Apertura sin diálogo de elección

- **WHEN** un usuario con la app instalada abre un enlace de invitación y el dominio está asociado a la app
- **THEN** el sistema abre la app directamente, sin mostrar el selector entre app y navegador

### Requirement: Sin la app instalada, el enlace abre la sala en el navegador

Cuando el dispositivo no tiene la app instalada, el sistema SHALL abrir el enlace de invitación en el navegador y SHALL incorporar al usuario a la sala indicada.

#### Scenario: Enlace de invitación sin la app instalada

- **WHEN** un usuario sin la app instalada abre un enlace de invitación válido
- **THEN** el sistema abre la sala en el navegador y lo incorpora a esa sala

### Requirement: El código de la sala viaja con el enlace de invitación

El sistema SHALL conservar el código de la sala al abrir el enlace en la app, de modo que el usuario acabe en la misma sala que indicaba el enlace.

#### Scenario: Arranque en frío desde el enlace

- **WHEN** la app no estaba abierta y el usuario la inicia abriendo un enlace de invitación
- **THEN** la app se abre en la sala correspondiente a ese código

#### Scenario: Partida no disponible al abrir el enlace

- **WHEN** el usuario abre un enlace de invitación de una partida llena, ya empezada o inexistente
- **THEN** el sistema muestra que la partida no está disponible y no lo incorpora a ninguna sala

### Requirement: Recibir enlaces con la app ya en marcha

Cuando la app ya está abierta o en segundo plano, el sistema SHALL traerla al frente al abrir un enlace de invitación y SHALL incorporar al usuario a la sala indicada.

#### Scenario: App en segundo plano

- **WHEN** la app está abierta o en segundo plano y el usuario abre un enlace de invitación
- **THEN** el sistema trae la app al frente y lo incorpora a la sala indicada

### Requirement: Solo los enlaces de invitación abren la app

El sistema SHALL abrir en la app únicamente los enlaces de invitación a partidas; cualquier otro enlace del mismo dominio SHALL seguir abriéndose en el navegador.

#### Scenario: Enlace que no es de invitación

- **WHEN** el usuario abre en el dominio un enlace que no es de invitación a una partida
- **THEN** el sistema lo abre en el navegador y no en la app
