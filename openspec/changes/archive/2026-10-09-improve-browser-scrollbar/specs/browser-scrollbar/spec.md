# Spec Delta

## Purpose

Define la apariencia de las barras de scroll y el esquema de color de los controles nativos en navegadores, para que sean coherentes con el tema oscuro `ink`/`bone` de la app.

## ADDED Requirements

### Requirement: Scrollbars coherentes con el tema
El sistema SHALL mostrar las barras de scroll de los contenedores desplazables con un pulgar y una pista derivados de los tokens del tema (`bone`/`ink`) y con grosor fino, en navegadores de escritorio compatibles, en lugar del estilo nativo claro del navegador.

#### Scenario: Scrollbar temática en navegadores WebKit/Blink
- **WHEN** se abre en Chrome, Edge o Safari una pantalla con contenido desplazable (p. ej. Ajustes o la Guía de manos)
- **THEN** la barra de scroll se muestra fina y con los colores del tema, y no con el estilo nativo claro

#### Scenario: Scrollbar temática en Firefox
- **WHEN** se abre en Firefox una pantalla con contenido desplazable
- **THEN** la barra de scroll se muestra con el color de pulgar y pista del tema y grosor fino

#### Scenario: Scrollbar temática en contenedores superpuestos
- **WHEN** se abre un panel desplazable superpuesto (p. ej. Ajustes o el coach del tutorial)
- **THEN** su barra de scroll usa el mismo estilo temático que el resto de la app

### Requirement: Esquema de color oscuro para los controles nativos
El sistema SHALL declarar un esquema de color oscuro a nivel raíz para que los controles nativos del navegador (desplegables, campos de texto, autofill y la barra de scroll por defecto) se rendericen en esquema oscuro.

#### Scenario: Control nativo en esquema oscuro
- **WHEN** se abre en un navegador de escritorio un control nativo como un desplegable `<select>` o un campo de texto
- **THEN** el control se renderiza con el esquema oscuro del navegador, sin fondo blanco

### Requirement: El desplazamiento existente se mantiene funcional
El sistema SHALL conservar el desplazamiento de todos los contenedores con `overflow` y no alterar el layout ni la usabilidad de la barra de scroll.

#### Scenario: Desplazamiento por rueda, teclado y arrastre
- **WHEN** el contenido de un contenedor desplazable excede su altura visible
- **THEN** el usuario puede seguir desplazándose con la rueda, el trackpad, el teclado y arrastrando el pulgar de la barra
