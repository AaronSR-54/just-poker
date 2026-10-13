# turn-timer Specification

## Purpose

Controla la cuenta atrás del turno del humano y su pausa mientras Ajustes está abierto.

## Requirements

### Requirement: Cuenta atrás del turno humano
El sistema SHALL mostrar una cuenta atrás durante el turno del humano y resolverlo al agotarse: check si puede, y en caso contrario fold.

#### Scenario: Expiración del turno
- **WHEN** es el turno del humano y el tiempo se agota
- **THEN** el sistema hace check si es posible y, si no, fold, y la partida continúa

### Requirement: Pausa del temporizador en Ajustes conserva el tiempo restante
El sistema SHALL pausar la cuenta atrás del turno del humano mientras Ajustes está abierto y reanudarla al cerrarlo desde el tiempo restante, sin reiniciarla a la duración completa.

#### Scenario: Abrir y cerrar Ajustes en el turno del humano
- **WHEN** es el turno del humano, quedan N segundos, y abre Ajustes y luego lo cierra
- **THEN** la cuenta atrás se reanuda con los mismos N segundos restantes

#### Scenario: Expiración tras reanudar
- **WHEN** el tiempo restante se agota después de cerrar Ajustes
- **THEN** el sistema resuelve el turno como corresponde (check si puede, si no fold)

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
