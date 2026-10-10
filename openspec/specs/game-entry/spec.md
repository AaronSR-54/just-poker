# game-entry Specification

## Purpose

Define cómo las superficies de entrada al juego (el menú de inicio y el hub online) detectan las partidas en curso, ofrecen continuarlas y ofrecen empezar una partida nueva, con una única acción recomendada.

## Requirements

### Requirement: El menú no navega automáticamente
Al entrar al menú de inicio, aunque exista una o varias partidas en curso, el sistema SHALL mostrar el menú y no SHALL navegar automáticamente a ninguna partida.

#### Scenario: Apertura del menú con partida en curso
- **WHEN** el humano abre el menú de inicio y existe una partida local o una sesión online en curso
- **THEN** el sistema muestra el menú y permanece en él hasta que el humano elige una acción

### Requirement: Dos tarjetas de modo dinámicas
El menú de inicio SHALL mostrar exactamente dos tarjetas, una por modalidad (local y online), y SHALL reflejar en cada una si esa modalidad tiene una partida en curso. La modalidad online solo se muestra cuando el multijugador está disponible.

#### Scenario: Conteo de tarjetas independiente de las partidas
- **WHEN** el humano abre el menú con ninguna, una o las dos modalidades con partida en curso
- **THEN** el menú muestra siempre dos tarjetas (o una si el multijugador está deshabilitado), cada una reflejando el estado de su modalidad

### Requirement: Estado de tarjeta sin partida
Cuando una modalidad no tiene partida en curso, su tarjeta SHALL mostrar el nombre del modo como título y una descripción breve, y activar la tarjeta SHALL empezar una partida nueva.

#### Scenario: Modalidad local sin partida
- **WHEN** el humano abre el menú y no hay partida local en curso
- **THEN** la tarjeta local muestra el título del modo y la descripción, y activarla empieza una partida nueva

### Requirement: Estado de tarjeta con partida en curso
Cuando una modalidad tiene partida en curso, su tarjeta SHALL dividirse en dos filas independientes sin separación: la superior continúa la partida y la inferior, de ancho completo y en outline, empieza una nueva.

#### Scenario: Partida local en curso
- **WHEN** el humano abre el menú y hay una partida local en curso
- **THEN** la tarjeta local muestra el título arriba, «Continuar partida» con su dificultad y número de mano y la flecha abajo, y una fila «Nueva partida» en outline debajo

#### Scenario: Partida online en curso
- **WHEN** el humano abre el menú y hay una sesión online en curso
- **THEN** la tarjeta online muestra el título arriba, «Continuar partida» con el código de sala y el número de jugadores y la flecha abajo, y una fila «Nueva partida» en outline debajo

#### Scenario: Empezar una partida online nueva con otra en curso
- **WHEN** el humano activa la fila «Nueva partida» de la tarjeta online teniendo una sesión online en curso
- **THEN** el sistema muestra el selector de crear o unirse, sin reanudar la sala en curso, y mantiene la sesión anterior disponible para continuarla desde el menú

### Requirement: Fila de continuar y tarjeta recomendada
Una tarjeta con partida en curso SHALL mostrar dos filas: la superior «Continuar partida» (título
del modo, la etiqueta «Continuar partida» en negrita con el contexto resumido y la flecha a la
derecha) y la inferior «Nueva partida». En todo momento SHALL haber **exactamente una fila rellena**
(`bg-bone`): la de continuar en reposo y la señalada al pasar el cursor. La otra fila SHALL mostrar
un contorno con sus **cuatro lados**, de modo que la unión entre las dos filas sea **una sola
línea** (sin doble borde y sin aristas abiertas). Ambas filas SHALL desplazarse a la derecha al
pasar el cursor. El contexto local SHALL ser la dificultad y el número de mano; el online, el código
de sala y el número de jugadores. Una tarjeta sin partida SHALL ser una única fila, rellena si es la
tarjeta destacada y con contorno si no lo es.

#### Scenario: Fila recomendada y fila no recomendada
- **WHEN** una modalidad con partida en curso es la recomendada y otra no
- **THEN** la fila de continuar de las dos se muestra rellena en reposo (con partida la fila de continuar se rellena siempre) y el contorno lo lleva la fila de «Nueva partida»

#### Scenario: Fila rellena en reposo y compañera con contorno completo
- **WHEN** una tarjeta tiene partida en curso y no se pasa el cursor sobre ella
- **THEN** la fila de continuar se muestra rellena y la de «Nueva partida» con contorno en sus cuatro lados

#### Scenario: La fila señalada se rellena y la compañera marca el contorno
- **WHEN** el humano pasa el cursor sobre una de las dos filas de una tarjeta con partida en curso
- **THEN** la fila señalada se muestra rellena y la otra queda con contorno en sus cuatro lados, con una sola línea en la unión

