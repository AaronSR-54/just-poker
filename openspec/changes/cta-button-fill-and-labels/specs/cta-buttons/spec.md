# Spec Delta

## Purpose

Define la forma, el relleno y las etiquetas del botón de acción principal que comparten la preparación de partida local y la entrada de juego con amigos, para que su afordancia de acción sea clara y coherente con el resto de controles de la app.

## ADDED Requirements

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
