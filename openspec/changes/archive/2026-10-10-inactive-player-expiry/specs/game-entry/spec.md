# Spec Delta

## MODIFIED Requirements

### Requirement: Ventana de validez de la sesión online
El sistema SHALL considerar la sesión online en curso solo si su última actividad fue hace 2 minutos o menos. Pasada esa ventana, SHALL tratarla como inexistente, mostrar la tarjeta online en estado sin partida y descartar la sesión. La ventana SHALL coincidir con la ventana de expulsión por inactividad del servidor, de modo que la sesión deje de ofrecerse cuando su asiento puede haber caducado.

#### Scenario: Sesión dentro de la ventana
- **WHEN** la última actividad de la sesión online fue hace 1 minuto
- **THEN** la tarjeta online se muestra en estado de partida en curso

#### Scenario: Sesión fuera de la ventana
- **WHEN** la última actividad de la sesión online fue hace más de 2 minutos
- **THEN** la tarjeta online se muestra como sin partida y la sesión se descarta
