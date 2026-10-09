# Spec Delta

## Purpose

Controla la cuenta atrás del turno del humano y su pausa mientras Ajustes está abierto.

## ADDED Requirements

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
