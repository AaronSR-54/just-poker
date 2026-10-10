# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Código de partida de 4 dígitos`
- TO: `### Requirement: Código de partida de 4 caracteres alfanuméricos`
- FROM: `### Requirement: Unirse con código de 4 dígitos`
- TO: `### Requirement: Unirse con código de 4 caracteres alfanuméricos`

## MODIFIED Requirements

### Requirement: Código de partida de 4 caracteres alfanuméricos
El sistema SHALL asignar a cada partida privada un código de 4 caracteres alfanuméricos en mayúsculas, formado por letras `A-Z` y dígitos `2-9` y excluyendo los caracteres ambiguos `O`, `0`, `I`, `1` y `L`, y mostrarlo en el lobby de forma visible y copiable.

#### Scenario: Código visible para el anfitrión
- **WHEN** el anfitrión está en el lobby
- **THEN** el sistema muestra el código alfanumérico de la partida y permite copiarlo

#### Scenario: Código sin caracteres ambiguos
- **WHEN** el sistema genera el código de una partida
- **THEN** el código tiene 4 caracteres alfanuméricos en mayúsculas y no contiene `O`, `0`, `I`, `1` ni `L`

#### Scenario: Código inexistente
- **WHEN** un jugador introduce un código que no corresponde a ninguna partida activa
- **THEN** el sistema muestra un error y no entra en ninguna partida

### Requirement: Unirse con código de 4 caracteres alfanuméricos
El sistema SHALL permitir unirse a una partida privada introduciendo su código de 4 caracteres alfanuméricos, cuando la partida aún no ha empezado y tiene plazas libres. El sistema SHALL aceptar el código escrito en cualquier combinación de mayúsculas y minúsculas y normalizarlo a mayúsculas antes de resolverlo.

#### Scenario: Unión con código válido
- **WHEN** un jugador introduce un código válido de una partida que aún no ha empezado
- **THEN** el sistema lo incorpora al lobby de esa partida

#### Scenario: Código en minúsculas
- **WHEN** un jugador introduce un código válido escribiéndolo en minúsculas
- **THEN** el sistema lo reconoce igualmente y lo incorpora al lobby

#### Scenario: Partida llena o ya empezada
- **WHEN** un jugador introduce el código de una partida llena o que ya ha empezado
- **THEN** el sistema muestra un error y no lo incorpora
