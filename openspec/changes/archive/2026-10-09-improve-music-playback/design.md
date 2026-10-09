# Design

## Context

Ver `proposal.md` — Why. El estado actual está en `src/audio/music.ts` y sus puntos débiles son:

- `initMusic` registra `pointerdown`/`keydown` con `{ once: true }` (`music.ts:124-125`): tras el primer gesto se eliminan aunque el arranque falle, y no queda forma de reintentar sin recargar.
- `loadBuffer` cachea la promesa `loading` y nunca la limpia si falla (`music.ts:61-70`): un `fetch`/`decodeAudioData` fallido deja la carga rota de forma permanente hasta recargar.
- `startMusic` corta con `if (started || source) return;` (`music.ts:82,93`): una vez existe `source`, aunque el contexto quede suspendido o la fuente inválida, no se recrea nada.
- `onVisibility` suspende/reanuda a ciegas (`music.ts:127-132`): si `resume()` no cuaja (política de autoplay móvil o WebView congelado), la música queda muda sin recuperación.
- El ciclo de vida solo escucha `visibilitychange`, que en el WebView de Android no siempre refleja el paso a segundo plano.

Restricciones (`AGENTS.md`): sin clases CSS/estilos aquí (es lógica), textos vía `t(...)` solo si hubiera UI, sin nuevas dependencias; `@capacitor/app` y `@capacitor/core` ya están disponibles. Verificación con `npx tsc -b`, `npx oxlint src/`, `npm test` y smoke manual.

## Goals / Non-Goals

**Goals:**
- Que la música arranque de forma fiable y se recupere sola sin recargar.
- Aislar la decisión de reintento/recuperación en lógica testeable con dependencias inyectables.
- Cubrir web y Android WebView con el mismo núcleo, añadiendo el ciclo de vida nativo solo como fuente extra de eventos.

**Non-Goals:**
- No cambiar la pista (`/music/theme.webm`), el ducking, el fundido ni el volumen base.
- No añadir controles de reproducción (play/pausa manual) ni listas de pistas.
- No introducir dependencias nuevas ni un fallback de formato adicional (WebM/Opus se asume soportado).
- No tocar la UI ni el `settingsStore`.

## Decisions

### 1. Un adaptador inyectable con el motor de audio separado de la lógica
Se separa la lógica de estados (¿arrancado?, ¿cargando?, ¿visible?, volumen) de la Web Audio API. Un `createMusicController(deps)` recibe las dependencias del navegador (`createContext`, `fetch`, `decode`, `setTimeout`, suscripción a eventos) y expone `handleGesture`, `handleVisibility`, `handleVolume`, `handleStateChange`, `dispose`. `music.ts` queda como fábrica que cablea las dependencias reales y mantiene la API pública (`initMusic`, `startMusic`, `duckMusic`).

- **Por qué**: permite tests unitarios en entorno node con fakes, sin `jsdom` ni Web Audio real, y mantiene `music.ts` delgado.
- **Alternativas rechazadas**: testear el módulo singleton con mocks globales (frágil, `AudioContext` ausente); extraer solo funciones puras (no cubre la orquestación de reintentos, que es la parte que falla).

### 2. Los listeners de gesto dejan de ser `once` y se controlan por estado
Se registran `pointerdown`/`keydown` sin `{ once: true }`; cada gesto llama a un `unlock()` que, de forma síncrona, crea el contexto y llama a `resume()` (para no perder el "user gesture" de autoplay). Después intenta `ensurePlaying()`. Los listeners se eliminan **solo** cuando `started` es verdadero.

- **Por qué**: el fallo en móvil suele ser que el primer gesto no basta; reintentar en gestos posteriores es lo que evita recargar.
- **Alternativas rechazadas**: pedir un botón explícito de "activar audio" (cambia la UX); mantener los listeners siempre (trabajo mínimo pero innecesario tras `started`).

### 3. Carga del búfer con limpieza en fallo
`loadBuffer` guarda `loading`; en `catch` limpia `buffer`/`loading` y propaga el error para que el siguiente intento vuelva a `fetch` + `decode`. Si la pista ya está decodificada, se reutiliza el `AudioBuffer` cacheado.

