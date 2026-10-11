# Spec Delta

## ADDED Requirements

### Requirement: Pausa del tiempo del rival mientras Ajustes está abierto
El sistema SHALL pausar la cuenta atrás visible del turno de un rival mientras Ajustes está abierto y reanudarla al cerrarlo, igual que hace con el turno del humano.

#### Scenario: Abrir Ajustes durante el turno de un rival
- **WHEN** es el turno de un rival y el jugador abre Ajustes
- **THEN** la cuenta atrás del rival se detiene y el rival no actúa mientras Ajustes está abierto

#### Scenario: Cerrar Ajustes durante el turno de un rival
- **WHEN** el jugador cierra Ajustes y el turno del rival seguía en curso
- **THEN** la cuenta atrás del rival se reanuda desde el tiempo restante

### Requirement: Aviso de últimos segundos al inicio de cada turno
El sistema SHALL emitir los avisos de sonido y vibración de los últimos segundos en cada turno, sin que el valor en el que se pausó un turno anterior los silencie.

#### Scenario: Turno nuevo con el mismo segundo que el anterior
- **WHEN** empieza un turno nuevo y su cuenta atrás entra en los últimos segundos en un valor en el que ya se avisó en un turno anterior
- **THEN** el sistema vuelve a emitir el aviso de últimos segundos

#### Scenario: Reanudar tras Ajustes dentro de los últimos segundos
- **WHEN** el jugador cierra Ajustes dentro de los últimos segundos del turno propio
- **THEN** el sistema emite el aviso correspondiente al tiempo reanudado
