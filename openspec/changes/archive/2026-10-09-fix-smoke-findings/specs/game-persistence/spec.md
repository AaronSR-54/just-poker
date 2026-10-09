# Spec Delta

## Purpose

Guarda y reanuda la partida local en curso para que recargar la página no pierda el progreso de la mano.

## ADDED Requirements

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
