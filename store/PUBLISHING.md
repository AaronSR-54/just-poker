# Publicar Just Poker en Google Play

Checklist para dejar la ficha y la app publicadas. Web/Política:
`https://just-poker-delta.vercel.app` · política en `/privacy-policy.html`.

## 0. Requisitos previos

- Cuenta de desarrollador de Google Play (25 USD, pago único).
- Cuentas **personales creadas después del 13-nov-2023**: hay que hacer un
  **test cerrado con 12 testers opt-in durante 14 días seguidos** antes de poder
  solicitar acceso a producción. Los testers deben permanecer dentro todo el
  periodo (si alguien sale, su tiempo no cuenta).
- Keystore: `android/keystore/just-poker-release.jks` + `android/keystore.properties`
  (ambos gitignored). **Guardar copia segura**: sin él no se pueden publicar
  actualizaciones.
- Toolchain: JDK 21 y Android SDK 36 (ver `AGENTS.md`).

## 1. Assets (ya en el repo)

- Icono: `store/icon-512.png` (512×512).
- Gráfico destacado: `store/feature-graphic-1024x500.png` (1024×500).
- Capturas (1080×1920, subir mínimo 2): `store/screenshots/en/*.png` para la
  ficha inglesa y `store/screenshots/es/*.png` para la española. Las de la raíz
  (`store/screenshots/*.png`) son las antiguas y muestran el modo online ya oculto.
- Regenerar icono + gráfico: `npm run store:assets`.
- Regenerar capturas: `npm run store:screenshots` (inglés) o
  `npm run store:screenshots es` (español). Requiere `npx playwright install chromium`.
- Política de privacidad: `public/privacy-policy.html` (se sirve en la URL web).

## 2. Crear la app (una sola vez)

- **Nombre**: `Just Poker`.
- **Nombre del paquete**: `com.justpoker.app` — ⚠️ permanente; debe coincidir con
  el `applicationId` (`android/app/build.gradle`).
- **Idioma predeterminado**: `en-US` (alcance) o `es-ES` (público hispanohablante);
  el otro se añade en la ficha.
- **Tipo**: Juego. **Precio**: Gratis.
- Aceptar: Políticas del Programa, Firma de Aplicaciones de Play y leyes de exportación.

## 3. Contenido de la app (declaraciones)

- **Política de privacidad**: `https://just-poker-delta.vercel.app/privacy-policy.html`
- **Anuncios**: No.
- **Acceso a la app**: todas las funciones disponibles sin restricciones (no login).
- **Datos de inicio de sesión** (antes «Acceso a la app»): ¿alguna parte
  restringida? → **No** (sin login ni contenido de pago).
- **Clasificación de contenido**: cuestionario marcando **Temas de apuestas** y
  **Juegos de casino, loterías o apuestas en carreras**, y «los temas de apuestas
  son el foco del producto» → **Sí**. Resultado: **18+ / PEGI 18** (simulated
  gambling; sin dinero real, sin moneda de cambio). Corea del Sur queda fuera
  salvo revisión posterior de GRAC.
- **Público objetivo**: **18+** (coherente con la clasificación; «para familias» → No).
- **Seguridad de los datos**: el modo online **sí envía datos al servidor** (el de un jugador
  no envía nada), así que hay que declarar recogida:
  - **¿Recopila o comparte datos?**: **Sí**.
  - **Tipos de datos** (todos con finalidad **Funcionalidad de la app**):
    - Personal info → **Name** (el nombre de jugador que escribes; temporal).
    - App activity → **Other actions** (acciones/estado de la partida).
    - Device or other IDs → **Device or other IDs** (identificador anónimo de sesión).
  - **¿Obligatorio u opcional?**: **Opcional** (solo al usar el multijugador).
  - **¿Compartidos?**: **No** — Vercel y Upstash/Redis son **encargados** del tratamiento,
    no terceros.
  - **Cifrado en tránsito**: **Sí** (TLS/WSS).
  - **Eliminación de datos**: las salas se borran al terminar y, como máximo, a las **12 h**;
    no hay cuentas. El usuario puede pedir la supresión por correo
    (`aaronsanzroca@gmail.com`).
  > Nota: los datos online son anónimos, pero Google **obliga a declarar** lo que sale del
  > dispositivo; los 12 h de TTL **no** cuentan como «procesamiento efímero», así que se
  > declaran (y se muestran en la ficha).
- **Apps gubernamentales / Noticias / COVID**: No.
- **Funciones financieras**: ninguna (es juego simulado, sin dinero real).

## 4. Ficha de la tienda

- **Categoría**: Juego › Cartas.
- **Contacto**: `aaronsanzroca@gmail.com`.
- Subir icono, gráfico destacado y capturas.
- Descripciones (es/en) más abajo.

