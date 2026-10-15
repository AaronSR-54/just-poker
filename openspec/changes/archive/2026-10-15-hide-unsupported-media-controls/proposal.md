# Proposal

## Why

En Safari de iOS (y en otras plataformas que no pueden reproducir nuestro audio) la música de fondo no suena: el motor usa Web Audio `decodeAudioData` sobre `/music/theme.webm`, que es **Opus dentro de un contenedor WebM**, un formato que Safari no decodifica por esta vía. Sin embargo, Ajustes sigue mostrando un deslizador de «Música» que no hace nada, y lo mismo ocurre con el control de «Vibración» en escritorio, donde el dispositivo no puede vibrar. La app debe ofrecer solo los ajustes que realmente pueden funcionar.

## What Changes

- **Audio (música y efectos):** en dispositivos/navegadores donde el audio empaquetado no puede reproducirse, no se muestran los deslizadores de volumen de música ni de efectos, y no se intenta reproducir sonido. La detección es real (no solo por user-agent): se basa en poder reproducir el propio formato de audio.
- **Vibración:** el control de vibración solo se ofrece en dispositivos con capacidad de vibrar; en escritorio (ratón/teclado, sin vibración) no aparece.
- **Sin cambios de motor:** se conserva el motor de audio actual (Web Audio) y el plugin de háptica. No se sustituyen pistas ni se añaden binarios.
- El valor persistido de cada ajuste se conserva aunque su control esté oculto (no se borra la preferencia).

No es un cambio **BREAKING**.

## Capabilities

### New Capabilities

- `audio-support`: determina si la plataforma puede reproducir el audio empaquetado y, en consecuencia, si se ofrecen y se intentan usar la música de fondo y los efectos de sonido.

### Modified Capabilities

- `haptic-feedback`: el ajuste de vibración solo se ofrece cuando el dispositivo puede vibrar; en dispositivos sin soporte (por ejemplo, escritorio) no se muestra el control.

## Impact

- **Ajustes (UI):** `src/components/GameSettings.tsx` condiciona los deslizadores de música/efectos y la sección de vibración a la capacidad detectada; reutiliza `SettingSlider`, `Section` y `SegmentedControl` sin recrear controles.
- **Audio:** `src/audio/music.ts`/`src/audio/musicController.ts` informan de un fallo de decodificación (formato no soportado) y dejan de reintentar; `src/audio/sfx.ts` no reproduce ni precarga si no hay soporte.
- **Nuevos módulos compartidos:** un helper de detección `src/utils/mediaSupport.ts` (música, efectos, vibración) y un store de capacidades (no persistido) para exponer el resultado a la UI.
- **Háptica:** `src/haptics/haptics.ts` no dispara el plugin cuando no hay soporte (además de respetar `hapticsEnabled`).
- **Reutilización:** se reutilizan los componentes de `src/components/` (`SettingSlider`, `Section`, `SegmentedControl`), el patrón de detección síncrona de `src/utils/crtSupport.ts`, `Capacitor.isNativePlatform()` y el patrón de store de `zustand` ya usado en `src/store/`. Se introduce un helper y un store compartidos (no se duplica detección entre módulos).
- **Sin nuevas dependencias, sin nuevos assets, sin claves i18n nuevas.**
