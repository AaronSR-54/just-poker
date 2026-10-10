# online-lobby Specification

## Purpose
Permite a un grupo de personas crear y unirse a una partida privada de póker sin registrarse, usando un código corto o un enlace/QR compartido, con nombres temporales generados automáticamente.

## Requirements

### Requirement: Crear una partida privada sin cuenta
El sistema SHALL permitir crear una partida privada sin autenticación ni datos de cuenta, incorporando de inmediato al creador como anfitrión del lobby.

#### Scenario: Creación de partida
- **WHEN** el usuario elige crear una partida desde el modo online
- **THEN** el sistema crea una partida privada y muestra al creador en el lobby como anfitrión

#### Scenario: Sin credenciales
- **WHEN** un usuario entra en el modo online por primera vez
- **THEN** el sistema no solicita registro, usuario ni contraseña

### Requirement: Código de partida de 4 caracteres alfanuméricos
El sistema SHALL asignar a cada partida privada un código de 4 caracteres alfanuméricos en mayúsculas, formado por letras `A-Z` y dígitos `2-9` y excluyendo los caracteres ambiguos `O`, `0`, `I`, `1` y `L`, y mostrarlo en el lobby de forma visible y copiable.

#### Scenario: Código visible para el anfitrión
- **WHEN** el anfitrión está en el lobby
- **THEN** el sistema muestra el código alfanumérico de la partida y permite copiarlo

#### Scenario: Código sin caracteres ambiguos
- **WHEN** el sistema genera el código de una partida
- **THEN** el código tiene 4 caracteres alfanuméricos en mayúsculas y no contiene `O`, `0`, `I`, `1` ni `L`

#### Scenario: Código inexistente
- **WHEN** un jugador introduce un código que no corresponde a ninguna partida activa
- **THEN** el sistema muestra un error y no entra en ninguna partida

### Requirement: Unirse con código de 4 caracteres alfanuméricos
El sistema SHALL permitir unirse a una partida privada introduciendo su código de 4 caracteres alfanuméricos, cuando la partida aún no ha empezado y tiene plazas libres. El sistema SHALL aceptar el código escrito en cualquier combinación de mayúsculas y minúsculas y normalizarlo a mayúsculas antes de resolverlo.

#### Scenario: Unión con código válido
- **WHEN** un jugador introduce un código válido de una partida que aún no ha empezado
- **THEN** el sistema lo incorpora al lobby de esa partida

#### Scenario: Código en minúsculas
- **WHEN** un jugador introduce un código válido escribiéndolo en minúsculas
- **THEN** el sistema lo reconoce igualmente y lo incorpora al lobby

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

### Requirement: Selección de modo durante la sala
Mientras el humano está dentro de una sala, las tarjetas de modo (crear partida y unirse con código) SHALL permanecer activas, marcando la del modo en uso, de modo que pueda elegir el otro modo.

#### Scenario: Tarjetas activas dentro de la sala
- **WHEN** el humano está dentro de una sala
- **THEN** las dos tarjetas de modo siguen visibles y pulsables, con la del modo en uso marcada

#### Scenario: Elegir el otro modo
- **WHEN** el humano pulsa la tarjeta del modo que no está en uso mientras está dentro de una sala
- **THEN** el sistema pide confirmación para abandonar la sala antes de cambiar de modo

### Requirement: Confirmación al abandonar la sala
Cuando el humano está dentro de una sala y elige el otro modo, usa la acción de volver, o usa el atrás del navegador o de Android, el sistema SHALL pedir confirmación antes de abandonar. Al confirmar SHALL abandonar la sala, liberar su plaza y salir del lobby; al cancelar SHALL permanecer en la sala sin cambios. La confirmación SHALL aplicarse también cuando la sala se abrió por **carga directa** (enlace de invitación o recarga), no solo cuando se llegó a ella navegando dentro de la app.

#### Scenario: Confirmar el cambio de modo
- **WHEN** el humano confirma el abandono al elegir el otro modo
- **THEN** abandona la sala, su plaza deja de aparecer para el resto y vuelve al selector de crear o unirse

