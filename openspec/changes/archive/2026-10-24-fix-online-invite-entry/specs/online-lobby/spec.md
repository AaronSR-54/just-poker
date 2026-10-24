# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Unirse mediante enlace o QR directo al lobby`
- TO: `### Requirement: Entrada mediante enlace o QR con el código rellenado`

## MODIFIED Requirements

### Requirement: Entrada mediante enlace o QR con el código rellenado

El sistema SHALL permitir unirse a una partida abriendo un enlace de invitación o escaneando su QR, sin necesidad de teclear el código: SHALL mostrar la pantalla de juego con amigos en el modo de unirse con el código de la sala ya rellenado y el nombre disponible para ajustarlo. El sistema no SHALL incorporar al jugador a la sala hasta que confirme la unión. Este comportamiento SHALL ser el mismo haya o no un nombre guardado en el dispositivo.

#### Scenario: Apertura del enlace de invitación

- **WHEN** un jugador abre un enlace de invitación válido de una partida con plazas libres
- **THEN** el sistema le muestra el modo de unirse con el código de esa partida rellenado y no lo incorpora todavía al lobby

#### Scenario: Confirmar la unión

- **WHEN** el jugador confirma la unión desde el paso abierto por el enlace
- **THEN** el sistema lo incorpora al lobby de esa partida

#### Scenario: Confirmar con el nombre propuesto

- **WHEN** el jugador confirma la unión sin escribir nada en el campo de nombre
- **THEN** el sistema entra en la partida con el nombre que se muestra en el campo

#### Scenario: Invitado con nombre guardado

- **WHEN** el jugador tiene un nombre usado anteriormente en el dispositivo y abre un enlace de invitación
- **THEN** el sistema muestra ese nombre como valor inicial del campo y sigue esperando su confirmación

#### Scenario: Invitado sin nombre guardado

- **WHEN** el jugador no tiene ningún nombre usado anteriormente y abre un enlace de invitación
- **THEN** el sistema muestra un nombre generado como valor por defecto y sigue esperando su confirmación

#### Scenario: Enlace de partida no disponible

- **WHEN** un jugador abre un enlace de invitación de una partida llena, ya empezada o inexistente
- **THEN** el sistema muestra que la partida no está disponible, conserva el código rellenado y no lo incorpora

### Requirement: Nombre temporal autogenerado y editable

El sistema SHALL asignar a cada jugador un nombre al entrar en una partida y SHALL permitirle cambiarlo antes de que la partida empiece, sin tratarlo como una cuenta. Si el dispositivo ya tiene un nombre usado anteriormente, el sistema SHALL mostrarlo como valor inicial editable; si no, SHALL generar uno aleatorio. El avatar de cada jugador SHALL derivarse de su nombre de forma genérica. El nombre SHALL tener una longitud máxima de 16 caracteres; al crear la partida, unirse o renombrar, cualquier nombre de más de 16 caracteres SHALL recortarse a 16 tanto en el cliente como en el servidor.

#### Scenario: Nombre aleatorio al entrar

- **WHEN** un jugador sin nombre usado anteriormente entra en una partida privada
- **THEN** el sistema le asigna un nombre aleatorio y muestra un avatar derivado de ese nombre

#### Scenario: Nombre recordado en el dispositivo

- **WHEN** un jugador que ya usó un nombre entra en otra partida o abre una invitación
- **THEN** el sistema muestra ese nombre como valor inicial editable, sin entrar sin confirmación

#### Scenario: Cambiar el nombre antes de empezar

- **WHEN** un jugador cambia su nombre en el paso de unirse o en el lobby antes de que empiece la partida
- **THEN** el nuevo nombre y su avatar actualizado se muestran al resto de jugadores del lobby

#### Scenario: Nombre no persistente

- **WHEN** un jugador entra en otra partida en un dispositivo donde no hay un nombre usado
- **THEN** el sistema le asigna de nuevo un nombre aleatorio en lugar de recuperar una identidad de cuenta

#### Scenario: Nombre más largo de 16 caracteres

- **WHEN** un jugador introduce al crear, unirse o renombrar un nombre de más de 16 caracteres
- **THEN** el sistema fija y muestra únicamente los primeros 16 caracteres de ese nombre

#### Scenario: Límite en el campo de nombre

- **WHEN** un jugador escribe su nombre en el lobby
- **THEN** el campo no admite más de 16 caracteres

## ADDED Requirements

### Requirement: La invitación no abandona el paso de unirse

Tras abrir un enlace de invitación o un QR, el sistema SHALL mantener el paso de unirse visible con el código rellenado hasta que el humano confirme la unión o abandone la pantalla de forma explícita. El sistema no SHALL volver al menú, vaciar el código ni navegar a otra pantalla por sí solo mientras la invitación siga en curso.

#### Scenario: La invitación se mantiene tras abrirla

- **WHEN** el humano abre un enlace de invitación y no actúa
- **THEN** el sistema sigue mostrando el paso de unirse con el código de la partida rellenado

#### Scenario: Reintentar tras un fallo de entrada

- **WHEN** el intento de entrar desde la invitación falla
- **THEN** el sistema mantiene el código en el formulario y permite volver a intentarlo sin tener que abrir el enlace de nuevo
