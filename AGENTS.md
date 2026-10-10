# Just Poker — Guía de Estilos y Convenciones

## Regla de oro

La maquetación se hace **siempre** con utilidades nativas de Tailwind, aplicadas directamente en el JSX.

- **Nada custom:** no se crean clases CSS propias, ni `@utility`, ni `@apply`, ni bloques de "componentes" en CSS.
- **Estilos coherentes:** reutiliza las mismas recetas de utilidades en toda la app (mismas fuentes, tamaños, espaciados y colores).
- Si un patrón se repite mucho, extrae un **componente React** en `src/components/` con utilidades nativas, no una clase CSS.

## Reutilización y buenas prácticas

Norma obligatoria para **todo change** (OpenSpec SDD). Antes de escribir código nuevo, comprueba si ya existe un componente, helper o receta que puedas reutilizar. La deuda existente y las remediaciones planificadas están en `docs/code-reuse-audit.md`.

### Reglas

1. **Reutiliza componentes:** usa lo que ya existe en `src/components/` (ver tabla de componentes) en lugar de recrear botones, badges, cartas, avatares, slots u overlays.
2. **Extrae, no copies:** si un patrón de JSX o de lógica se repite (o ya se repite en el repo), extrae un **componente React** en `src/components/` o un **helper** en `src/utils/`, y sustituye **todas** las copias.
3. **Sin duplicación de lógica:** cada función, constante o cálculo tiene **una sola definición**. Si dos módulos necesitan lo mismo, muévelo a un módulo compartido e impórtalo.
4. **Tokens y utilidades nativas:** colores, tamaños, radios y motion con tokens (`bone`, `ink`, `danger`, `text-fs-*`, `rounded-*`…). Nada de `rgba(...)`, `#fff` ni `text-[…]` en px.
5. **i18n siempre:** ningún texto visible hardcodeado; usa `t(...)`, también en `aria-label`, `title` y `placeholder`.

### Checklist de revisión de change

Antes de dar un change por terminado, verifica:

- [ ] ¿He reutilizado los componentes de `src/components/` en lugar de recrearlos? _(primitivas reinventadas)_
- [ ] ¿He extraído el markup y la lógica que se repetían? _(duplicación de JSX/lógica)_
- [ ] ¿Hay funciones, constantes o helpers definidos más de una vez? _(helpers duplicados)_
- [ ] ¿Uso tokens en vez de colores y tamaños crudos? _(violaciones de tokens)_
- [ ] ¿Todo el texto visible pasa por `t(...)`? _(strings hardcodeados)_

## Stack de estilos

Tailwind CSS v4 (configuración CSS-first, sin `tailwind.config.js`).

- Plugin de Vite: `@tailwindcss/vite` (ver `vite.config.ts`).
- Único entry point: `src/styles/index.css` (`@import "tailwindcss"`).
- Fuentes: `src/styles/fonts.css`.
- `index.css` solo contiene: `@theme` (tokens) y `@layer base` (resets de `html`/`body`). **Sin utilidades ni clases propias.**
- **No existe `app.css` ni `tokens.css`.**

## Design Tokens (`@theme`)

Los tokens viven en el bloque `@theme` de `index.css` y Tailwind los expone como utilidades. **No uses valores crudos** para colores, fuentes ni radios.

### Colores (utilidades `*-<token>`)

| Token | Valor | Utilidad ejemplo |
|-------|-------|------------------|
| `--color-bone` | `rgb(205 197 183)` | `text-bone`, `bg-bone`, `border-bone/40` |
| `--color-bone-100/200/700` | variantes | `text-bone-700` |
| `--color-ink` | `rgb(34 32 31)` | `bg-ink`, `text-ink` |
| `--color-ink-100/200/900/alt` | variantes | `bg-ink-200`, `bg-ink-900/85` |
| `--color-bg` / `--color-fg` | semánticos | `bg-bg`, `text-fg` |
| `--color-border` | `rgba(255,255,255,.10)` | `border-border` |
| `--color-danger` | `rgb(232 115 74)` | `text-danger`, `bg-danger/20` |
| `--color-danger-bone` | `rgb(158 43 32)` | `text-danger-bone` (rojo sobre `bone`) |
| `--color-info` | `rgb(91 138 240)` | `text-info`, `bg-info/15` |
| `--color-success` | `rgb(143 206 143)` | `text-success` |
| `--color-success-deep` | `rgb(40 88 44)` | `text-success-deep` (sobre fondo claro) |
| `--color-success-bone` | `rgb(21 128 61)` | `text-success-bone` (verde sobre `bone`) |
| `--color-blind-sb` | `rgb(56 74 132)` | `bg-blind-sb` (small blind) |
| `--color-blind-bb` | `rgb(214 174 70)` | `bg-blind-bb` (big blind) |

