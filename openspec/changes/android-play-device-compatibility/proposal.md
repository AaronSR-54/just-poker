# Proposal

## Why

La app «no aparece» en Play Store en algunos dispositivos (Galaxy Z Flip, teléfonos antiguos) y hoy no hay forma de distinguir si es un problema de compatibilidad del artefacto o de distribución. La auditoría del artefacto actual (`aapt2 dump badging` del APK de 1.6.3) muestra que el paquete ya declara cobertura máxima: `minSdkVersion 24`, `supports-screens` small/normal/large/xlarge y ningún `uses-feature` obligatorio. La Play Developer API confirma que **solo hay releases en `alpha` e `internal`** (ninguna en `production`), y las pistas de prueba cerrada no son visibles en la búsqueda de Play salvo para cuentas tester opt-in. Por tanto, la causa principal observada no es un filtro de dispositivo, sino la distribución; el único límite real de compatibilidad del código es Android 7.0 (API 24).

Aun así, el repositorio no garantiza esa compatibilidad de forma verificable y quedan huecos reales: la política de orientación se decide solo al crear la actividad (un plegable que cruza el umbral de tablet al desplegarse no se recalcula), una WebView antigua deja la app en blanco sin explicación, y ninguna comprobación impide que un cambio futuro introduzca un `uses-feature` obligatorio o restrinja pantallas y recorte la cobertura de Play sin que nadie lo note.

## What Changes

- Añadir una comprobación automática de compatibilidad del artefacto Android construido (AAB/APK): informa `minSdk`, `targetSdk`, `uses-feature` obligatorios u omitidos, pantallas soportadas, densidades y ABIs, y falla si aparece una declaración que restrinja la cobertura de dispositivos más allá del mínimo de sistema operativo decidido.
- Hacer explícita en el manifiesto la intención de máxima cobertura (ningún hardware obligatorio, todas las pantallas, actividad redimensionable), para que la cobertura no dependa de valores por defecto que un merge de librerías pueda cambiar.
- Recalcular la política de orientación cuando cambia el tamaño de pantalla (desplegar/plegar un plegable, rotar una tablet) en vez de solo al arrancar, sin reiniciar la actividad ni perder la partida.
- Mostrar un aviso claro y traducido cuando el dispositivo no puede ejecutar la app (WebView demasiado antigua o sistema por debajo del mínimo) en lugar de una pantalla en blanco, y alinear el objetivo de compilación del JavaScript con la WebView mínima soportada.
- Documentar el suelo de soporte real (Android 7.0 / API 24 y WebView mínima), cómo comprobarlo por release y cómo diagnosticar «no encuentro la app» en Play Console (pista de distribución, cuenta tester, catálogo de dispositivos), separando distribución de compatibilidad.
- No se promete soporte de Android anterior a 7.0: Capacitor 8 fija API 24 como mínimo y bajarlo no está soportado.

## Capabilities

### New Capabilities
- `android-device-compatibility`: qué dispositivos pueden instalar y ejecutar la app, cómo se comprueba la cobertura del artefacto publicado y qué ve el usuario cuando su dispositivo queda por debajo del mínimo soportado.

### Modified Capabilities
- `device-orientation`: la política teléfono/tablet se reevalúa al cambiar el tamaño de pantalla (plegado/desplegado o rotación) sin reiniciar la actividad, y los plegables que alcanzan tamaño de tablet pasan a admitir horizontal y vertical en caliente.

## Impact

- **Código Android:** `android/app/src/main/AndroidManifest.xml` (declaraciones explícitas de pantallas, hardware y actividad redimensionable), `android/app/src/main/java/com/justpoker/app/MainActivity.java` (política de orientación reevaluada en cambios de configuración), `android/variables.gradle` solo si se ajusta el mínimo documentado.
- **Código web:** `vite.config.ts` (objetivo de compilación alineado con la WebView mínima), un componente de aviso de dispositivo no soportado en `src/components/` integrado en el arranque, y claves i18n nuevas en `src/i18n/` (es/en).
- **Tooling:** nuevo `scripts/android-compat.mjs` y script npm asociado; se reutiliza el `aapt2` del Android SDK que ya localiza `scripts/build-android.sh` (misma detección de `ANDROID_HOME`).
- **Documentación:** `store/PUBLISHING.md` (verificación del catálogo de dispositivos, pistas y cuentas tester, suelo de soporte) y `AGENTS.md` (comando de comprobación y suelo de compatibilidad).
- **Reutilización:** se reutilizan las recetas de layout y tipografía de `AGENTS.md`, `Wordmark`/`Button` de `src/components/` si el aviso necesita acción, y `t(...)` para todo el texto. No se duplica la detección de tablet: la comprobación de `smallestScreenWidthDp` se extrae a un único método usado al crear y al cambiar de configuración. No se introduce ningún componente visual nuevo si el aviso encaja con las primitivas existentes.
- **Sin impacto** en el motor de juego, el multijugador ni la persistencia.