- **Por qué**: hoy un fallo transitorio (red, decodificación) es permanente hasta recargar; limpiar la promesa lo vuelve reintentable.
- **Alternativas rechazadas**: reintentos internos con backoff automático (complejidad y consumo en segundo plano sin gesto).

### 4. Recuperación: recrear la fuente y escuchar `statechange`
El controlador distingue "arrancado" de "fuente viva". Ante `statechange` a `suspended`/`interrupted` estando visible, intenta `resume()`; si no cuaja, deja el estado listo para reintentar en el próximo gesto. Al reanudar tras una interrupción, si la fuente terminó o quedó inválida, se crea un nuevo `BufferSource` con el búfer cacheado (barato, sin re-decodificar).

- **Por qué**: en móvil el contexto puede quedar suspendido tras una interrupción (llamada, otra app) y el `source` anterior ya no sirve; recrearlo cubre el caso sin recargar.
- **Alternativas rechazadas**: recrear siempre la fuente en cada `visibilitychange` (cortes audibles innecesarios cuando el `resume()` sí funciona).

### 5. Intento de arranque automático al abrir, con respaldo en el gesto
Al inicializar, `initMusic` llama a `attemptAutoplay()` una vez (crea el contexto, intenta `resume()` y arranca). Si la plataforma lo permite (WebView de Capacitor, que fija `mediaPlaybackRequiresUserGesture(false)`; o un navegador con permiso/engagement), la música suena sola. Si lo bloquea, el `resume()` no cuaja, el estado queda armado y los listeners de gesto siguen activos: el primer toque reanuda el contexto y el arranque por gesto hace de respaldo. `attemptAutoplay` comparte implementación con `handleGesture` (`unlock()` + `ensurePlaying()`), solo cambia la intención.

- **Por qué**: en el APK la experiencia mejora mucho (suena al abrir); en web no empeora nada, porque el fallback de gesto ya existe.
- **Alternativas rechazadas**: depender solo del gesto (en APK obliga a un toque innecesario); llamar a un `<audio>` con `muted`/desmutear (no aplica a Web Audio y añade complejidad).

### 6. Ciclo de vida nativo además de `visibilitychange`
`initMusic` escucha `visibilitychange` (web) y, cuando `Capacitor.isNativePlatform()`, también `App.addListener('appStateChange')` para pausar/reanudar según el estado de la app. Ambos canales convergen en el mismo `handleVisibility(visible)` idempotente.

- **Por qué**: en Android el WebView no siempre dispara `visibilitychange` al ir a segundo plano; `appStateChange` es el evento fiable, y ya está disponible sin dependencias nuevas.
- **Alternativas rechazadas**: depender solo de `visibilitychange` (es el bug actual); añadir `pagehide/pageshow` (no cubre el ciclo nativo).

## Risks / Trade-offs

- **Reintentos repetidos molestos** → los gestos se eliminan en cuanto `started`; antes de eso cada gesto solo reintenta si aún no suena.
- **`resume()` rechazado en móvil pese a gesto** → el estado queda reintentable; el siguiente gesto o `visibilitychange` lo vuelve a intentar sin recargar.
- **Doble canal de eventos (visibility + appState) dispara dos reanudaciones** → `handleVisibility` es idempotente (comprueba el estado antes de actuar).
- **Pista aún no cargada al arrancar** → `ensurePlaying` espera a la decodificación y solo entonces crea la fuente; si falla, queda reintentable.
- **Recrear la fuente al volver** → pequeño salto audible en caso de recuperación; aceptable frente a la alternativa (silencio hasta recargar).

## Migration Plan

- Despliegue normal (web por Vercel, Android con `npm run android`). No hay migración de datos ni cambios de `localStorage`.
- Rollback: revertir el cambio en `src/audio/music.ts`, `src/audio/musicController.ts` y sus tests; sin impacto en persistencia.

## Open Questions

Ninguna.
