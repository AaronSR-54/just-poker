# Design

## Context

La app Android es la web de Vite empaquetada con Capacitor 8 (`BridgeActivity`), con un `MainActivity` vacío (`android/app/src/main/java/com/justpoker/app/MainActivity.java`) y `android:screenOrientation="portrait"` fijado en `AndroidManifest.xml:19`. La actividad ya declara `configChanges` con `orientation|screenSize`, así que el sistema no la recrea al rotar.

La web ya es responsiva por ancho: `src/screens/Game/Game.tsx` y `OnlineGame.tsx` eligen `DesktopGameLayout` (mesa horizontal) para `min-width: 768px` y `MobileGameLayout` por debajo, y usan `isShort` (`max-height: 720px`) para comprimir la mesa en pantallas bajas. `useMediaQuery` (`src/hooks/useMediaQuery.ts`) es el helper existente para estas consultas. Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**

- Liberar la orientación en tablets (ancho mínimo ≥ 600dp) y mantener el bloqueo vertical en teléfonos.
- Garantizar que todas las pantallas, y en especial la mesa de juego, sigan siendo usables en horizontal.
- No añadir dependencias ni plugins de Capacitor.

**Non-Goals:**

- Soportar iOS (no hay proyecto iOS en el repo).
- Cambiar el comportamiento de la web servida en navegador/PWA (ya rota con el navegador).
- Rediseñar la mesa o introducir una disposición específica de "tablet apaisada" más allá de las disposiciones por ancho ya existentes.

## Decisions

### Decidir la orientación en tiempo de ejecución, no en el manifiesto

`screenOrientation` es un atributo por actividad y **no** admite qualifiers de recurso (`values-sw600dp` no puede sobreescribirlo). Por eso:

- El manifiesto deja de fijar `portrait` y pasa a `android:screenOrientation="unspecified"` (o se elimina), dejando que la actividad lo determine.
- `MainActivity.onCreate` (antes de `super.onCreate`) lee `resources.configuration.smallestScreenWidthDp`; si es ≥ 600 llama a `setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_FULL_USER)` y, si no, a `SCREEN_ORIENTATION_PORTRAIT`.

`smallestScreenWidthDp` es invariante con la rotación, por lo que basta calcularlo una vez en `onCreate`; combinado con `configChanges`, no hace falta gestionar `onConfigurationChanged`. `FULL_USER` respeta el autorotado del usuario en la tablet (si lo desactiva, permanece en la orientación actual), que es el comportamiento esperado.

**Alternativas consideradas:**
- `android:screenOrientation="unspecified"` global sin lógica: descartada porque también liberaría los teléfonos, en contra de la decisión de scope.
- Recrear la actividad por orientación (sin `orientation|screenSize` en `configChanges`): descartada porque perdería estado del WebView/partida y encaja peor con Capacitor.
- Detectar la tablet en la web y usar un plugin de orientación: descartada por añadir dependencia y por no resolver el bloqueo nativo en teléfonos.

### Apoyarse en las disposiciones existentes de la mesa

La mesa ya tiene una disposición horizontal para pantallas anchas y gestiona pantallas bajas con `isShort`. En horizontal una tablet supera los 768px, así que resuelve a `DesktopGameLayout` con `isShort` activo. El trabajo en `src/` se limita a **verificar** ese caso y corregir recortes concretos si aparecen, no a crear un layout nuevo.

**Alternativas consideradas:**
- Nuevo `TabletLandscapeLayout`: descartada por duplicar markup/lógica; el layout por ancho existente ya cubre el caso.

### Reutilización

- Se reutilizan `useMediaQuery` (`src/hooks/useMediaQuery.ts`), `DesktopGameLayout` y `MobileGameLayout` (`src/screens/Game/layout/`), `Screen` y el resto de componentes de `src/components/`.
- No se introduce ningún componente nuevo salvo que la verificación detecte un patrón repetido; en ese caso se extrae a `src/components/` (JSX) o `src/utils/` (lógica) y se sustituyen todas las copias.
- No hay markup o lógica que se repita y se deje sin extraer en este cambio.

## Risks / Trade-offs

- **El bloqueo nativo no es verificable con lint/tsc/build.** → Compilar el APK y probar rotación en un emulador de tablet (`sw600dp`) y en un teléfono como parte de las tareas; documentar el resultado.
- **El usuario tiene el autorotado desactivado en la tablet.** → La app queda en la orientación actual; es el comportamiento estándar de Android y no un defecto.
- **Frontera de 600dp y plegables.** → Un plegable/tablet pequeña con `smallestScreenWidthDp < 600` se trata como teléfono (vertical). Aceptable y consistente con la definición de tablet de Android.
- **Recortes concretos en horizontal (safe areas, alturas).** → Revisión manual de las pantallas clave en horizontal; si aparece algún recorte puntual se corrige con utilidades de Tailwind existentes, sin clases CSS nuevas.
- **Sin cambios en la web desplegada.** → El comportamiento en navegador no empeora; la orientación ya la gestiona el navegador.

## Migration Plan

1. Actualizar `MainActivity.java` y `AndroidManifest.xml`.
2. Ejecutar `npx cap sync android`, `npx oxlint src/`, `npx tsc --noEmit` y `npm run build`.
3. Verificar en emulador de tablet y teléfono; si hay ajustes de layout, repetir lint/tsc/build.
4. Rollback: restaurar `android:screenOrientation="portrait"` en el manifiesto y la lógica nativa; sin migración de datos implicada.
