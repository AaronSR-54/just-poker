# Design

## Context

Ver `proposal.md - Why`. Puntos del estado actual que condicionan el diseño:

- La música usa Web Audio: `src/audio/music.ts` inyecta deps en `src/audio/musicController.ts`, que hace `fetch` de `/music/theme.webm` y `decodeAudioData` sobre **Opus en contenedor WebM**. iOS Safari decodifica ese formato por `<audio>` en algunas versiones, pero `decodeAudioData` falla (bug histórico de WebKit); en iOS Safari móvil el contenedor WebM no está soportado en absoluto.
- Los efectos (`src/audio/sfx.ts`) usan `new Audio(…webm)` con el mismo Opus/WebM.
- La háptica (`src/haptics/haptics.ts`) usa el plugin de Capacitor; en escritorio no hay vibración, pero `navigator.vibrate` puede existir igualmente (Chrome de escritorio lo define aunque no haya hardware).
- En Ajustes (`src/components/GameSettings.tsx`) los controles se muestran siempre; ya existe el precedente de ocultar condicionalmente un control: `{crtSupported && <SettingSlider …/>}` con la detección síncrona de `src/utils/crtSupport.ts`.

## Goals / Non-Goals

**Goals:**

- No ofrecer controles que no pueden funcionar (música/efectos sin audio reproducible; vibración sin hardware).
- Detectar la capacidad real de reproducción, no por user-agent, y cubrir Safari (iOS y escritorio).
- Reutilizar los controles y patrones existentes sin recrear UI ni duplicar lógica de detección.
- No cambiar el motor de audio ni añadir binarios, dependencias o claves i18n.

**Non-Goals:**

- Sustituir la pista o los efectos por formatos compatibles con Safari (`m4a`/`caf`/etc.) o cambiar el motor de Web Audio a `<audio>`.
- Detectar el modelo exacto de dispositivo o "adivinar" por user-agent.
- Persistir las capacidades (son volátiles y específicas del dispositivo).
- Traducir o cambiar textos de los controles.

## Decisions

### D1. Detección por capacidad real, en tres señales

- **Efectos:** síncrona por el camino de reproducción que usan (`<audio>`): `new Audio().canPlayType('audio/webm; codecs="opus"') !== ''`. En iOS Safari móvil devuelve vacío → sin soporte.
- **Música:** necesita `decodeAudioData`, que puede fallar aunque `<audio>` reproduzca el formato (Safari 15–17). Por eso la señal decisiva es el **resultado real de la decodificación** del propio motor: si `decodeAudioData` rechaza, se marca sin soporte. Un fallo de `fetch` (red) **no** se considera falta de soporte (sigue siendo reintentable). El valor inicial es optimista (con soporte) y parte del mismo chequeo de contenedor que los efectos, para ocultar de inmediato en iOS Safari móvil.
- **Vibración:** no hay API fiable de "tengo hardware de vibración". Se combina: `Capacitor.isNativePlatform()` **o** (`'vibrate' in navigator` **y** heurística de móvil/táctil: `navigator.userAgentData?.mobile` o `matchMedia('(pointer: coarse)')` / UA móvil). Así en escritorio (ratón, `userAgentData.mobile === false`, puntero fino) no se ofrece aunque `navigator.vibrate` exista.

**Alternativas consideradas:** detección solo síncrona por `canPlayType` (se descarta: en Safari 15 miente y mostraría el control de música con música silenciada); sonda dedicada con un asset de audio diminuto embebido (se descarta: añade un binario y trabajo duplicado — el motor ya decodifica al arrancar, y ese intento hace de sonda); user-agent puro (se descarta: frágil y no cubre variaciones de plataforma).

### D2. Un helper puro y un store reactivo

- **Nuevo `src/utils/mediaSupport.ts`**: detectores puros y síncronos `detectSfxSupport()` y `detectHapticsSupport()`, con guardas para entornos sin `window`/`navigator`/`Audio`. Sigue el precedente de `src/utils/crtSupport.ts` y es testeable en entorno node sin DOM.
- **Nuevo `src/store/capabilityStore.ts`** (zustand, **sin** `persist`): `{ music, sfx, haptics }` + `setMusicSupported(bool)`. Se inicializa desde los detectores; `music` arranca optimista y baja a `false` cuando el motor reporta un fallo de decodificación.

