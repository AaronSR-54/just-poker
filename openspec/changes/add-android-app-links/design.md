# Design

## Context

Ver `proposal.md - Why` para la motivación. Estado actual relevante:

- El enlace/QR de invitación se construye en `Online.tsx:466` como `${window.location.origin}/online?code=${room.code}`; el mismo dominio (`https://just-poker-delta.vercel.app`) es el que usa el build nativo vía `VITE_ONLINE_URL` (`scripts/build-android.sh`) y el que sirve `api/socket-io.ts`.
- La app Android es la web empaquetada con Capacitor 8 (`webDir: dist`, sin `server.url`), por lo que la WebView carga el bundle local y **no** navega sola a la URL del enlace.
- `@capacitor/app` ya es dependencia y ya se usa (`useAndroidBackButton.ts`, `audio/music.ts`); la `MainActivity` ya tiene `android:launchMode="singleTask"`.
- `vercel.json` reescribe todo a `index.html` (SPA); el hosting sirve ficheros estáticos antes del *rewrite*.
- La firma nativa usa un keystore *placeholder* y la app aún no está en Play; la verificación de App Links depende de la huella del certificado con el que Google firma las instalaciones de Play.

## Goals / Non-Goals

**Goals:**

- Reutilizar el mismo enlace/QR y el mismo flujo de `?code=` sin cambios en `Online.tsx`.
- Que un Android con la app instalada abra el enlace en la app (sin diálogo del sistema) y entre en la sala; sin la app, navegador como hoy.
- Recibir el enlace tanto en arranque en frío como con la app ya en marcha.

**Non-Goals:**

- Alojar o descargar un APK (el *fallback* es la web, no *sideload*).
- Abrir en la app enlaces que no sean de invitación.
- iOS u otros esquemas personalizados.
- Publicar en Play (fuera de este cambio; solo se documenta el requisito de huella).

## Decisions

### D1 — Android App Links verificados, no esquema propio

Se usa **App Links verificados** sobre el dominio https existente. Es la única opción que mantiene un **único** enlace que sirve para la app (si está instalada) y para la web (*fallback*), sin diálogo del sistema cuando el dominio está verificado. Alternativas: un esquema propio (`justpoker://…`) exigiría diálogo y no tendría *fallback* web; el Play Install Referrer solo atribuye instalaciones, no abre la app ya instalada.

### D2 — La app recibe el enlace y navega dentro de la SPA

Se usa `@capacitor/app`: `getLaunchUrl()` para arranque en frío y `addListener('appUrlOpen')` si la app ya está en marcha. La URL entrante se parsea con `new URL` y se navega a `pathname + search`, de modo que la ruta `/online` reutiliza el manejo de `?code=` que ya existe (`Online.tsx:213-232`), sin tocarlo. Alternativa descartada: configurar `server.url` para que la WebView cargue la URL remota — afecta a toda la app (offline-first) y a la carga normal.

### D3 — Hook nuevo siguiendo el patrón existente

La resolución de la URL (aceptar solo el dominio y las rutas de invitación, devolver `pathname + search`) se aísla en un helper puro `src/utils/deepLink.ts` (`resolveDeepLink`), fácil de testear. El hook `src/hooks/useDeepLinks.ts` sigue el patrón de `useAndroidBackButton.ts` (guard con `Capacitor.isNativePlatform()`, `addListener`, limpieza en el `return`), usa el helper y se invoca junto a `useAndroidBackButton` en `AnimatedRoutes` (`App.tsx`). No se crea UI nueva.

### D4 — Filtros de intent en la MainActivity

Se añade a `android/app/src/main/AndroidManifest.xml` un `intent-filter` con `autoVerify="true"`, `scheme=https`, `host=just-poker-delta.vercel.app` y `pathPrefix` para `/online` (y `/join`, que ya redirige a `/online?code=`). `singleTask` ya está puesto, así que un enlace con la app en marcha llega por `appUrlOpen`. Los enlaces fuera de esos prefijos siguen abriéndose en el navegador.

### D5 — Asociación de dominio servida como fichero estático

Se sirve `public/.well-known/assetlinks.json` (Vite lo copia a `dist/`) con `package_name: com.justpoker.app` y las huellas `sha256_cert_fingerprints`. Vercel sirve ficheros estáticos antes del *rewrite* SPA, por lo que no lo intercepta (a verificar en el despliegue). Las huellas deben ser las de **Play App Signing** (Play Console → App integrity); para pruebas locales/pre-Play, la del keystore de release.

### Reutilización (regla del proyecto)

- **Se reutiliza:** el manejo de `?code=` de `Online` (sin cambios), el patrón de `useAndroidBackButton.ts` y `Capacitor.isNativePlatform()`, la dependencia `@capacitor/app`, y el dominio ya compartido entre `Online.tsx` y `scripts/build-android.sh`.
- **Se extrae/nueva:** un helper `resolveDeepLink` (`src/utils/deepLink.ts`) con su test, y un único hook `useDeepLinks` que lo usa; la lógica de parseo no se duplica en ningún otro sitio. `assetlinks.json` es la única definición de la asociación de dominio.
- **No se extrae:** el `intent-filter` es configuración declarativa de plataforma y no puede ser un helper compartido; el QR y la URL de invitación ya viven en un solo punto (`Online.tsx:466`), que no se toca.

## Risks / Trade-offs

- [Huella de firma incorrecta → la verificación falla y Android muestra el diálogo app/navegador] → Cargar las huellas de Play App Signing (clave de *app signing*, y de *upload* si aplica) y validar con `adb shell pm get-app-links com.justpoker.app` / herramienta de App Links de Play.
- [Keystore *placeholder*/app no publicada → no se puede verificar App Links aún] → Probar con el keystore de release en local y añadir las huellas definitivas antes de la publicación; documentar el paso.
- [El *rewrite* SPA de `vercel.json` intercepta `/.well-known/assetlinks.json`] → Verificar que el fichero responde JSON en el dominio real; si no, excluir la ruta.
- [La app se abre pero la navegación llega antes de montar el router, o se repite en arranque en frío] → Manejar ambos caminos (`getLaunchUrl` + listener), ignorar URLs no `http(s)` y evitar navegar dos veces al mismo destino.
- [Solo `/online` y `/join` abren la app; otras rutas van al navegador] → Aceptado y coherente con la spec (`app-links`); no es un defecto.

## Migration Plan

1. Añadir el `intent-filter` (D4), el hook (D2/D3) y `assetlinks.json` (D5) con la huella del keystore de release para pruebas.
2. Desplegar la web para que `/.well-known/assetlinks.json` quede servido.
3. Al publicar en Play, sustituir las huellas por las de Play App Signing y verificar en un dispositivo real (instalar desde Play y comprobar apertura sin diálogo).
4. Rollback: quitar el `intent-filter` y el `assetlinks.json`; los enlaces vuelven a abrirse en el navegador, sin migración de datos.

## Open Questions

Ninguna que cambie la spec, el enfoque o las tareas.
