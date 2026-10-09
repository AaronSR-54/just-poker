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
El sistema SHALL ofrecer crear y unirse a partidas privadas desde una única pantalla: en escritorio, dos columnas con los botones de crear/unirse en la izquierda y el paso activo en la derecha; en móvil, una sola columna con esos botones sobre el contenido.

#### Scenario: Disposición en escritorio
- **WHEN** el humano abre la pantalla de juego con amigos en escritorio
- **THEN** ve los botones crear/unirse en la columna izquierda y el paso activo en la derecha

#### Scenario: Disposición en móvil
- **WHEN** el humano abre la pantalla de juego con amigos en móvil
- **THEN** ve los botones crear/unirse sobre el contenido, en una sola columna

### Requirement: Botones de crear o unirse
La columna izquierda SHALL ofrecer dos botones —crear partida y unirse con código— y SHALL mantenerlos visibles, marcando cuál es el modo activo, también mientras se está en la sala.

#### Scenario: Modo activo marcado
- **WHEN** el humano elige crear o unirse y permanece en la sala
- **THEN** el botón del modo elegido sigue visible y marcado, y el otro sigue disponible

### Requirement: Nombre mediante diálogo
Al crear o unirse, el sistema SHALL solicitar el nombre del jugador en un diálogo modal con un nombre genérico pre-rellenado y una acción para generar otro nombre; confirmar SHALL continuar la acción elegida.

#### Scenario: Nombre pre-rellenado
- **WHEN** el humano elige crear o unirse
- **THEN** se abre un diálogo con un nombre genérico ya escrito y editable

#### Scenario: Generar otro nombre
- **WHEN** el humano pulsa la acción de generar otro nombre
- **THEN** el diálogo muestra un nombre genérico distinto

### Requirement: Vista de lobby del anfitrión
Tras crear la partida, el anfitrión SHALL ver el lobby con el código de 4 dígitos copiable, los jugadores que se incorporan en vivo, una acción para empezar la partida (disponible con al menos 2 jugadores) y una acción para mostrar el código QR en grande.

#### Scenario: Lobby del anfitrión
- **WHEN** el anfitrión crea la partida
- **THEN** ve su sala, el código copiable, los jugadores que entran, la acción de empezar y la de ver el QR en grande

#### Scenario: Empezar con pocos jugadores
- **WHEN** el anfitrión está solo en la sala
- **THEN** la acción de empezar no está disponible y se indica que se necesitan más jugadores

### Requirement: Vista de lobby del invitado
Al unirse, el invitado SHALL ver el mismo lobby que el anfitrión pero sin la acción de empezar; en su lugar SHALL mostrar un aviso de que se espera al anfitrión.

#### Scenario: Lobby del invitado
- **WHEN** el invitado se une a una partida
- **THEN** ve la sala, el código y los jugadores, sin acción de empezar, y un aviso de espera al anfitrión

### Requirement: Entrada por enlace o QR
El enlace y el QR de invitación SHALL codificar la pantalla de juego con amigos con el código de la sala; al abrirla, el sistema SHALL iniciar el flujo de unirse con ese código ya rellenado.

#### Scenario: Abrir una invitación
- **WHEN** el humano abre el enlace o escanea el QR de una invitación
- **THEN** llega a la pantalla de juego con amigos con el código rellenado y el flujo de unirse preparado

### Requirement: Estilo coherente con la preparación local
La pantalla de juego con amigos SHALL presentarse con el mismo lenguaje visual que la preparación de partida local —cabecera de marca, escala tipográfica, contenedor de dos columnas, panel de fondo y tarjetas de jugador— de modo que ambas se perciban idénticas.

#### Scenario: Comparación visual con la preparación local
- **WHEN** el humano compara la pantalla de juego con amigos con la preparación de partida local
- **THEN** la cabecera, los títulos, el contenedor, los paneles y las tarjetas de jugador coinciden en estilo
