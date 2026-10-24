# Design

## Context

See `proposal.md` - Why. Estado actual relevante para el diseño:

- El manifiesto fusionado de 1.6.3 ya declara `minSdkVersion 24`, `supports-screens` con los cuatro tamaños y ningún `uses-feature` obligatorio. `aapt2 dump badging` no lista `uses-implied-feature`, así que el paquete no se filtra por hardware.
- Capacitor 8 fija API 24 como mínimo (`node_modules/@capacitor/android/capacitor/build.gradle`); todas las librerías nativas del proyecto son AndroidX sin requisitos de hardware propios.
- `MainActivity` decide la orientación en `onCreate` con `smallestScreenWidthDp >= 600` y la actividad declara `configChanges` con `screenSize|smallestScreenSize|screenLayout|orientation|density`, por lo que **no se recrea** al plegar/desplegar: la política no se vuelve a evaluar.
- Vite 8 compila contra `baseline-widely-available` (Chrome/WebView 107) sin declararlo; un cambio de versión de Vite puede mover ese suelo sin que nadie lo revise.
- La Play Developer API confirma releases solo en `alpha` e `internal`; el catálogo de dispositivos no se expone por API y se consulta en Play Console.
- Convenciones de estilo y reutilización: `AGENTS.md`.

## Goals / Non-Goals

**Goals:**

- Fijar y documentar un suelo de soporte único (Android 7.0 / API 24; WebView 107) y demostrar con un informe que el artefacto no lo restringe más.
- Hacer explícitas en el manifiesto las declaraciones que determinan la cobertura en Play, para que un merge de librerías no la recorte en silencio.
- Reevaluar la política de orientación al cambiar el tamaño de pantalla sin recrear la actividad.
- Evitar la pantalla en blanco en dispositivos por debajo del suelo, con un aviso traducido.
- Dejar escrito cómo distinguir «no aparece en Play» por distribución de un problema real de dispositivo.

**Non-Goals:**

- Soportar Android anterior a 7.0 (Capacitor 8 no lo soporta) ni mantener una variante legacy del bundle con polyfills.
- Cambiar el umbral teléfono/tablet (600dp) ni la política de orientación ya especificada en `device-orientation`.
- Automatizar el catálogo de dispositivos de Play Console: la API no lo expone; queda como comprobación manual documentada.
- Publicar en producción desde este cambio: la release es una acción de Play Console fuera del repo.

## Decisions

### 1. Mantener `minSdkVersion 24` y declararlo como suelo

Se conserva 24 porque es el mínimo de Capacitor 8 y de sus dependencias AndroidX; bajarlo a 23 o 21 no está soportado y no hay dispositivos de prueba para validarlo. El suelo se documenta junto al de WebView.

- Alternativa descartada: bajar a 23 para ganar Android 6. Añade riesgo de runtime en WebView/AndroidX sin cobertura de pruebas real.
- Alternativa descartada: subir a 26. Recorta dispositivos sin ninguna ganancia.

### 2. Suelo de WebView explícito: Chrome/WebView 107

`vite.config.ts` fija `build.target: 'chrome107'` en lugar de heredar el alias de Vite, de modo que el suelo sea una decisión del repo y no un efecto de la versión del bundler. El mismo valor es el umbral del aviso.

- Alternativa descartada: `@vitejs/plugin-legacy` con polyfills. Duplica el bundle y mantiene vivo un navegador que no podemos probar; el aviso cubre el caso.
- Alternativa descartada: bajar a `es2019`/Chrome 87. El bundle seguiría dependiendo de APIs que el target no polyfillea, así que el suelo real no cambiaría.

### 3. Detección de soporte en un helper puro y reutilizable

Se extrae `src/utils/webviewSupport.ts` con una función pura que recibe el user agent y devuelve si el motor alcanza el mínimo, siguiendo el patrón de `src/utils/mediaSupport.ts` (función pura + test). Se aplica solo en la app nativa Android:

- `Chrome/<mayor>` presente y `< 107` → no soportado.
- UA sin versión reconocible → soportado (no se bloquea por desconocimiento).
- Web y plataformas no Android → soportado (el aviso es específico de la WebView del contenedor).

El aviso se monta en `src/main.tsx` antes del árbol de la app, para no inicializar router, audio ni stores en un dispositivo no soportado.

### 4. Aviso de dispositivo no soportado como componente reutilizando primitivas

Nuevo `src/components/UnsupportedDevice.tsx` con la receta de contenedor de pantalla de `AGENTS.md`, reutilizando `Wordmark` para la marca y las recetas tipográficas existentes; sin botones nuevos ni markup duplicado. Textos en una sección i18n nueva `compatibility` (`src/i18n/locales/{es,en}/compatibility.ts`, registrada en `src/i18n/translations.ts`), con `t(...)` para título y explicación.

Para el caso en que el bundle ni siquiera se pueda interpretar (WebView muy antigua), `index.html` incluye un fallback estático mínimo dentro de `#root`: React lo sustituye al montar, así que solo se ve si el montaje no ocurre. Es bilingüe y usa utilidades Tailwind nativas (sin clases propias ni colores crudos). **Excepción justificada a i18n:** el fallback se renderiza antes de que existan los diccionarios y el store de idioma; se ofrecen los dos idiomas en el propio markup en lugar de dejar una pantalla vacía.

