# Spec Delta

## MODIFIED Requirements

### Requirement: Invitación por QR
El sistema SHALL mostrar en el lobby un QR que codifica el enlace directo de invitación a esa partida, de modo que pueda escanearse con la cámara del teléfono. El enlace SHALL usar el origen del despliegue de producción, de modo que el QR siga siendo válido aunque se muestre desde la app nativa; en la web, sin origen configurado, SHALL conservar el mismo origen de la página.

#### Scenario: QR para invitar
- **WHEN** el anfitrión está en el lobby de una partida privada
- **THEN** el sistema muestra un QR cuyo contenido es el enlace directo al lobby de esa partida en el despliegue de producción

#### Scenario: QR mostrado desde la app nativa
- **WHEN** el anfitrión muestra el QR desde la app nativa
- **THEN** el QR codifica el enlace del despliegue de producción y no una dirección local de la app