#### Scenario: Unión de una sola línea y sin aristas abiertas
- **WHEN** la tarjeta con partida en curso está en reposo o con una de sus filas señalada
- **THEN** la unión entre las dos filas muestra una sola línea y ninguna fila deja un lado del contorno sin dibujar

#### Scenario: Tarjeta sin partida
- **WHEN** la tarjeta no tiene partida en curso
- **THEN** se muestra como una única fila, rellena si es la tarjeta destacada y con contorno si no lo es

### Requirement: Relleno de la tarjeta destacada
El menú SHALL decidir la tarjeta destacada de las tarjetas **sin** partida en curso: la local cuando
no hay sesión online, y ninguna otra. Una tarjeta sin partida SHALL mostrarse rellena solo si es la
destacada y con contorno en caso contrario. Las tarjetas **con** partida en curso SHALL mostrar
siempre su fila de continuar rellena, con independencia de cuál sea la destacada.

#### Scenario: Sin partidas en curso
- **WHEN** el humano abre el menú sin ninguna partida en curso
- **THEN** la tarjeta local se muestra rellena y la online no

#### Scenario: Dos partidas en curso
- **WHEN** el humano abre el menú con partida local y sesión online en curso
- **THEN** las dos tarjetas muestran rellena su fila de continuar y la de «Nueva partida» con contorno en sus cuatro lados

### Requirement: Ventana de validez de la sesión online
El sistema SHALL considerar la sesión online en curso solo si su última actividad fue hace 2 minutos o menos. Pasada esa ventana, SHALL tratarla como inexistente, mostrar la tarjeta online en estado sin partida y descartar la sesión. La ventana SHALL coincidir con la ventana de expulsión por inactividad del servidor, de modo que la sesión deje de ofrecerse cuando su asiento puede haber caducado.

#### Scenario: Sesión dentro de la ventana
- **WHEN** la última actividad de la sesión online fue hace 1 minuto
- **THEN** la tarjeta online se muestra en estado de partida en curso

#### Scenario: Sesión fuera de la ventana
- **WHEN** la última actividad de la sesión online fue hace más de 2 minutos
- **THEN** la tarjeta online se muestra como sin partida y la sesión se descarta

### Requirement: Red de seguridad al continuar sin sala
Si al continuar una partida online la sala ya no existe, el sistema SHALL descartar la sesión, mostrar un aviso claro y ofrecer volver al menú, dejando la tarjeta online como sin partida.

#### Scenario: Sala cerrada al intentar continuar
- **WHEN** el humano continúa una sesión online cuya sala ya no existe
- **THEN** el sistema descarta la sesión, muestra un aviso de que la partida ya no existe y permite volver al menú

### Requirement: Reanudar desde la pantalla de juego con amigos
Cuando el humano abre la pantalla de juego con amigos sin pedir explícitamente una partida nueva y existe una sesión online en curso (dentro de la ventana de validez), el sistema SHALL mostrar directamente el lobby de esa partida con su código y jugadores. Sin sesión, o cuando el humano llega pidiendo una partida nueva, SHALL mostrar el selector de crear o unirse.

#### Scenario: Entrar con partida en curso
- **WHEN** el humano abre la pantalla de juego con amigos con una sesión online en curso, sin pedir una partida nueva
- **THEN** ve el lobby de su partida, con su código y jugadores, en lugar del selector

#### Scenario: Entrar sin partida en curso
- **WHEN** el humano abre la pantalla de juego con amigos sin sesión en curso
- **THEN** ve las opciones de crear partida y unirse con código

#### Scenario: Entrar pidiendo una partida nueva con otra en curso
- **WHEN** el humano abre la pantalla de juego con amigos pidiendo una partida nueva y tiene una sesión online en curso
- **THEN** ve las opciones de crear partida y unirse con código, en lugar de la sala en curso

#### Scenario: La sesión anterior sigue disponible
- **WHEN** el humano abre una partida nueva, no crea ninguna sala y vuelve al menú
- **THEN** el menú sigue ofreciendo continuar la sesión anterior

### Requirement: Pantalla única de juego con amigos
El sistema SHALL ofrecer crear y unirse a partidas privadas desde una única pantalla: en escritorio, dos columnas con el titular y las tarjetas seleccionables de crear/unirse en la izquierda y el paso activo en la derecha; en móvil, una sola columna con el titular y esas tarjetas sobre el contenido.

#### Scenario: Disposición en escritorio
- **WHEN** el humano abre la pantalla de juego con amigos en escritorio
- **THEN** ve el titular y las tarjetas de crear/unirse en la columna izquierda y el paso activo en la derecha

#### Scenario: Disposición en móvil
- **WHEN** el humano abre la pantalla de juego con amigos en móvil
- **THEN** ve el titular y las tarjetas de crear/unirse sobre el contenido, en una sola columna

### Requirement: Titular de la pantalla
La pantalla de juego con amigos SHALL mostrar un titular con la misma receta tipográfica que la preparación local (una palabra en cursiva y el resto en énfasis), de modo que la columna izquierda no quede vacía.