### 5. Política de orientación reevaluada en cambios de configuración

En `MainActivity` se extrae un único método `applyOrientationPolicy()` que lee `smallestScreenWidthDp` y aplica `FULL_USER` (≥600dp) o `PORTRAIT` (<600dp). Se invoca desde `onCreate` y desde `onConfigurationChanged` (tras `super`). Un campo con la última política aplicada evita llamadas redundantes y bucles.

- Alternativa descartada: recrear la actividad al plegar. Perdería la partida en curso y contradice el requisito de continuidad.
- Alternativa descartada: consultar el tamaño solo en `onResume`. No cubre plegar/desplegar con la app en primer plano.
- Nota: con `targetSdk 36` Android 16 ignora el bloqueo de orientación en pantallas ≥600dp; la política ya permite ambas orientaciones en ese rango, así que el comportamiento es coherente.

### 6. Declaraciones explícitas de cobertura en el manifiesto

En `android/app/src/main/AndroidManifest.xml` se añaden:

- `<supports-screens>` con `smallScreens`, `normalScreens`, `largeScreens`, `xlargeScreens`, `anyDensity` y `resizeable` a `true`.
- `android:resizeableActivity="true"` en `<application>`.

No cambian el comportamiento actual (son los valores por defecto con `targetSdk 36`), pero fijan la intención y hacen que el informe y Play las lean igual. Se mantienen los `uses-feature` con `required="false"` ya existentes.

### 7. Informe de compatibilidad como script de release

Nuevo `scripts/android-compat.sh` que analiza el APK de release con el `aapt2` del SDK y falla si:

- `minSdkVersion` no es 24 o falta `targetSdkVersion`.
- Aparece cualquier `uses-feature:` obligatorio o `uses-implied-feature`.
- `supports-screens` no cubre small/normal/large/xlarge.
- Hay `native-code` con una lista de ABIs restringida.

Imprime además densidades, ABIs, `targetSdk` y un veredicto legible; `--json` para CI. Se comprueba el APK porque se genera en la misma invocación de Gradle que el AAB y comparte el manifiesto fusionado; `bundletool` no está instalado y el manifiesto del AAB es proto.

La detección de `JAVA_HOME`/`ANDROID_HOME` de `scripts/build-android.sh` se extrae a `scripts/lib/android-env.sh`, que ambos scripts hacen `source`. Así la ruta de `aapt2` y del SDK tiene una sola definición (regla de reutilización).

Se añade `npm run android:compat` (y se documenta junto a `npm run android`) en `package.json` y `AGENTS.md`.

### 8. Diagnóstico de visibilidad en Play y catálogo de dispositivos

`store/PUBLISHING.md` gana una sección que separa explícitamente:

1. **Distribución**: `node ~/.config/opencode/skills/google-play-console/scripts/play.mjs status`; sin release en `production` la app no aparece en la búsqueda pública y solo la ven las cuentas tester opt-in de la pista. Los testers de `alpha` se gestionan como Google Group (`node … testers alpha`), así que la cuenta debe pertenecer al grupo **antes** de abrir el enlace de opt-in; un grupo restringido impide que el tester se una por su cuenta y el botón «Become a tester» se queda sin efecto. Hay que distinguir **miembro** de **invitado pendiente**, usar la misma cuenta en el grupo, el navegador y Play Store, y recordar que una app en prueba cerrada no se busca en Play: se instala desde el enlace de opt-in o desde la ficha directa con la cuenta tester.
2. **Compatibilidad**: informe `npm run android:compat` + Play Console → *Test and release → Device catalog* para el AAB subido, contrastando el suelo declarado.
3. **Cuenta y región**: clasificación 18+, país excluido y cuenta familiar explican ausencias que no son de dispositivo.

## Risks / Trade-offs

- **El catálogo de dispositivos de Play no es consultable por API** → comprobación manual obligatoria en cada release, documentada en `store/PUBLISHING.md` y enlazada desde la checklist.
- **Un UA de WebView no reconocido podría bloquear un dispositivo válido** → UA desconocido se considera soportado y el aviso solo se aplica en Android nativo.
- **El fallback estático duplica texto en dos idiomas** → es mínimo (título + una frase), vive fuera de React y se justifica porque los diccionarios aún no existen; no se reutiliza en ninguna otra pantalla.
- **Reaplicar la orientación en cada cambio de configuración podría provocar bucles** → solo se llama a `setRequestedOrientation` cuando la política calculada difiere de la última aplicada.
- **Comprobar el APK y no el AAB** → mismo manifiesto fusionado en la misma invocación de Gradle; se documenta la equivalencia y el paso manual en Play Console cubre el artefacto real.
- **Mantener API 24 deja fuera Android 6 y anteriores** → decisión de producto documentada; esos usuarios conservan la versión web.

## Migration Plan

Sin migración de datos ni estado persistido: el cambio es de manifiesto, arranque y tooling. Se publica como una versión nueva (subir `versionCode`/`versionName` antes de subir el AAB). Rollback: revertir el commit; el artefacto anterior sigue siendo válido porque no hay cambios de formato de datos.
