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

### Requirement: Invitación por QR
El sistema SHALL mostrar en el lobby un QR que codifica el enlace directo de invitación a esa partida, de modo que pueda escanearse con la cámara del teléfono. El enlace SHALL usar el origen del despliegue de producción, de modo que el QR siga siendo válido aunque se muestre desde la app nativa; en la web, sin origen configurado, SHALL conservar el mismo origen de la página.

#### Scenario: QR para invitar
- **WHEN** el anfitrión está en el lobby de una partida privada
- **THEN** el sistema muestra un QR cuyo contenido es el enlace directo al lobby de esa partida en el despliegue de producción

#### Scenario: QR mostrado desde la app nativa
- **WHEN** el anfitrión muestra el QR desde la app nativa
- **THEN** el QR codifica el enlace del despliegue de producción y no una dirección local de la app

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

### Requirement: Adaptación a la altura de la pantalla
La pantalla de juego con amigos SHALL adaptar su presentación a la altura disponible: cuando la ventana es baja, SHALL compactar espaciados, tipografía, avatares y tarjetas de modo que las acciones principales (elegir modo, escribir el nombre o el código, crear o unirse e iniciar la partida) permanezcan visibles y no queden recortadas.

#### Scenario: Ventana baja en ancho de móvil
- **WHEN** el humano abre la pantalla en una ventana de poca altura y ancho de móvil
- **THEN** la pantalla compacta su contenido y las acciones principales del flujo permanecen visibles sin recortarse

#### Scenario: Ventana baja en ancho amplio
- **WHEN** el humano abre la pantalla en una ventana de poca altura y ancho amplio (tablet u ordenador)
- **THEN** la pantalla también compacta su contenido en lugar de mantener los espaciados de escritorio

### Requirement: Adaptación a la anchura de la pantalla
En ventanas muy estrechas la pantalla de juego con amigos SHALL evitar el desbordamiento horizontal: el titular, las tarjetas de modo, los campos del código, las tarjetas de jugador y los botones SHALL mostrarse completos dentro de la anchura disponible.

#### Scenario: Sin desbordamiento horizontal
- **WHEN** el humano abre la pantalla en una ventana muy estrecha
- **THEN** ningún contenido se sale lateralmente y no aparece desplazamiento horizontal

#### Scenario: Código usable en ventana estrecha
- **WHEN** el humano escribe el código de la partida en una ventana muy estrecha
- **THEN** los cuatro campos del código se ven completos y se pueden rellenar y leer sin recortes

### Requirement: Organización en una o dos columnas
La pantalla de juego con amigos SHALL apilar su contenido en una sola columna cuando la ventana tiene ancho de móvil, y SHALL mostrar en paralelo el selector de modo y el paso activo cuando la ventana es amplia. En ventanas amplias pero de poca altura, las acciones principales SHALL seguir siendo alcanzables (visibles o desplazables) sin recortarse.

#### Scenario: Ancho de móvil en una columna
- **WHEN** el humano abre la pantalla en una ventana con ancho de móvil
- **THEN** el titular, el selector de modo y el paso activo se apilan en una sola columna

#### Scenario: Ancho amplio en dos columnas
- **WHEN** el humano abre la pantalla en una ventana amplia
- **THEN** el selector de modo y el paso activo se muestran en paralelo

#### Scenario: Ventana amplia y baja con acciones alcanzables
- **WHEN** el humano abre la pantalla en una ventana amplia pero de poca altura
- **THEN** las acciones principales siguen siendo alcanzables sin quedar recortadas

### Requirement: Sin cambios en pantallas amplias y altas
En ventanas amplias y altas, la pantalla de juego con amigos SHALL mantener la presentación sin compactar que ya ofrecía.

#### Scenario: Ventana holgada sin compactar
- **WHEN** el humano abre la pantalla en una ventana amplia y alta
- **THEN** la presentación se muestra sin compactar, como antes del cambio

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

### Requirement: La invitación no abandona el paso de unirse

Tras abrir un enlace de invitación o un QR, el sistema SHALL mantener el paso de unirse visible con el código rellenado hasta que el humano confirme la unión o abandone la pantalla de forma explícita. El sistema no SHALL volver al menú, vaciar el código ni navegar a otra pantalla por sí solo mientras la invitación siga en curso.

#### Scenario: La invitación se mantiene tras abrirla

- **WHEN** el humano abre un enlace de invitación y no actúa
- **THEN** el sistema sigue mostrando el paso de unirse con el código de la partida rellenado

#### Scenario: Reintentar tras un fallo de entrada

- **WHEN** el intento de entrar desde la invitación falla
- **THEN** el sistema mantiene el código en el formulario y permite volver a intentarlo sin tener que abrir el enlace de nuevo
