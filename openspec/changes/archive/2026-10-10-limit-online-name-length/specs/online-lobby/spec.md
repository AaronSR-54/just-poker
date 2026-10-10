# Spec Delta

## MODIFIED Requirements

### Requirement: Nombre temporal autogenerado y editable
El sistema SHALL asignar a cada jugador un nombre aleatorio al entrar en una partida y SHALL permitirle cambiarlo antes de que la partida empiece, sin persistirlo como cuenta. El avatar de cada jugador SHALL derivarse de su nombre de forma genérica. El nombre SHALL tener una longitud máxima de 16 caracteres; al crear la partida, unirse o renombrar, cualquier nombre de más de 16 caracteres SHALL recortarse a 16 tanto en el cliente como en el servidor.

#### Scenario: Nombre aleatorio al entrar
- **WHEN** un jugador entra en una partida privada
- **THEN** el sistema le asigna un nombre aleatorio y muestra un avatar derivado de ese nombre

#### Scenario: Cambiar el nombre antes de empezar
- **WHEN** un jugador cambia su nombre en el lobby antes de que empiece la partida
- **THEN** el nuevo nombre y su avatar actualizado se muestran al resto de jugadores del lobby

#### Scenario: Nombre no persistente
- **WHEN** un jugador vuelve a entrar más tarde en otra partida
- **THEN** el sistema le asigna de nuevo un nombre aleatorio en lugar de recordar el anterior

#### Scenario: Nombre más largo de 16 caracteres
- **WHEN** un jugador introduce al crear, unirse o renombrar un nombre de más de 16 caracteres
- **THEN** el sistema fija y muestra únicamente los primeros 16 caracteres de ese nombre

#### Scenario: Límite en el campo de nombre
- **WHEN** un jugador escribe su nombre en el lobby
- **THEN** el campo no admite más de 16 caracteres
