# Tasks

## 1. Tooling de compatibilidad

- [ ] 1.1 Extraer la detección de `JAVA_HOME`/`ANDROID_HOME` y de `aapt2` de `scripts/build-android.sh` a `scripts/lib/android-env.sh`, y hacer que `build-android.sh` lo use con `source`. Verificación: `npm run android:debug` sigue compilando sin variables de entorno extra.
- [ ] 1.2 Crear `scripts/android-compat.sh` con el informe y las comprobaciones del diseño (suelo 24, sin `uses-feature` obligatorios ni implícitos, cuatro tamaños de pantalla, ABIs) y salida `--json`, con código de salida distinto de cero ante violaciones. Verificación: ejecutarlo contra `android/app/build/outputs/apk/release/app-release.apk` muestra el informe y termina con código 0.
- [ ] 1.3 Añadir `android:compat` a `package.json` y documentar el comando y el suelo de soporte en `AGENTS.md`. Verificación: `npm run android:compat` funciona tal como queda documentado.
- [ ] 1.4 Probar que el script detecta una regresión: ejecutarlo sobre una copia del APK con un `uses-feature` obligatorio añadido al manifiesto fusionado (o un fixture equivalente) y comprobar que falla indicando la declaración. Verificación: el caso negativo devuelve código distinto de cero.

## 2. Manifiesto de máxima cobertura

- [ ] 2.1 Añadir `<supports-screens>` explícito (small/normal/large/xlarge, `anyDensity`, `resizeable`) y `android:resizeableActivity="true"` en `android/app/src/main/AndroidManifest.xml`, manteniendo los `uses-feature` con `required="false"`. Verificación: `npm run android:debug`, y `aapt2 dump badging` sobre el APK resultante muestra los cuatro tamaños y ningún `uses-feature` obligatorio.
- [ ] 2.2 Confirmar que el manifiesto fusionado de release conserva esas declaraciones. Verificación: `npm run android`, y `npm run android:compat` termina en verde sobre el APK de release.

## 3. Orientación en plegables y cambios de tamaño

- [ ] 3.1 Extraer en `MainActivity` un único `applyOrientationPolicy()` con el umbral de 600dp y llamarlo desde `onCreate` y `onConfigurationChanged`, sin duplicar la lectura de `smallestScreenWidthDp` ni el cálculo de tablet. Verificación: `./gradlew assembleDebug` compila y una inspección del archivo muestra una sola definición del umbral y ambas llamadas.
- [ ] 3.2 Evitar reaplicar la misma política con un campo de última orientación aplicada. Verificación: revisión del código y arranque en emulador sin parpadeo ni recreación de la actividad.
- [ ] 3.3 Probar plegar/desplegar en un emulador plegable (o ajustando `smallestScreenWidthDp` por configuración) y comprobar que la app pasa de vertical a admitir horizontal y vuelve, manteniendo la partida en curso. Verificación: la partida sigue en la misma mano y no se vuelve al menú.

## 4. Aviso de dispositivo no soportado

- [ ] 4.1 Crear `src/utils/webviewSupport.ts` con la función pura de detección (Chrome/WebView mayor que 107, UA desconocido soportado, solo Android nativo) y su test en `src/utils/webviewSupport.test.ts`. Verificación: `npx vitest run src/utils/webviewSupport.test.ts` pasa con casos por encima, por debajo y sin versión reconocible.
- [ ] 4.2 Añadir la sección i18n `compatibility` en `src/i18n/locales/es/` y `src/i18n/locales/en/`, registrarla en `src/i18n/translations.ts`. Verificación: `npx tsc --noEmit` acepta que ambos diccionarios cubren las mismas claves.
- [ ] 4.3 Crear `src/components/UnsupportedDevice.tsx` reutilizando `Wordmark` y las recetas de `AGENTS.md`, y montarlo en `src/main.tsx` antes del árbol de la app cuando el helper indique no soportado. Verificación: con el user agent de Android forzado a Chrome 90 en el inspector, se ve el aviso y no arranca la app; con un UA actual arranca normal.
- [ ] 4.4 Añadir el fallback estático bilingüe dentro de `#root` en `index.html` con utilidades nativas, que React sustituye al montar. Verificación: con JavaScript deshabilitado (o bloqueando el bundle) se lee el aviso en ambos idiomas; con la app normal no se ve.
- [ ] 4.5 Fijar `build.target: 'chrome107'` en `vite.config.ts`. Verificación: `npm run build` termina y el bundle generado no introduce sintaxis por encima del objetivo declarado.

## 5. Diagnóstico de visibilidad en Play

- [ ] 5.1 Añadir a `store/PUBLISHING.md` la sección de compatibilidad y visibilidad con las tres comprobaciones (pista/cuenta tester, informe de compatibilidad + catálogo de dispositivos, clasificación/región) y el suelo de soporte Android 7.0 / WebView 107. Incluir el alta de testers de prueba cerrada: pertenencia previa al Google Group configurado en la pista, enlace de opt-in `https://play.google.com/apps/testing/<package>`, propagación de la membresía y qué hacer si «Become a tester» no avanza. Verificación: los comandos copiados de la sección se ejecutan tal cual, `play.mjs status` muestra las pistas reales y `play.mjs testers alpha` muestra el grupo configurado.
- [ ] 5.2 Actualizar la checklist de release (`store/PUBLISHING.md` §5 y notas de release) para exigir `npm run android:compat` antes de subir el AAB y recordar el contraste en el catálogo de dispositivos. Verificación: la checklist menciona ambos pasos y el comando existe en `package.json`.

## 6. Verificación final

- [ ] 6.1 Revisar la checklist de reutilización de `AGENTS.md`: sin primitivas reinventadas, sin helpers duplicados (detección de SDK, umbral de tablet, detección de soporte), sin colores ni tamaños crudos y todo el texto visible por `t(...)` (o el fallback bilingüe justificado). Verificación: la revisión queda reflejada en el resumen del change.
- [ ] 6.2 Ejecutar `npx oxlint src/`, `npx tsc --noEmit`, `npm test` y `npm run build`. Verificación: todos terminan sin errores.
- [ ] 6.3 Generar el artefacto de release y validarlo. Verificación: `npm run android` y después `npm run android:compat` en verde; el `versionCode`/`versionName` subidos coinciden con `android/app/build.gradle`.

## Workflow follow-up

- Revisar los artefactos con el usuario y archivar el change cuando el proyecto lo requiera.
- Tras publicar el AAB en Play Console, contrastar el catálogo de dispositivos y anotar el resultado en la release.