#### Scenario: Confirmar al volver
- **WHEN** el humano confirma el abandono al usar la acción de volver
- **THEN** abandona la sala y sale de la pantalla de juego con amigos

#### Scenario: Confirmar con el atrás del navegador o de Android
- **WHEN** el humano usa el atrás del navegador o de Android estando dentro de una sala
- **THEN** el sistema pide confirmación y no navega fuera hasta que el humano confirme

#### Scenario: Atrás del navegador tras abrir el enlace directamente
- **WHEN** el humano entra en la sala por el enlace de invitación (o tras recargar) y usa el atrás del navegador
- **THEN** el sistema pide confirmación igualmente, de modo que al confirmar abandona la sala y libera su plaza (sin quedar como fantasma)

#### Scenario: Cancelar el abandono
- **WHEN** el humano cancela la confirmación de abandono
- **THEN** permanece en la sala con su código y sus jugadores intactos

### Requirement: Invitación directa en el lobby
El lobby SHALL mostrar el código de la sala centrado y activable para copiar el enlace de invitación, y SHALL mostrar a su lado un QR visible que, al activarlo, abra el QR en grande.

#### Scenario: Copiar la invitación
- **WHEN** el humano activa el código de la sala en el lobby
- **THEN** el sistema copia el enlace de invitación y lo confirma

#### Scenario: QR en grande
- **WHEN** el humano activa el QR pequeño del lobby
- **THEN** el sistema muestra el QR en grande

### Requirement: Eliminación de la sala vacía
Cuando el último jugador abandona una sala que no ha empezado, el sistema SHALL eliminar la sala y liberar su código, de modo que el código deje de ser válido para unirse.

#### Scenario: Abandona el último jugador
- **WHEN** el último jugador de una sala sin empezar abandona la sala
- **THEN** la sala y su código se eliminan y el código deja de ser válido

#### Scenario: Otro jugador intenta entrar con ese código
- **WHEN** alguien intenta unirse con el código de una sala ya eliminada
- **THEN** el sistema muestra que no existe ninguna partida con ese código y no entra en ninguna sala

### Requirement: Código de la sala en la dirección
Mientras el humano está dentro de una sala, el sistema SHALL reflejar el código de la sala en la dirección de la pantalla. Al abrir o recargar esa dirección, el sistema SHALL reincorporar al humano a esa misma sala si sigue disponible, o avisar de que ya no existe. Al abandonar la sala, el sistema SHALL retirar el código de la dirección.

#### Scenario: Reflejar el código al entrar
- **WHEN** el humano crea una partida o se une a una sala
- **THEN** la dirección de la pantalla pasa a incluir el código de esa sala

#### Scenario: Recargar o reiniciar el navegador
- **WHEN** el humano recarga o reinicia el navegador estando dentro de una sala y la sala sigue disponible
- **THEN** el sistema lo reincorpora a esa misma sala con su código y sus jugadores

#### Scenario: Volver a una sala que ya no existe
- **WHEN** el humano abre la dirección de una sala que ya no existe
- **THEN** el sistema muestra que la partida ya no existe y no lo incorpora a ninguna sala

#### Scenario: Salir retira el código
- **WHEN** el humano abandona la sala
- **THEN** la dirección deja de incluir el código de la sala

### Requirement: Estado de conexión en el lobby
El lobby SHALL indicar cuándo se ha perdido la conexión con la sala y SHALL indicarlo también al recuperarla. Mientras la conexión esté perdida, el sistema no SHALL presentar el estado de la sala como actualizado.

#### Scenario: Pérdida de conexión
- **WHEN** la conexión con la sala se pierde mientras el humano está en el lobby
- **THEN** el lobby muestra que se ha perdido la conexión en lugar de presentar el estado de la sala como actualizado

#### Scenario: Recuperación de la conexión
- **WHEN** la conexión se recupera y el humano sigue en la sala
- **THEN** el lobby vuelve a mostrar el estado actualizado de la sala sin duplicar la entrada del jugador