#### Scenario: Titular visible
- **WHEN** el humano abre la pantalla de juego con amigos
- **THEN** ve un titular con la receta de la preparación local encabezando la columna izquierda

### Requirement: Selección de crear o unirse
La columna izquierda SHALL ofrecer dos tarjetas seleccionables —crear partida y unirse con código—, cada una con una descripción corta, y SHALL mantenerlas visibles marcando la activa. Mientras el humano está dentro de una sala, las dos tarjetas SHALL permanecer visibles pero deshabilitadas, con la activa marcada.

#### Scenario: Modo activo marcado
- **WHEN** el humano está dentro de una sala
- **THEN** ambas tarjetas siguen visibles, la del modo elegido está marcada y las dos quedan deshabilitadas

#### Scenario: Tamaño estable
- **WHEN** el humano alterna entre crear y unirse
- **THEN** las tarjetas mantienen su tamaño, sin crecer ni encogerse

### Requirement: Nombre en el paso activo
Al crear o unirse, el sistema SHALL ofrecer un campo de nombre dentro del panel del paso activo que muestre un nombre genérico como placeholder; si el humano no escribe otro nombre, SHALL usar el nombre genérico. Confirmar SHALL continuar la acción elegida.

#### Scenario: Nombre sugerido
- **WHEN** el humano abre el paso de crear o de unirse
- **THEN** ve un campo de nombre vacío cuyo placeholder es un nombre genérico

#### Scenario: Usar el nombre sugerido
- **WHEN** el humano confirma sin escribir un nombre
- **THEN** se usa el nombre genérico mostrado como placeholder

### Requirement: Entrada de código
Para unirse, el sistema SHALL ofrecer cuatro casillas de dígito que el humano rellena con el teclado de su dispositivo —sin teclado numérico en pantalla— y SHALL habilitar la acción de unirse cuando las cuatro casillas estén completas.

#### Scenario: Escribir el código
- **WHEN** el humano escribe el código de la sala en las casillas con su teclado
- **THEN** puede unirse cuando las cuatro casillas están completas, sin usar un teclado en pantalla

### Requirement: Vista de lobby del anfitrión
Tras crear la partida, el anfitrión SHALL ver el lobby con el código de 4 dígitos copiable, el contexto de la sala (código y número de jugadores), los jugadores que se incorporan en vivo, una acción para empezar la partida (disponible con al menos 2 jugadores), una acción para mostrar el código QR en grande y una acción para abandonar la sala.

#### Scenario: Lobby del anfitrión
- **WHEN** el anfitrión crea la partida
- **THEN** ve su sala, el código y el número de jugadores, los jugadores que entran, la acción de empezar, la de ver el QR en grande y la de abandonar

#### Scenario: Empezar con pocos jugadores
- **WHEN** el anfitrión está solo en la sala
- **THEN** la acción de empezar no está disponible y se indica que se necesitan más jugadores

### Requirement: Vista de lobby del invitado
Al unirse, el invitado SHALL ver el mismo lobby que el anfitrión pero sin la acción de empezar; en su lugar SHALL mostrar un aviso de que se espera al anfitrión.

#### Scenario: Lobby del invitado
- **WHEN** el invitado se une a una partida
- **THEN** ve la sala, el código y los jugadores, sin acción de empezar, y un aviso de espera al anfitrión

### Requirement: Abandonar la sala
El lobby SHALL ofrecer una acción explícita para salir de la sala que devuelva al humano al selector de crear o unirse y libere su plaza.

#### Scenario: Salir de la sala
- **WHEN** el humano pulsa la acción de abandonar la sala
- **THEN** vuelve al selector de crear o unirse y su plaza deja de aparecer para el resto

### Requirement: Entrada por enlace o QR
El enlace y el QR de invitación SHALL codificar la pantalla de juego con amigos con el código de la sala; al abrirla, el sistema SHALL iniciar el flujo de unirse con ese código ya rellenado.

#### Scenario: Abrir una invitación
- **WHEN** el humano abre el enlace o escanea el QR de una invitación
- **THEN** llega a la pantalla de juego con amigos con el código rellenado y el flujo de unirse preparado

### Requirement: Estilo coherente con la preparación local
La pantalla de juego con amigos SHALL presentarse con el mismo lenguaje visual que la preparación de partida local —cabecera de marca, titular, escala tipográfica, contenedor de dos columnas, panel de fondo, tarjetas de jugador, tarjetas seleccionables y CTA con flecha— de modo que ambas se perciban idénticas.

#### Scenario: Comparación visual con la preparación local
- **WHEN** el humano compara la pantalla de juego con amigos con la preparación de partida local
- **THEN** la cabecera, los titulares, el contenedor, los paneles, las tarjetas de jugador, las tarjetas seleccionables y el CTA coinciden en estilo
