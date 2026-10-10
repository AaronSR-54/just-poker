# local-game-preparation Specification

## Purpose

Define la disposición de la pantalla de preparación de partida local: cómo se organizan la selección de dificultad y el detalle de la mesa según el ancho de pantalla y cómo se reparte el espacio horizontal entre sus columnas.

## ADDED Requirements

### Requirement: Disposición en una o dos columnas según el ancho

La preparación local SHALL presentar el contenido en dos columnas en tablet y escritorio (a partir de 768 px de ancho), y en una sola columna en móvil (por debajo de 768 px). En la disposición de dos columnas, la selección de dificultad y el titular SHALL ocupar la columna izquierda y el detalle de la mesa seleccionada con su CTA SHALL ocupar la derecha.

#### Scenario: Tablet o escritorio

- **WHEN** el humano abre la preparación local en una pantalla de 768 px o más de ancho
- **THEN** ve la selección de dificultad y el titular a la izquierda y el detalle de la mesa a la derecha

#### Scenario: Móvil

- **WHEN** el humano abre la preparación local en una pantalla de menos de 768 px de ancho
- **THEN** ve el contenido apilado en una sola columna

### Requirement: Columnas de igual ancho

En la disposición de dos columnas, la columna de selección y la de detalle SHALL tener exactamente el mismo ancho, tanto en tablet como en escritorio. El ancho igual SHALL mantenerse al cambiar la dificultad seleccionada.

#### Scenario: Mismo ancho en tablet y escritorio

- **WHEN** el humano ve la preparación local con dos columnas, a cualquier ancho de 768 px o más
- **THEN** ambas columnas miden lo mismo a lo ancho

#### Scenario: Ancho estable al cambiar de dificultad

- **WHEN** el humano selecciona otra dificultad en la disposición de dos columnas
- **THEN** el ancho de ambas columnas no cambia

### Requirement: Descripciones de personaje ajustadas en varias líneas

En la preparación local, las descripciones de los personajes SHALL ajustarse en varias líneas cuando no quepan en una sola, dentro del ancho de su columna, en lugar de recortarse con una elipse.

#### Scenario: Descripción larga

- **WHEN** la descripción de un personaje no cabe en una línea del ancho de su columna
- **THEN** se muestra completa, ajustada en varias líneas, sin elipse
