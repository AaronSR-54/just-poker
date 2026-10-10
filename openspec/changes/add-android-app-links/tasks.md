# Tasks

## 1. Declaración de App Links en Android

- [x] 1.1 Añadir en `android/app/src/main/AndroidManifest.xml` un `intent-filter` con `autoVerify="true"`, `scheme=https`, `host=just-poker-delta.vercel.app` y `pathPrefix` para `/online` y `/join`, conservando el filtro LAUNCHER existente; verificar leyendo el manifiesto que hay exactamente un filtro LAUNCHER y el nuevo con `autoVerify`.
- [x] 1.2 Ejecutar `npx cap sync android` y verificar que el filtro sigue en el manifiesto (Capacitor no lo pisa) y que el sync termina sin errores.
- [x] 1.3 Documentar en `AGENTS.md` (sección Android) el host y las rutas de App Links; verificar que el texto queda en el fichero.

## 2. Asociación de dominio (`assetlinks.json`)

- [x] 2.1 Crear `public/.well-known/assetlinks.json` con `package_name` `com.justpoker.app` y `sha256_cert_fingerprints` (huella del keystore de release para pruebas); verificar que el JSON parsea (`node -e "JSON.parse(require('fs').readFileSync('public/.well-known/assetlinks.json'))"`).
- [x] 2.2 Ejecutar `npm run build` y verificar que existe `dist/.well-known/assetlinks.json` (Vite copia `public/` y el rewrite SPA no lo intercepta).
- [x] 2.3 Documentar en `store/PUBLISHING.md` cómo obtener la huella SHA-256 de Play App Signing (Play Console → App integrity) y actualizar el fichero; verificar que los pasos quedan escritos.

## 3. Manejo del enlace en la app

- [x] 3.1 Crear `src/utils/deepLink.ts` con `resolveDeepLink(rawUrl): string | null` que devuelve `pathname + search` solo para `https` del host de producción con prefijo `/online` o `/join`, y `null` en cualquier otro caso (otra ruta, otro host, otro esquema, URL inválida); verificar con test unitario `src/utils/deepLink.test.ts` (invitación válida, `/join` heredado, otra ruta, no-http, URL malformada) que `npx vitest run src/utils/deepLink.test.ts` pasa.
- [x] 3.2 Crear `src/hooks/useDeepLinks.ts` siguiendo el patrón de `useAndroidBackButton.ts` (guard `Capacitor.isNativePlatform()`, `getLaunchUrl()` para arranque en frío y `addListener('appUrlOpen')` en marcha, `resolveDeepLink` + `navigate`, ignorar `null`, limpieza en el `return`); verificar con `npx tsc --noEmit`.
- [x] 3.3 Invocar `useDeepLinks(navigate)` en `AnimatedRoutes` (`src/App.tsx`) junto a `useAndroidBackButton`; verificar que `npm run build` compila y que no se añaden textos visibles (i18n sin cambios).

## 4. Verificación e integración

- [x] 4.1 Ejecutar `npx oxlint src/`, `npx tsc --noEmit` y `npm run build`; verificar que los tres pasan y que `dist/.well-known/assetlinks.json` existe.
- [x] 4.2 Revisar la checklist de reutilización de `AGENTS.md`: confirmar que no se duplica la construcción del enlace de invitación ni el parseo del código, que se reutilizan `Online` y el patrón de `useAndroidBackButton.ts`, y que no hay definiciones repetidas (grep de `resolveDeepLink` y de `online?code=`); verificar el resultado.
- [x] 4.3 Prueba manual en dispositivo Android con build instalado: con la app instalada, abrir el enlace/QR de invitación abre la app y entra en la sala (arranque en frío y con la app en segundo plano), sin diálogo app/navegador; sin la app, el enlace abre la sala en el navegador. Verificar ambos casos o documentar el bloqueo si la verificación de dominio aún depende de la huella de Play.
  - **Bloqueo documentado:** no hay dispositivo ni AVD conectado (`adb devices` vacío, sin AVDs) y la web con `/.well-known/assetlinks.json` aún no está desplegada. Además, la apertura sin diálogo en un dispositivo con la app instalada desde Play requiere la huella de **Play App Signing** (ver `store/PUBLISHING.md` §6). Pendiente de la verificación en dispositivo tras desplegar y publicar.

## Workflow follow-up

- Tras publicar en Play, sustituir las huellas por las de Play App Signing y revalidar en un dispositivo real.
- Archivar el change cuando se cumplan los requisitos de revisión del proyecto.
