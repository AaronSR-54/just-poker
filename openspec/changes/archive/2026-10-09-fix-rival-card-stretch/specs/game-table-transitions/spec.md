# Spec Delta

## Purpose

Garantiza que la mesa de juego mantenga la geometría de sus asientos durante las transiciones de estado, de modo que los rivales y sus cartas conserven sus proporciones y no se deformen al animar.

## ADDED Requirements

### Requirement: Los asientos de los rivales no se deforman en las transiciones

El sistema SHALL mantener las proporciones de cada asiento de rival y de las cartas asociadas durante las transiciones de estado de la mano, sin estirar ni comprimir su contenido al animar.

#### Scenario: Entrada en showdown

- **WHEN** la mano entra en showdown y aparece el bloque de cartas boca arriba bajo uno o varios rivales
- **THEN** los asientos de los rivales y sus cartas conservan sus proporciones durante la animación, sin estirarse en vertical

#### Scenario: Inicio de una nueva mano

- **WHEN** el jugador pulsa «Nueva mano» y desaparece el bloque de showdown
- **THEN** los asientos de los rivales y sus cartas conservan sus proporciones durante la animación, sin estirarse en vertical

### Requirement: El bloque de showdown tiene geometría estable

El sistema SHALL reservar una altura estable para el bloque de cartas de showdown de cada rival, para que su aparición o desaparición no cambie la altura del asiento ni provoque deformación en el contenido.

#### Scenario: Geometría estable en escritorio y móvil

- **WHEN** un rival tiene o deja de tener cartas de showdown visibles
- **THEN** la altura del bloque de showdown permanece reservada y el contenido del asiento no cambia de tamaño percibido
