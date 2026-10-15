# Spec Delta

## MODIFIED Requirements

### Requirement: Ajuste de vibración desactivable y persistente
El sistema SHALL ofrecer en Ajustes un control para activar o desactivar la vibración únicamente en dispositivos con capacidad de vibrar, con valor por defecto activado, y SHALL conservar la preferencia elegida entre sesiones y recargas.

#### Scenario: Dispositivo con soporte de vibración
- **WHEN** el jugador abre los Ajustes en un dispositivo que puede vibrar
- **THEN** se muestra el control de vibración con el valor elegido

#### Scenario: Dispositivo sin soporte de vibración
- **WHEN** el jugador abre los Ajustes en un dispositivo que no puede vibrar, como un ordenador de escritorio
- **THEN** no se muestra el control de vibración

#### Scenario: Desactivar la vibración
- **WHEN** el jugador desactiva la vibración en Ajustes
- **THEN** ninguno de los eventos de vibración produce efecto mientras siga desactivada

#### Scenario: Persistencia de la preferencia
- **WHEN** el jugador cambia el ajuste de vibración y vuelve a abrir la app
- **THEN** el ajuste conserva el valor que el jugador había elegido
