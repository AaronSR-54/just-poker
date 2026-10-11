# Proposal

## Why

Hoy el enlace/QR de invitación (`https://just-poker-delta.vercel.app/online?code=XXXX`, ver `Online.tsx:466`) abre siempre el navegador, incluso en un Android que ya tiene la app instalada. El invitado no aterriza en la app y el QR no aprovecha la distribución nativa. Queremos que, si la app está instalada, el sistema abra la app directamente y lo lleve a esa sala; si no lo está, que siga abriéndose la sala en el navegador, sin cambios.

Además, ese enlace/QR se construye con el origen actual de la página (`window.location.origin`, `Online.tsx:466`); dentro de la app nativa ese origen es el local de la WebView, de modo que el QR mostrado desde la app codifica una dirección inválida. El enlace/QR debe usar el origen del despliegue de producción (el mismo host de App Links), con el origen actual como alternativa en la web.

## What Changes

- Declarar el dominio de producción como host verificado de **Android App Links** para las rutas de invitación, de modo que abrir/escancanear un enlace de invitación abra la app directa (sin navegador ni diálogo del sistema) cuando está instalada.
- Servir el fichero de asociación de dominio (`/.well-known/assetlinks.json`) con la huella del certificado de firma de la app.
- Construir el enlace/QR de invitación con el origen del despliegue de producción (reutilizando `onlineOrigin()`), en vez del origen de la página, para que el QR sea válido cuando se muestra desde la app nativa; en la web se conserva el mismo origen.
- Manejar el enlace entrante dentro de la app (arranque en frío y app ya abierta/en segundo plano), enrutando a la sala con el `code` para incorporarse a la misma sala.
- Mantener el flujo actual de navegador como *fallback* cuando la app **no** está instalada.
- Documentar el paso de huella de **Play App Signing** (la verificación depende de ella; hoy el keystore es un *placeholder*).
- **No** se aloja ni descarga ningún APK: el *fallback* es la web, no una instalación por *sideload*.

## Capabilities

### New Capabilities
- `app-links`: comportamiento observable de los enlaces de invitación en Android: abrir la app instalada y llevar a la sala conservando el código; abrir la sala en el navegador cuando la app no está instalada; y recibir enlaces tanto en arranque en frío como con la app ya en marcha.

### Modified Capabilities
- `online-lobby`: el enlace/QR de invitación pasa a codificar el enlace del despliegue de producción, de modo que el QR siga siendo válido cuando se muestra desde la app nativa; en la web, sin origen configurado, se mantiene el mismo origen.

## Impact

- **Android nativo:** `android/app/src/main/AndroidManifest.xml` (nuevo `intent-filter` de App Links con `autoVerify`).
- **Web/hosting:** fichero nuevo `public/.well-known/assetlinks.json` servido en el dominio de Vercel (verificar que el rewrite SPA de `vercel.json` no lo intercepta).
- **App (SPA):** `src/App.tsx` y un hook nuevo en `src/hooks/` (mismo patrón que `useAndroidBackButton.ts`) que escucha el enlace entrante y navega a `/online?code=…`; la pantalla `Online` sigue resolviendo el `?code=` sin cambios.
- **App (SPA):** `src/screens/Online.tsx` construye el enlace/QR de invitación reutilizando `src/config/online.ts` (`onlineOrigin()`), con `window.location.origin` como alternativa en la web.
- **Dependencias:** sin nuevas; `@capacitor/app` y `Capacitor` ya se usan.
- **Reutilización:** no se añade UI ni componentes; se reutiliza el manejo de `?code=` de `Online` y el patrón de hooks nativos de `src/hooks/`. El enlace de invitación se construye en un único punto (`Online.tsx`), reutilizando `onlineOrigin()`; no se duplica.
- **i18n:** sin textos visibles nuevos.
- **Docs:** anotar el requisito de huella del certificado (Play App Signing) donde corresponda (`AGENTS.md`/`store/PUBLISHING.md`).
