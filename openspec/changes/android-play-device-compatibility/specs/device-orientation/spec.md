# Spec Delta

## ADDED Requirements

### Requirement: La política de orientación se recalcula al cambiar el tamaño de pantalla

Cuando el tamaño de pantalla cambia sin que la app se reinicie (plegar o desplegar un dispositivo plegable, o cambiar el tamaño de la ventana), el sistema SHALL volver a aplicar la política de orientación correspondiente al nuevo tamaño, conservando el estado de la partida en curso.

#### Scenario: Plegable que se despliega hasta tamaño de tablet

- **WHEN** un dispositivo plegable está en vertical con la app abierta y se despliega hasta alcanzar el umbral de tablet
- **THEN** la app pasa a admitir horizontal y vertical siguiendo la rotación, sin reiniciarse

#### Scenario: Plegable que se pliega hasta tamaño de teléfono

- **WHEN** un dispositivo plegable con la app abierta se pliega y deja de alcanzar el umbral de tablet
- **THEN** la app vuelve a permanecer en vertical aunque el dispositivo se rote

#### Scenario: Partida en curso durante el plegado

- **WHEN** el usuario pliega o despliega el dispositivo mientras juega una partida
- **THEN** la partida continúa con el mismo estado y sin volver al menú
