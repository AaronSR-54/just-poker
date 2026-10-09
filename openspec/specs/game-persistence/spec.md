# game-persistence Specification

## Purpose

Guarda y reanuda la partida local en curso para que recargar la página no pierda el progreso de la mano.

## Requirements

### Requirement: Reanudar la partida local al recargar
El sistema SHALL restaurar la partida local en curso (cartas del humano, fichas, `handNumber` y calle pendiente) cuando la página se recarga durante la partida, en lugar de iniciar una partida nueva.

#### Scenario: Recarga a mitad de mano
- **WHEN** el humano está jugando una partida local y recarga la página
- **THEN** el sistema restaura el estado guardado (mismas cartas del humano, mismo `handNumber` y mismas fichas) y continúa en la calle pendiente

#### Scenario: Nueva partida seguida de recarga
- **WHEN** el humano empieza una partida local y recarga antes de terminarla
- **THEN** el sistema reanuda esa misma partida en lugar de repartir cartas nuevas

#### Scenario: Recarga tras reanudar desde el menú
- **WHEN** el humano reanuda una partida desde el menú y vuelve a recargar
- **THEN** el sistema sigue restaurando la misma partida guardada

### Requirement: No reanudar partidas terminadas
El sistema SHALL descartar el guardado cuando la partida ha terminado (fin de partida o humano eliminado), de modo que una recarga no reanude una partida acabada.

#### Scenario: Recarga con partida terminada
- **WHEN** la partida ha terminado y el humano recarga
- **THEN** el sistema inicia una partida nueva y no restaura el estado terminado

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