**Por qué un store:** la capacidad de música cambia de forma asíncrona (tras el intento de decodificación) y la UI debe re-renderizar. **Alternativas consideradas:** `settingsStore` con `partialize` (se descarta: es persistido y las capacidades son volátiles/específicas del dispositivo, se contaminaría); constante de módulo como `crtSupported` (se descarta para música: no es reactiva).

### D3. El motor de música reporta "formato no soportado"

Se amplía `MusicDeps` (`src/audio/musicController.ts`) con un callback `onDecodeUnsupported`. En `loadBuffer`, cuando **`decodeTrack`** rechaza, se invoca una sola vez y el controlador deja de reintentar (bandera interna `formatUnsupported`), evitando bucles en plataformas incompatibles. `src/audio/music.ts` lo cablea a `useCapabilityStore.getState().setMusicSupported(false)`.

Se distingue fallo de decodificación (forma no soportada) de fallo de `fetch` (red): solo el primero marca sin soporte, preservando el comportamiento de reintento actual (spec `music-playback`, "Carga de la pista recuperable").

### D4. Ocultar y no intentar reproducir

- **`src/components/GameSettings.tsx`**: lee `capabilityStore` y condiciona el deslizador de música, el de efectos y la sección de vibración. No se introducen componentes nuevos.
- **`src/audio/sfx.ts`**: `preloadSounds` y `playSfx`/`fire` salen si `!capabilityStore.sfx`.
- **`src/haptics/haptics.ts`**: `playHaptic` sale si `!capabilityStore.haptics` (además de respetar `hapticsEnabled`).

### Reutilización (obligatorio)

- **Se reutiliza:** `SettingSlider`, `Section` y `SegmentedControl` de `src/components/` (sin recrear controles); el patrón de detección síncrona con constante/hook de `src/utils/crtSupport.ts`; `Capacitor.isNativePlatform()` (ya usado en `music.ts`, hooks de Capacitor); el patrón de store `zustand` de `src/store/settingsStore.ts`; el estilo de tests unitarios de funciones puras (entorno node).
- **Se extrae/añade:** `src/utils/mediaSupport.ts` (detección compartida música/efectos/vibración, una sola definición) y `src/store/capabilityStore.ts` (fuente única reactiva). Se añade el callback `onDecodeUnsupported` a `MusicDeps`.
- **No se extrae:** la condición `{cap && <SettingSlider …/>}` (y la sección de vibración) es una lectura de store + un render condicional de una línea dentro de un único archivo, repetido como máximo dos veces; envolverla en un componente añadiría indirección sin eliminar duplicación real, así que se deja inline.

## Risks / Trade-offs

- **Heurística de vibración imprecisa** ([portátil táctil con puntero fino podría ocultar el control aunque vibre]) → Mitigación: es exactamente el comportamiento pedido (en escritorio no debe aparecer); se prioriza no mostrar controles inútiles y se documenta la limitación.
- **Música asíncrona** ([en una plataforma donde `<audio>` reproduce pero `decodeAudioData` falla, el deslizador de música puede aparecer un instante hasta que falla la decodificación de arranque]) → Mitigación: la decodificación ocurre al iniciar la app; al bajar la capacidad, el store re-renderiza y el control desaparece.
- **Hipótesis conservadora** ([asumir "sin música" si el contenedor no lo reproduce por `<audio>`]) → Mitigación: es el mismo códec/camino; el riesgo de ocultar un control que funcionaría es bajo y preferible a mostrar uno que no funciona.
- **Intento único de sonda** ([en plataformas sin soporte se hace un intento silencioso de decodificación]) → Mitigación: no produce sonido ni error visible; es el propio chequeo de capacidad y no se repite.

## Migration Plan

- Sin migración de datos: los valores persistidos (`musicVolume`, `sfxVolume`, `hapticsEnabled`) se conservan; las capacidades se calculan en tiempo de ejecución y **no** se persisten.
- Despliegue: cambio de código web; el APK de Android se recompila con `npm run android` cuando corresponda (no es obligatorio para publicar el cambio web).
- Rollback: revertir el change; desaparecen el helper y el store y los controles vuelven a mostrarse incondicionalmente.

## Open Questions

- ¿Debe reevaluarse la capacidad de vibración si cambia el puntero (acoplar/desacoplar ratón) en tiempo de ejecución? Se resuelve evaluando una sola vez al iniciar; reevaluar en caliente es un refinamiento posterior que no altera el contrato de los specs.
