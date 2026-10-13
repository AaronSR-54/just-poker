# Spec Delta

## ADDED Requirements

### Requirement: Visibilidad de la cuenta atrás durante cada turno de rival
El sistema SHALL mostrar la cuenta atrás del rival activo durante todos sus turnos, incluidos los turnos consecutivos entre varios rivales, y SHALL atribuir el tiempo restante visible al rival al que le toca actuar.

#### Scenario: Rivales consecutivos
- **WHEN** dos o más rivales actúan en turnos consecutivos sin que intervenga el humano
- **THEN** la barra de cuenta atrás se ve para cada rival mientras es su turno

#### Scenario: La barra sigue al rival activo
- **WHEN** termina el turno de un rival y el turno pasa al siguiente rival
- **THEN** la cuenta atrás visible corresponde al nuevo rival activo y no conserva el tiempo restante del anterior

#### Scenario: Fin de la racha de rivales
- **WHEN** termina el turno de un rival y el turno pasa al humano o se cierra la mano
- **THEN** el sistema deja de mostrar la cuenta atrás de ese rival