Para opacidad usa el modificador `/`: `bg-bone/10`, `border-bone/[0.18]`, `bg-ink-900/85`. **No escribas `rgba(205,197,183,…)` ni `#fff` inline**; usa `bone` con `/`.

### Tipografía

Fuentes: `font-display`, `font-body`, `font-ui`.

Escala de tamaños (utilidades `text-fs-*`): `fs-100` 10px, `fs-200` 12px, `fs-300` 14px, `fs-400` 16px, `fs-500` 20px, `fs-600` 24px, `fs-700` 32px, `fs-800` 48px, `fs-900` 96px.

> **Legibilidad en desktop:** a partir de 768px los tokens pequeños crecen automáticamente (`fs-100` → 13px, `fs-200` → 14px) para no usar nunca 10px ni 12px en desktop. Usa siempre los tokens `text-fs-*`; **no escribas tamaños en px crudos** (ni `text-xs`). Si necesitas un tamaño menor, resérvalo a móvil con `max-md:text-fs-100`.

**Recetas tipográficas** (copia estas cadenas tal cual; no son clases, son combinaciones de utilidades nativas):

| Rol | Utilidades |
|-----|-----------|
| Eyebrow | `font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65` |
| Título (h1) | `font-display font-bold leading-[0.94] tracking-[-0.015em]` |
| Subtítulo (h2) | `font-display font-bold leading-none tracking-[-0.01em]` |
| Encabezado (h3) | `font-display font-bold leading-none` |
| Label | `font-display font-bold text-fs-100 tracking-[0.14em] uppercase` |
| Cuerpo | `font-body leading-[1.45]` |
| Caption | `font-body text-fs-100 tracking-[0.04em] opacity-70` |
| Flecha | `font-display font-bold leading-none` |
| Marca "Just Poker" | `font-display font-bold text-fs-400 uppercase tracking-[0.08em]` + `<em className="font-light italic tracking-normal">` |

Combina el rol con su tamaño cuando no sea el por defecto:

```tsx
<div className="font-display font-bold leading-none tracking-[-0.01em] text-fs-700">Tres mesas.</div>
<div className="font-body text-[10px] tracking-[0.04em] opacity-70">texto fino</div>
```

### Espaciado

Escala por defecto de Tailwind (`--spacing: 0.25rem`): `gap-1` 4px, `gap-2` 8px, `gap-3` 12px, `gap-4` 16px, `gap-5` 20px, `gap-6` 24px, `gap-8` 32px, `gap-12` 48px, `gap-32` 128px. También valores dinámicos: `pt-15`, `size-13`, `w-15`, `min-w-40`, etc.

### Radios y motion

- Radios: `rounded-screen`, `rounded-card`, `rounded-slot`, `rounded-pill`, `rounded-[14px]`.
- Easing: `ease-brand`, `ease-out-brand`.
- Animaciones: `animate-jp-pulse`, `animate-timer-drain`, `animate-lobby-pulse`.
- Z-index dinámicos: `z-100`, `z-200`, `z-300`.

## Componentes reutilizables (React)

Prefiere estos componentes antes de replicar utilidades:

| Componente | Props clave |
|------------|-------------|
| `Button` | `variant` (`outline`/`primary`/`ghost`), `size` (`sm`/`''`/`lg`), `block`, `as` (p. ej. `as="a"` para enlaces) |
| `Avatar` | `name`, `size` (24–120), `ring`, `muted` |
| `PokerCard` | `rank`, `suit`, `size` (`xs`–`xxl`), `dimmed` |
| `Badge` | `variant` (`neutral`/`warning`/`info`/`turn`) |
| `RankBadge`, `RankBlock`, `TopBar`, `Wordmark`, `ConfirmDialog`, `SettingsButton` | ver `src/components/` |

## Layout

Utilidades nativas directamente en el JSX. Ya **no** existen `.row`, `.col`, `.gap-*`, `.center`, `.between`, `.muted`, `.faint`:

| Antes | Ahora |
|-------|-------|
| `.row` | `flex items-center` |
| `.col` | `flex flex-col` |
| `.center` | `flex items-center justify-center` |
| `.between` | `justify-between` |
| `.grow` | `flex-1` |
| `.muted` | `opacity-60` |
| `.faint` | `opacity-40` |

### Contenedor de pantalla

```tsx
<div className="relative flex h-screen w-full flex-col overflow-hidden bg-ink font-body text-fs-300 leading-[1.25] text-bone">
```

