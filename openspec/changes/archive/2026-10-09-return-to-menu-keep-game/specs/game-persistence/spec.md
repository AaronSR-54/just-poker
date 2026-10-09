# Spec Delta

## ADDED Requirements

### Requirement: Volver al menú conserva la partida local

Al salir de una partida local hacia el menú desde los ajustes, el sistema SHALL conservar el guardado en curso en lugar de borrarlo, de modo que la partida siga disponible para reanudar. La acción por defecto de ese botón SHALL ser «Volver al menú» y SHALL navegar al menú sin pedir confirmación.

#### Scenario: Volver al menú a mitad de mano
- **WHEN** el humano abre los ajustes dentro de una partida local en curso y pulsa «Volver al menú»
- **THEN** el sistema navega al menú sin mostrar un diálogo de confirmación y sin borrar el guardado

#### Scenario: Reanudar tras volver al menú
- **WHEN** el humano vuelve al menú desde los ajustes y después elige «Continuar partida» en el menú
- **THEN** el sistema reanuda la misma partida (mismas cartas del humano, mismo `handNumber` y mismas fichas) en lugar de repartir una partida nueva

### Requirement: La salida del tutorial no altera el guardado

El sistema SHALL mantener el comportamiento del tutorial guiado al salir a través del menú de ajustes, sin crear ni borrar el guardado de la partida local.

#### Scenario: Volver al menú desde el tutorial
- **WHEN** el humano abre los ajustes durante el tutorial guiado y sale al menú
- **THEN** el sistema no modifica el guardado de la partida local existente
