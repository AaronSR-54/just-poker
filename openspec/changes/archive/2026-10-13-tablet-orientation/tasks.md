# Tasks

## 1. Orientación nativa (tablet libre, teléfono vertical)

- [x] 1.1 En `android/app/src/main/AndroidManifest.xml`, sustituir `android:screenOrientation="portrait"` de `MainActivity` por `unspecified` (o eliminar el atributo); verificar leyendo el archivo que no queda ningún bloqueo a `portrait`.
- [x] 1.2 En `android/app/src/main/java/com/justpoker/app/MainActivity.java`, en `onCreate` antes de `super.onCreate`, fijar la orientación según `resources.configuration.smallestScreenWidthDp`: ≥ 600 → `ActivityInfo.SCREEN_ORIENTATION_FULL_USER`, si no → `SCREEN_ORIENTATION_PORTRAIT`; verificar que compila con `cd android && ./gradlew assembleDebug`.
- [x] 1.3 Ejecutar `npx cap sync android` y verificar que el manifiesto resultante en `android/app/src/main/` conserva la ausencia de bloqueo y que no se introducen errores de sync.

## 2. Usabilidad en horizontal (mesa y pantallas)

- [x] 2.1 Revisar `src/screens/Game/Game.tsx` y `src/screens/Game/OnlineGame.tsx` para confirmar que en horizontal (`min-width: 768px` + `isShort` por `max-height: 720px`) seleccionan `DesktopGameLayout` sin recortes; verificar en el navegador a 1024×768 y a 1280×800 que la mesa, los asientos, el bote y los botones de acción son visibles y pulsables. Ajustar solo si hay recortes, usando utilidades nativas de Tailwind.
- [x] 2.2 Revisar `src/screens/Game/layout/DesktopGameLayout.tsx` y `MobileGameLayout.tsx` en el ancho horizontal elegido; verificar que ningún contenedor desborda el alto (`overflow`, `h-screen`/safe areas) y corregir con utilidades nativas si procede.
- [x] 2.3 Revisar las pantallas de entrada (`src/screens/Menu.tsx`, `src/screens/Online.tsx`, `src/screens/Local.tsx`, `src/screens/Profile.tsx`, `src/screens/HandsGuide.tsx`, `src/components/GameSettings.tsx`) a 1024×768; verificar que el contenido y las acciones se ven y se pulsan sin recortes, corrigiendo con utilidades nativas solo lo que falle.
- [x] 2.4 Verificar la reutilización: revisar la checklist de `AGENTS.md` y confirmar que se reutilizan `useMediaQuery` (`src/hooks/useMediaQuery.ts`) y las disposiciones/componentes existentes, que no hay markup ni lógica duplicados y que, si aparece un patrón repetido, se ha extraído a `src/components/` o `src/utils/` sustituyendo todas las copias; no deben quedar strings visibles fuera de `t(...)`.

## 3. Verificación de calidad del código

- [x] 3.1 Ejecutar `npx oxlint src/` y verificar que no hay errores ni avisos nuevos.
- [x] 3.2 Ejecutar `npx tsc --noEmit` y verificar que compila sin errores de tipos.
- [x] 3.3 Ejecutar `npm run build` y verificar que la web se genera en `dist/` sin errores.

## 4. Verificación en dispositivo/emulador

- [x] 4.1 Instalar el APK en un emulador de tablet (`smallestScreenWidthDp ≥ 600`) y verificar que rota entre horizontal y vertical al girar el dispositivo, en caliente y sin perder el estado de la partida en curso.
- [x] 4.2 Instalar el APK en un emulador de teléfono (`< 600dp`) y verificar que la app permanece en vertical al girar el dispositivo.

## Workflow follow-up

- Archivar el cambio tras cumplir los requisitos de revisión del proyecto.
- Verificar el resultado archivado (spec `device-orientation` creada en `openspec/specs/`).