### Slot de jugador

```tsx
<div className="relative flex flex-col items-center gap-2.5 rounded-slot border border-bone/[0.18] px-5 py-[1.125rem]">
```

Estados con clases condicionales: `border-bone shadow-[…]` (activo), `opacity-[0.32]` (folded), `border-bone bg-bone/[0.06]` (winner).

## Reglas: utilidades vs inline styles

| Situación | Usar |
|-----------|------|
| Layout, espaciado, tipografía, colores | Utilidades Tailwind nativas |
| Estados (active, folded, winner, turn) | Clases condicionales en el JSX |
| Valores dinámicos (width %, opacity calculada, posiciones) | `style={{ … }}` |
| Patrón que se repite mucho | Componente React en `src/components/` |

### ✅ DO
- Usa solo utilidades nativas (`flex`, `gap-*`, `text-fs-*`, `bg-bone`, `tracking-[…]`, …).
- Usa tokens (`bone`, `ink`, `danger`, `text-fs-*`) en vez de valores crudos.
- Usa los componentes de `src/components/` para botones, badges, cartas, avatares y slots.
- Usa `style={{}}` solo para valores dinámicos.
- Repite las recetas tipográficas de esta guía para mantener coherencia.

### ❌ DON'T
- **No crees clases CSS propias** (`jp-*`, `brand`, etc.) ni uses `@utility`/`@apply`.
- No reintroduzcas `app.css` ni `tokens.css`.
- No uses `rgba(205,197,183,…)` ni `#fff` inline: usa `bone` con `/`.
- No uses `fontFamily`, `letterSpacing` ni `textTransform` inline: usa `font-display`/`font-body`, `tracking-[…]`, `uppercase`.
- No añadas estilos de componente en `index.css`; si se repite, haz un componente React.

## Internacionalización (i18n)

Soporte **español (es)** e **inglés (en)** con un módulo propio, sin dependencias.

- Diccionarios: `src/i18n/translations.ts` (`es` define el tipo `Dict`; `en` debe cubrir las mismas claves).
- API: `useI18n()` devuelve `{ locale, setLocale, t }`; `t('clave.con.puntos', { param })` interpola `{param}`. Usa `t` de `src/i18n` **fuera** de componentes.
- Store persistido: `useLocaleStore` (clave `just-poker-language`); idioma inicial autodetectado del navegador (el primer idioma soportado de `navigator.languages`; `en` si no encuentra ninguno).
- Selector de idioma en `GameSettings` (sección «Idioma»).

### Reglas
- **Nunca escribas texto visible hardcodeado**: usa `t(...)`. Aplica también a `aria-label`, `title` y placeholders.
- Los nombres de combinaciones se resuelven por rango: `t(\`handName.${rank}\`)` (`HAND_RANKS`); no traduzcas `HandResult.name` del motor.
- Falta puntuación/orden distinto entre idiomas: compón desde claves pequeñas en lugar de concatenar.
- Mantén los marcadores `**negrita**` que renderiza `renderRich`.
- Al añadir una clave en `es`, añádela también en `en` (el tipo `Dict` lo exige).

## Tooling

- **Lint:** `npx oxlint src/`
- **Type check:** `npx tsc --noEmit`
- **Dev server:** `npm run dev` (web) · `npm run dev:server` (online) · `npm run dev:all` (web + online juntos)
- **Build:** `npm run build`

## Android (Capacitor / Google Play)

La app Android es la web de Vite empaquetada con **Capacitor 8** (WebView). Es 100 % offline: no necesita servidor.

### Generar el APK/AAB

```bash
npm run android          # release firmado -> just-poker.apk (+ AAB)
npm run android:debug    # APK de debug
```

Equivale a ejecutar `scripts/build-android.sh`, que hace:

```bash
npm run build            # web -> dist/
npx cap sync android     # copia dist/ y plugins al proyecto nativo
cd android && ./gradlew assembleRelease bundleRelease
```

Artefactos:

- `just-poker.apk` (raíz, release firmado)
- `android/app/build/outputs/apk/release/app-release.apk`
- `android/app/build/outputs/bundle/release/app-release.aab` (**subir este a Play**)

### Toolchain (instalación sin root)

- **JDK 21:** `mise use -g java@21.0.2` (o exporta `JAVA_HOME`).
- **Android SDK 36** en `~/android-sdk` (o exporta `ANDROID_HOME`); `android/local.properties` ya apunta con `sdk.dir`.

```bash
sdkmanager "platform-tools" "platforms;android-36" "build-tools;36.0.0"
```

