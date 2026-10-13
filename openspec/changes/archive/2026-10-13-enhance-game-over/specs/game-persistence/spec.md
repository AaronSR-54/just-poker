# Spec Delta

## ADDED Requirements

### Requirement: El guardado conserva el tiempo jugado acumulado
El guardado de la partida local en curso SHALL incluir el tiempo jugado acumulado, de modo que al reanudar la partida (por recarga o por «Continuar partida») el cómputo continúe desde ese valor en lugar de reiniciarse.

#### Scenario: Recarga con tiempo acumulado
- **WHEN** el humano está jugando una partida local con un tiempo acumulado y recarga la página
- **THEN** el sistema restaura la partida con el mismo tiempo jugado acumulado

#### Scenario: Reanudar desde el menú conserva el tiempo
- **WHEN** el humano aparca la partida en el menú y después elige «Continuar partida»
- **THEN** el tiempo jugado continúa a partir del valor acumulado guardado, sin contar el tiempo en el menú

#### Scenario: Partida terminada descarta el tiempo
- **WHEN** la partida ha terminado y el humano recarga
- **THEN** el sistema descarta el tiempo acumulado junto con el guardado terminado