### Español

- Título: `Just Poker` (o `Just Poker: póker sin dinero`, ≤30).
- Corta (≤80): `Póker de práctica sin conexión. Sin anuncios, sin dinero real, sin cuentas.`

```
Just Poker es póker de práctica, para un jugador y sin dinero real. Sin anuncios, sin registros y sin conexión: solo tú y la mesa.

Juega contra rivales controlados por IA con personalidad propia, sube y baja la apuesta, y aprende a leer la mesa a tu ritmo.

▸ Un jugador contra la IA
Enfréntate a nueve rivales con estilos distintos: desde el jugador cauto que nunca se retira hasta el hiperagresivo que sube en cada ronda. Elige entre tres dificultades:
• El Remanso — sin prisa ni presión.
• La Guarida — el equilibrio justo.
• La Fosa — solo para quien sabe lo que hace.

▸ Aprende las manos
Guía integrada con las diez combinaciones, de carta alta a escalera real, con ejemplos navegables. Ideal si estás aprendiendo.

▸ Sin dinero real, sin trampas
Es un juego de práctica. No hay apuestas con dinero real, ni compras, ni monedas que se agoten. Nada te empuja a pagar.

▸ Sin anuncios, sin cuentas
El modo de un jugador funciona 100 % offline. El multijugador privado es opcional y anónimo: sin registrarte ni dar datos personales. Sin publicidad y sin rastreadores.

▸ Español e inglés
Interfaz y ayuda disponibles en ambos idiomas.

Relájate y juega. Just Poker.
```

### English

- Title: `Just Poker` (or `Just Poker: Offline Poker`, ≤30).
- Short (≤80): `Offline poker practice vs AI. No ads, no real money, no accounts.`

```
Just Poker is single-player, offline poker practice — with no real money. No ads, no sign-up, no connection: just you and the table.

Play against AI rivals with their own personalities, raise or fold, and learn to read the table at your own pace.

▸ Single player vs AI
Face nine rivals with distinct styles — from the cautious player who never folds to the hyper-aggressive one who raises every round. Pick one of three difficulties:
• The Haven — no rush, no pressure.
• The Den — the right balance.
• The Pit — only for those who know what they're doing.

▸ Learn the hands
Built-in guide to all ten hand rankings, from high card to royal flush, with browsable examples. Great if you're just starting out.

▸ No real money, no tricks
It's a practice game. No real-money betting, no purchases, no coins that run out. Nothing pushes you to pay.

▸ No ads, no accounts
Single-player works fully offline. Private multiplayer is optional and anonymous: no sign-up, no personal data. No advertising and no trackers.

▸ Spanish and English
Interface and help available in both languages.

Relax and play. Just Poker.
```

## 5. Generar el AAB

```bash
npm run android
```

- Artefacto: `android/app/build/outputs/bundle/release/app-release.aab`
- Sube `versionCode` en `android/app/build.gradle` **antes de cada subida**; el
  `versionName` puede repetirse. Versión actual: **versionCode 5**, `versionName 1.2.1`.
- La app incluye el **multijugador online** (`ONLINE_ENABLED = true`,
  `src/config/features.ts`). El build de Android apunta al servidor de producción con
  `VITE_ONLINE_URL=https://just-poker-delta.vercel.app` (`scripts/build-android.sh`).
- Al tocar el online hay que mantener al día las declaraciones de datos (sección 3) y
  `public/privacy-policy.html`.

## 6. Subir y probar

1. **Pruebas internas**: `Probar y publicar → Pruebas → Pruebas internas`,
   subir el `.aab`, aceptar **Play App Signing** (el keystore del repo actúa como
   *upload key*), añadir testers y publicar. Verifica que instala y abre.
2. **Pruebas cerradas**: crea la pista con **12 testers**. Arranca el reloj de
   **14 días seguidos**.
3. **Producción**: al cumplir los 14 días, *Solicitar acceso a producción* →
   cuestionario → revisión (hasta ~7 días).

## 7. Después de publicar

- **Perfil de desarrollador** (`Developer account → Developer profile`): requiere
  al menos 1 app publicada. Icono 512×512 PNG-32, header 4096×2304 JPG/PNG sin
  alpha, texto promocional ≤140 caracteres, web y app destacada.
- **Nombre público del desarrollador**: `sanzaar` (`Developer account → About you`).
- Si cambia el dominio, actualiza la URL en `AGENTS.md` y en la ficha.

## Notas

- El modo de un jugador es 100 % offline y sin anuncios; el online es opcional y anónimo →
  Data safety **con** datos declarados (sección 3).
- El despliegue web lo hace la **integración Git de Vercel** (no GitHub Actions).