El script autodetecta `JAVA_HOME`/`ANDROID_HOME`; si faltan, usa mise y `~/android-sdk`.

### Firma

- Keystore: `android/keystore/just-poker-release.jks`; credenciales en `android/keystore.properties` (ambos **gitignored**).
- Config en `signingConfigs.release` de `android/app/build.gradle`.
- ⚠️ La contraseña actual es `justpoker` (placeholder). Cámbiala y guarda el keystore: sin él no se pueden publicar actualizaciones.

### Iconos y splash

Fuente: `assets/logo.svg` (diamante bone sobre `#22201F`). Regenerar con:

```bash
npx capacitor-assets generate --android \
  --iconBackgroundColor '#22201f' --iconBackgroundColorDark '#22201f' \
  --splashBackgroundColor '#22201f' --splashBackgroundColorDark '#22201f'
```

### Configuración nativa (decisiones ya tomadas)

- `capacitor.config.ts`: `appId com.justpoker.app`, `webDir dist`.
- **No fullscreen:** `index.html` va **sin** `viewport-fit=cover`, para que Capacitor 8 (SystemBars) aplique padding nativo y el contenido no quede bajo la barra de estado.
- **Barra de estado clara** (iconos claros sobre fondo oscuro): `StatusBar.style` y `SystemBars.style` = `DARK` en `capacitor.config.ts`.
- **Splash con el fondo del icono:** `windowSplashScreenBackground` en `android/app/src/main/res/values/styles.xml` usa `@color/jp_background` (`#22201F`, definido en `values/colors.xml`). El `windowBackground` del tema también es ese color.
- Orientación vertical bloqueada en `AndroidManifest.xml`.
- Botón atrás de Android conectado al router: `src/hooks/useAndroidBackButton.ts`.

### Web (Vercel)

La misma web de Vite se despliega en Vercel con la **integración Git**: cada push a `main` lanza un deploy automático.

- `vercel.json` fija el framework (`vite`), `npm run build` y `dist`, con un *rewrite* SPA a `index.html` para el `BrowserRouter`.
- La política de privacidad queda servida en `https://just-poker-delta.vercel.app/privacy-policy.html`.
- No hace falta ningún workflow ni secretos: Vercel detecta el repo y despliega solo.

#### Online (Vercel Functions WebSockets + Redis)

El multijugador privado anónimo se sirve desde el **mismo dominio**: una Function de WebSockets + Redis para compartir salas y fan-out entre instancias.

- **Endpoint**: `api/socket-io.ts` exporta por defecto un `http.Server` con socket.io; la ruta pública es `/api/socket-io/socket.io`. El cliente (`src/net/socket.ts`) usa `path: '/api/socket-io/socket.io'` y `transports: ['websocket']` en producción; en desarrollo usa `/socket.io` a través del proxy de Vite.
- **Servidor de desarrollo**: `npm run dev:server` (levanta `server/index.ts` en `:3001`). El proxy de Vite (`/socket.io` con `ws: true`) hace el resto. Para levantar web y servidor online juntos, `npm run dev:all`.
- **Redis**: define `REDIS_URL` (Marketplace de Vercel / Upstash) en Preview y Production. Sin `REDIS_URL`, el servidor cae a un registro en memoria válido solo para una única instancia (desarrollo).
- **Duración de conexión**: las conexiones WebSocket se cierran al alcanzar `maxDuration` (configurado a 300 s en `vercel.json`); el cliente reconecta con backoff y re-emite `room:join`/`game:sync`.
- **Identidad**: anónima. El servidor asigna un `playerId` por conexión (el cliente lo guarda en `sessionStorage` para reconectar). No hay JWT, Prisma ni salas públicas.
- **Smoke test**: `npm run test:online` (con `dev:server` en marcha).

### Assets de tienda y publicación

- `npm run store:assets` genera `store/icon-512.png` y `store/feature-graphic-1024x500.png` (Satoshi, fondo `#22201F`).
- `public/privacy-policy.html` — política de privacidad (es/en). Se sirve en `https://just-poker-delta.vercel.app/privacy-policy.html` y es la URL que se declara en Play.
- La app declara el permiso `INTERNET` (necesario para el multijugador online). En Data safety, declarar que **no se recogen datos de usuario**: las salas online son anónimas y efímeras.

Para publicar en Play (fuera del repo) hace falta: cuenta de desarrollador (25 USD), subir el AAB, listing (capturas, descripción, feature graphic), política de privacidad pública, Data safety y content rating. Declarar **"poker de práctica, sin dinero real"** y marcar *simulated gambling*.
