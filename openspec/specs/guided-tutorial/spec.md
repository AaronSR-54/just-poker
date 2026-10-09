# guided-tutorial Specification

## Purpose

Define el comportamiento de la mano guiada de bienvenida, incluidas las acciones que puede hacer el humano en cada paso.

## Requirements

### Requirement: El tutorial guiado limita las acciones esperadas
El sistema SHALL habilitar en cada paso de la mano guiada solo la acción esperada por el coach (check, call o raise), manteniendo deshabilitadas las demás.

#### Scenario: Solo la acción esperada
- **WHEN** el coach espera una acción concreta en un paso del tutorial
- **THEN** solo el botón de esa acción está habilitado y los demás permanecen deshabilitados

### Requirement: El tutorial guiado no permite all-in
El sistema SHALL impedir que el humano vaya all-in durante la mano guiada, acotando la subida por debajo del importe de all-in y sin ofrecer el atajo de all-in.

#### Scenario: Atajo de all-in no disponible
- **WHEN** el humano abre el panel de subida en la mano guiada
- **THEN** el atajo de all-in no está disponible

#### Scenario: La subida no llega a all-in
- **WHEN** el humano sube en la mano guiada
- **THEN** el importe máximo seleccionable es inferior al all-in, de modo que la mano no se resuelve antes de tiempo ni se saltan pasos del tutorial
