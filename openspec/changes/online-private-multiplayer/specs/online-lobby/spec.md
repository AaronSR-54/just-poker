# Spec Delta

## Purpose

Permite a un grupo de personas crear y unirse a una partida privada de póker sin registrarse, usando un código corto o un enlace/QR compartido, con nombres temporales generados automáticamente.

## ADDED Requirements

### Requirement: Crear una partida privada sin cuenta
El sistema SHALL permitir crear una partida privada sin autenticación ni datos de cuenta, incorporando de inmediato al creador como anfitrión del lobby.

#### Scenario: Creación de partida
- **WHEN** el usuario elige crear una partida desde el modo online
- **THEN** el sistema crea una partida privada y muestra al creador en el lobby como anfitrión

#### Scenario: Sin credenciales
- **WHEN** un usuario entra en el modo online por primera vez
- **THEN** el sistema no solicita registro, usuario ni contraseña

### Requirement: Código de partida de 4 dígitos
El sistema SHALL asignar a cada partida privada un código de 4 dígitos y mostrarlo en el lobby de forma visible y copiable.

#### Scenario: Código visible para el anfitrión
- **WHEN** el anfitrión está en el lobby
- **THEN** el sistema muestra el código de 4 dígitos de la partida y permite copiarlo

#### Scenario: Código inexistente
- **WHEN** un jugador introduce un código que no corresponde a ninguna partida activa
- **THEN** el sistema muestra un error y no entra en ninguna partida

### Requirement: Unirse con código de 4 dígitos
El sistema SHALL permitir unirse a una partida privada introduciendo su código de 4 dígitos, cuando la partida aún no ha empezado y tiene plazas libres.

#### Scenario: Unión con código válido
- **WHEN** un jugador introduce un código válido de una partida que aún no ha empezado
- **THEN** el sistema lo incorpora al lobby de esa partida

#### Scenario: Partida llena o ya empezada
- **WHEN** un jugador introduce el código de una partida llena o que ya ha empezado
- **THEN** el sistema muestra un error y no lo incorpora

### Requirement: Unirse mediante enlace o QR directo al lobby
El sistema SHALL permitir unirse a una partida abriendo un enlace de invitación que apunta directamente a su lobby, sin necesidad de teclear el código.

#### Scenario: Apertura del enlace de invitación
- **WHEN** un jugador abre un enlace de invitación válido de una partida con plazas libres
- **THEN** el sistema lo incorpora directamente al lobby de esa partida

#### Scenario: Enlace de partida no disponible
- **WHEN** un jugador abre un enlace de invitación de una partida llena, ya empezada o inexistente
- **THEN** el sistema muestra que la partida no está disponible y no lo incorpora

### Requirement: Invitación por QR
El sistema SHALL mostrar en el lobby un QR que codifica el enlace directo de invitación a esa partida, de modo que pueda escanearse con la cámara del teléfono.

#### Scenario: QR para invitar
- **WHEN** el anfitrión está en el lobby de una partida privada
- **THEN** el sistema muestra un QR cuyo contenido es el enlace directo al lobby de esa partida

### Requirement: Nombre temporal autogenerado y editable
El sistema SHALL asignar a cada jugador un nombre aleatorio al entrar en una partida y SHALL permitirle cambiarlo antes de que la partida empiece, sin persistirlo como cuenta. El avatar de cada jugador SHALL derivarse de su nombre de forma genérica.

#### Scenario: Nombre aleatorio al entrar
- **WHEN** un jugador entra en una partida privada
- **THEN** el sistema le asigna un nombre aleatorio y muestra un avatar derivado de ese nombre

#### Scenario: Cambiar el nombre antes de empezar
- **WHEN** un jugador cambia su nombre en el lobby antes de que empiece la partida
- **THEN** el nuevo nombre y su avatar actualizado se muestran al resto de jugadores del lobby

#### Scenario: Nombre no persistente
- **WHEN** un jugador vuelve a entrar más tarde en otra partida
- **THEN** el sistema le asigna de nuevo un nombre aleatorio en lugar de recordar el anterior

### Requirement: Lobby de 2 a 4 jugadores reales
El sistema SHALL limitar cada partida privada a un máximo de 4 jugadores y SHALL admitir únicamente jugadores reales, sin rellenar asientos con IA.

#### Scenario: Aforo máximo
- **WHEN** una partida ya tiene 4 jugadores
- **THEN** el sistema no admite a un quinto jugador

#### Scenario: Sin relleno con IA
- **WHEN** una partida tiene menos de 4 jugadores reales
- **THEN** los asientos libres permanecen vacíos y no son ocupados por IA

### Requirement: El anfitrión inicia la partida
El sistema SHALL permitir que solo el anfitrión inicie la partida, y únicamente cuando haya al menos 2 jugadores en el lobby. Si el anfitrión abandona antes de empezar, el sistema SHALL transferir el rol de anfitrión a otro jugador presente.

#### Scenario: Inicio por el anfitrión
- **WHEN** el anfitrión inicia la partida con al menos 2 jugadores
- **THEN** el sistema comienza la partida para todos los jugadores del lobby

#### Scenario: Menos de dos jugadores
- **WHEN** hay menos de 2 jugadores en el lobby
- **THEN** el sistema no permite iniciar la partida

#### Scenario: Intento de inicio por otro jugador
- **WHEN** un jugador que no es el anfitrión intenta iniciar la partida
- **THEN** el sistema no inicia la partida

#### Scenario: Salida del anfitrión antes de empezar
- **WHEN** el anfitrión abandona el lobby antes de que empiece la partida
- **THEN** el sistema asigna el rol de anfitrión a otro de los jugadores presentes
