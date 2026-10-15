# audio-support Specification

## Purpose

Gobierna si la app ofrece y usa el audio (música de fondo y efectos de sonido) según lo que la plataforma es realmente capaz de reproducir, para no mostrar controles ni provocar intentos que no pueden funcionar.

## Requirements

### Requirement: Controles de audio ocultos sin soporte

El sistema SHALL mostrar los controles de volumen de música y de efectos de sonido únicamente cuando la plataforma puede reproducir el audio empaquetado; cuando no puede, SHALL ocultar ambos controles.

#### Scenario: Plataforma sin soporte de audio
- **WHEN** el jugador abre los Ajustes en un dispositivo o navegador que no puede reproducir el audio de la app
- **THEN** no se muestran ni el control de volumen de música ni el de efectos de sonido

#### Scenario: Plataforma con soporte de audio
- **WHEN** el jugador abre los Ajustes en un dispositivo o navegador que sí puede reproducir el audio de la app
- **THEN** se muestran los controles de volumen de música y de efectos de sonido

### Requirement: Sin reproducción de audio sin soporte

Cuando la plataforma no puede reproducir el audio empaquetado, el sistema SHALL no reproducir música ni efectos de sonido y SHALL no reintentar su carga, continuando con el resto de la experiencia sin errores.

#### Scenario: Arranque sin soporte
- **WHEN** la app se abre en una plataforma que no puede reproducir el audio empaquetado
- **THEN** no se inicia la música de fondo ni se emite ningún error

#### Scenario: Interacción sin soporte
- **WHEN** el jugador interactúa (pulsa controles) en una plataforma que no puede reproducir el audio empaquetado
- **THEN** no suena ningún efecto de sonido y la app continúa con normalidad

### Requirement: La preferencia de volumen se conserva

El sistema SHALL conservar el valor de volumen de música y de efectos elegido por el jugador aunque sus controles estén ocultos por falta de soporte, y SHALL aplicar ese valor cuando vuelva a haber soporte.

#### Scenario: Preferencia guardada al cambiar de dispositivo
- **WHEN** el jugador elige un volumen, después usa la app en una plataforma sin soporte de audio y más tarde vuelve a una plataforma con soporte
- **THEN** se mantiene el volumen que el jugador había elegido
