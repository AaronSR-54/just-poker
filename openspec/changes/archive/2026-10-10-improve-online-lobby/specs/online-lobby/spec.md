# Spec Delta

## Purpose

Permite a un grupo de personas permanecer en una sala privada anónima, entrar y salir de ella de forma predecible (con confirmación y sin perder la plaza sin querer) y volver a ella tras recargar o reiniciar el navegador.

## ADDED Requirements

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
