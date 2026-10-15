# raise-controls Specification

## Purpose
Define la presentación y el comportamiento de los controles de subida de la mesa (atajos rápidos, selector de importe y botón de confirmar), para que la acción de subir se lea de forma coherente con las cantidades de fichas del resto de la interfaz.

## Requirements

### Requirement: El botón de confirmar subida muestra el símbolo de ficha junto al importe

El sistema SHALL mostrar el símbolo de ficha en el botón de confirmar subida, colocado inmediatamente antes del importe, con el mismo tratamiento visual (icono seguido del número) que el bote y los montones de asiento.

#### Scenario: Subida normal en la hoja modal de móvil
- **WHEN** el humano abre los controles de subida en móvil y el importe elegido es inferior a all-in
- **THEN** el botón de confirmar muestra el símbolo de ficha seguido del importe de subida

#### Scenario: Subida normal en el panel de escritorio
- **WHEN** el humano abre los controles de subida en escritorio o tablet y el importe elegido es inferior a all-in
- **THEN** el botón de confirmar muestra el símbolo de ficha seguido del importe de subida, igual que en móvil

#### Scenario: Importe de all-in
- **WHEN** el importe elegido es igual o superior al all-in
- **THEN** el botón de confirmar muestra el símbolo de ficha junto al importe de all-in

### Requirement: La etiqueta, el importe y los estados del botón de subida se mantienen

El sistema SHALL conservar en el botón de confirmar subida su etiqueta («Subir» / «All-in»), su importe, su estado deshabilitado y su tratamiento visual; añadir el símbolo de ficha no SHALL alterar el texto visible ni la acción de subir.

#### Scenario: Estado deshabilitado durante la guía
- **WHEN** la mano guiada abre los controles de subida antes de elegir importe
- **THEN** el botón de confirmar sigue deshabilitado y, al habilitarse, muestra el símbolo de ficha junto a la etiqueta y el importe de subida

#### Scenario: La acción de subir no cambia
- **WHEN** el humano confirma la subida con el símbolo de ficha visible
- **THEN** se aplica la subida con el importe seleccionado, igual que antes del cambio
