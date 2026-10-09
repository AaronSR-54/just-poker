# Spec Delta

## REMOVED Requirements

### Requirement: Reanudar desde el hub online
**Reason**: El «hub online» independiente desaparece: crear/unirse y el lobby se fusionan en una sola pantalla de juego con amigos.
**Migration**: La reanudación se resuelve al abrir la pantalla de juego con amigos (ver «Reanudar desde la pantalla de juego con amigos»).

## ADDED Requirements

### Requirement: Reanudar desde la pantalla de juego con amigos
Cuando el humano abre la pantalla de juego con amigos y existe una sesión online en curso (dentro de la ventana de validez), el sistema SHALL mostrar directamente el lobby de esa partida con su código y jugadores. Sin sesión, SHALL mostrar el selector de crear o unirse.

#### Scenario: Entrar con partida en curso
- **WHEN** el humano abre la pantalla de juego con amigos con una sesión online en curso
- **THEN** ve el lobby de su partida, con su código y jugadores, en lugar del selector

#### Scenario: Entrar sin partida en curso
- **WHEN** el humano abre la pantalla de juego con amigos sin sesión en curso
- **THEN** ve las opciones de crear partida y unirse con código

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
