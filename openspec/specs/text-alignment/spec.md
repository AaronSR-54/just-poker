# text-alignment Specification

## Purpose
Define cómo se alinea verticalmente el texto visible respecto a los elementos que comparte fila (iconos, fichas, avatares, controles, otros textos y números), para que nada se lea visualmente alto ni bajo y la presentación sea coherente en móvil y en escritorio.

## Requirements

### Requirement: Texto junto a un icono, ficha, control o glifo se centra verticalmente
Cuando un texto comparte fila con un elemento con caja propia (icono, ficha, avatar, control o glifo de acción), el sistema SHALL presentar el texto centrado verticalmente respecto a ese elemento, de modo que ninguno de los dos se lea más alto ni más bajo que el otro.

#### Scenario: Nombre y ficha de posición en un asiento
- **WHEN** un asiento de jugador muestra su nombre junto a una ficha de posición (ciega o botón)
- **THEN** el nombre y la ficha aparecen centrados verticalmente entre sí, sin que ninguno quede visiblemente alto o bajo

#### Scenario: Flecha de acción en una tarjeta de modo
- **WHEN** una tarjeta de modo muestra su descripción o estado junto a la flecha de acción
- **THEN** la flecha aparece centrada verticalmente respecto al bloque de texto que tiene al lado

#### Scenario: Etiqueta del bote y su ficha
- **WHEN** la mesa muestra la etiqueta del bote junto al símbolo de ficha del importe
- **THEN** la ficha aparece centrada verticalmente respecto a la etiqueta

### Requirement: Texto junto a otro texto o número comparte línea base
Cuando un texto comparte fila con otro texto o número, el sistema SHALL alinearlos sobre una misma línea base, de modo que se lean como una sola línea de texto.

#### Scenario: Puesto y nombre en la clasificación
- **WHEN** la clasificación final de la partida muestra el puesto junto al nombre del jugador
- **THEN** el puesto y el nombre se apoyan en la misma línea base

#### Scenario: Etiqueta y valor de un ajuste
- **WHEN** un ajuste muestra su nombre y su valor en la misma fila
- **THEN** el nombre y el valor se apoyan en la misma línea base

#### Scenario: Acción de volver y wordmark de la cabecera
- **WHEN** una pantalla muestra su cabecera con la acción de volver y el wordmark apilado
- **THEN** la acción de volver se apoya en la misma línea base que la primera línea del wordmark

### Requirement: El interlineado no es menor que el tamaño del texto
El sistema SHALL presentar cualquier texto con una altura de línea igual o mayor que su tamaño de fuente, en todos los anchos de ventana, de modo que no se recorte ni se solape consigo mismo.

#### Scenario: Línea secundaria de un asiento
- **WHEN** un asiento muestra una línea secundaria más pequeña (por ejemplo un alias o un apodo)
- **THEN** esa línea se ve completa, sin que sus ascendentes ni descendentes queden recortados, en cualquier ancho de ventana

#### Scenario: Etiqueta grande de una tarjeta seleccionable
- **WHEN** una tarjeta seleccionable muestra una etiqueta de tamaño grande que ocupa dos líneas
- **THEN** las dos líneas no se solapan entre sí

### Requirement: La alineación vertical es coherente en móvil y escritorio
El sistema SHALL mantener la misma alineación vertical de cada texto en todos los anchos de la app, sin que un texto cambie de posición relativa a sus elementos colindantes al pasar de móvil a escritorio.

#### Scenario: Nombre y ficha de posición según el ancho
- **WHEN** un jugador ve el nombre y la ficha de posición en su asiento o en el de un rival
- **THEN** la alineación entre nombre y ficha es la misma en móvil y en escritorio

#### Scenario: Cabecera según el ancho
- **WHEN** una pantalla muestra su cabecera en móvil y en escritorio
- **THEN** la acción de volver mantiene la misma relación vertical con el wordmark en ambos
