# cta-buttons Specification

## Purpose

Define la forma y presentación del botón de acción principal que comparten la preparación de partida local y la entrada de juego con amigos, para que su afordancia de acción sea clara y coherente con el resto de controles de acción de la app.

## Requirements

### Requirement: Botón de acción principal con extremos totalmente redondeados
El sistema SHALL presentar el botón de acción principal de la preparación local y de la entrada de juego con amigos con los extremos totalmente redondeados (forma de píldora), en lugar de un rectángulo de esquinas ligeramente redondeadas.

#### Scenario: Botón de jugar en local
- **WHEN** el humano abre la preparación de partida local
- **THEN** el botón de acción principal se muestra con los extremos totalmente redondeados (forma de píldora)

#### Scenario: Botones de crear partida y unirse
- **WHEN** el humano abre la entrada de juego con amigos, en el paso de crear o en el de unirse
- **THEN** el botón de acción del paso activo se muestra con los extremos totalmente redondeados (forma de píldora)

### Requirement: La etiqueta, la flecha y los estados del botón se mantienen
El sistema SHALL conservar en el botón de acción principal su etiqueta, su flecha de cola, sus tamaños (compacto y completo), sus variantes visuales, su estado deshabilitado y sus tratamientos de hover, activo y foco; el cambio de forma no SHALL alterar el layout ni las acciones disponibles.

#### Scenario: Estados superpuestos a la nueva forma
- **WHEN** el botón de acción principal está deshabilitado, recibe foco o el cursor pasa por encima
- **THEN** muestra su estado correspondiente (atenuado, contorno de foco o realce) con la forma de píldora, manteniendo su etiqueta y su flecha

### Requirement: El CTA de la preparación local se muestra relleno
El sistema SHALL mostrar el botón de acción principal de la preparación local relleno (fondo claro con texto oscuro), igual que los botones de crear y unirse, en lugar de mostrarlo en contorno.

#### Scenario: CTA local relleno en reposo
- **WHEN** el humano abre la preparación de partida local
- **THEN** el botón de acción principal se muestra relleno, sin necesidad de pasar el cursor por encima

### Requirement: Etiqueta «Empezar partida» en el CTA local
El sistema SHALL etiquetar el botón de acción principal de la preparación local como «Empezar partida» en español y «Start game» en inglés.

#### Scenario: Etiqueta del CTA local según idioma
- **WHEN** el humano abre la preparación de partida local
- **THEN** el botón de acción principal muestra «Empezar partida» en español y «Start game» en inglés

### Requirement: Etiqueta «Unirse a partida» en el CTA de unirse
El sistema SHALL etiquetar el botón de acción principal del paso de unirse como «Unirse a partida» en español y «Join game» en inglés.

#### Scenario: Etiqueta del CTA de unirse según idioma
- **WHEN** el humano abre el paso de unirse de la entrada de juego con amigos
- **THEN** el botón de acción del paso muestra «Unirse a partida» en español y «Join game» en inglés
