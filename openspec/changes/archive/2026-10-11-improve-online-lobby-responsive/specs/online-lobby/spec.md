# Spec Delta

## ADDED Requirements

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
