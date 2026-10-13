# Proposal

## Why

Abrir la app de Android en una tablet y sostenerla en horizontal no es posible hoy: la actividad está fijada a `portrait` (`AndroidManifest.xml:19`), así que el sistema recorta la experiencia a un único sentido aunque la tablet tenga pantalla de sobra. Las tablets se usan a menudo sobre atril o apoyadas en horizontal, y el juego gana al mostrar la mesa horizontal que la web ya sabe dibujar en pantallas anchas.

## What Changes

- La app de Android deja de estar bloqueada a vertical en **tablets**: en dispositivos de pantalla grande (ancho mínimo del sistema ≥ 600dp) la app sigue el autorotado del sistema y funciona tanto en horizontal como en vertical.
- Los **teléfonos** mantienen el bloqueo a vertical que ya tienen hoy; el cambio no altera su comportamiento.
- En horizontal, todas las pantallas siguen siendo usables; la mesa de juego se apoya en la disposición horizontal ya existente para pantallas anchas y se revisa que no haya recortes ni controles inalcanzables.
- Sin **BREAKING** funcional: no cambia la lógica de juego, ni el multijugador, ni la persistencia.

## Capabilities

### New Capabilities
- `device-orientation`: Define qué orientaciones admite la app empaquetada según el tipo de dispositivo (tablet libre, teléfono fijado a vertical) y que la interfaz, incluida la mesa de juego, permanece usable en horizontal.

### Modified Capabilities
<!-- Ninguna. La orientación es un comportamiento nuevo del contenedor nativo; no cambia requisitos de las capacidades existentes. -->

## Impact

- **Nativo Android:** `android/app/src/main/AndroidManifest.xml` (atributo `screenOrientation`) y `android/app/src/main/java/com/justpoker/app/MainActivity.java` (decisión de orientación en tiempo de ejecución según el tamaño).
- **Web / React:** posible ajuste de los puntos de ruptura y de la disposición de la mesa en `src/screens/Game/` (`Game.tsx`, `OnlineGame.tsx`, `layout/DesktopGameLayout.tsx`, `layout/MobileGameLayout.tsx`) para garantizar la usabilidad en horizontal; se reutilizan `useMediaQuery` (`src/hooks/useMediaQuery.ts`) y el `DesktopGameLayout` existente, sin introducir componentes nuevos salvo que la revisión lo exija.
- **Sin cambios** en `package.json` (no se añaden plugins de Capacitor), i18n, ni dependencias.
- **Reutilización:** se reutilizan `useMediaQuery` y `DesktopGameLayout`; no se duplica markup ni lógica. Si al revisar la disposición horizontal aparece un patrón repetido, se extrae a `src/components/` o `src/utils/` en lugar de copiarlo.
- **Verificación pendiente en dispositivo/emulador:** el comportamiento real de rotación no es comprobable con lint/tsc/build; requiere prueba manual en tablet y teléfono.
