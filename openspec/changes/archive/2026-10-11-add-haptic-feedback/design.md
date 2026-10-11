# Design

## Context

La app es una SPA React que también se empaqueta con Capacitor 8 para Android. Ya existen plugins de Capacitor (`@capacitor/app`, `@capacitor/status-bar`, `@capacitor/splash-screen`) y un módulo de sonido `src/audio/sfx.ts` que sirve de patrón arquitectónico: un módulo único que mapea un nombre de efecto a su reproducción y consulta el ajuste en el momento de disparar.

Los eventos que interesan ya están instrumentados para el sonido o las animaciones:

- Pulsaciones de botones: un manejador global de `click` en `src/App.tsx` que reproduce `ui_click`.
- Turno propio: `src/hooks/useGameSounds.ts` detecta la transición a `currentPlayer === 0` y reproduce `turn_tick` (compartido por partida local y online).
- Tiempo agotado: `src/screens/Game/hooks/useTurnCountdown.ts` detecta `timerSeconds === 0` y reproduce `time_expire` (compartido por local y online).
- Fin de mano: `src/screens/Game/hooks/usePotAward.ts` se dispara una vez por mano al repartir el bote y conoce a los ganadores.

Ajustes vive en `src/components/GameSettings.tsx` y el estado persistido en `src/store/settingsStore.ts` (zustand + persist, clave `just-poker-settings`).

## Goals / Non-Goals

**Goals:**

- Centralizar toda la lógica de vibración en un único módulo, análogo a `src/audio/sfx.ts`, sin dispersar llamadas al plugin.
- Respetar el ajuste del usuario en el punto de disparo y degradar sin efecto si la plataforma no vibra.
- Eliminar la duplicación de la receta de control segmentado detectada en `docs/code-reuse-audit.md` (§2.1, fila #3) al añadir un tercer uso.

**Non-Goals:**

- Vibración sensible a la intensidad del sonido o a la velocidad de juego (los eventos son discretos, no volumétricos).
- Añadir patrones de vibración complejos o personalizables por evento.
- Vibración en el escritorio/web donde el dispositivo no la soporta más allá de la degradación silenciosa.

## Decisions

### 1. Módulo único `src/haptics/haptics.ts`

Se crea un módulo con un tipo `HapticName` (`'tap' | 'turn' | 'tick' | 'expire' | 'win'`) y una función de disparo que consulta `useSettingsStore.getState().hapticsEnabled` en el momento de la llamada y se aborta si está desactivada. Es el mismo patrón que `src/audio/sfx.ts` (que consulta `sfxVolume` en `fire`).

Mapeo a la API del plugin:

- `tap` → impacto ligero (breve).
- `turn` → impacto medio (aviso destacado pero no agresivo).
- `tick` → impacto ligero (pulso sutil de cuenta atrás).
- `expire` → notificación de advertencia (más perceptible).
- `win` → notificación de éxito.

**Alternativa considerada:** llamar a `navigator.vibrate()` directamente. Se descarta: no existe en iOS ni en la mayoría de escritorio, y en Android WebView requiere permiso `VIBRATE` que el plugin sí aporta al sincronizar. El plugin además ofrece API semántica (impacto/notificación) y una implementación web basada en la Vibration API, lo que cubre la degradación.

### 2. Nueva dependencia `@capacitor/haptics@^8`

Coherente con los plugins 8.x ya usados y con peer `@capacitor/core >=8`. No requiere cambios manuales en `AndroidManifest.xml`: el plugin aporta su permiso al hacer `npx cap sync`.

### 3. Puntos de disparo

Se engancha cada evento en el punto que ya existe, sin duplicar detección:

- **Pulsación:** en el manejador global de `click` de `src/App.tsx`, disparando para todo botón habilitado (también los del panel de subida, donde el sonido sí se omite). La vibración breve es deseable en cada pulsación intencionada.
- **Turno:** en `src/hooks/useGameSounds.ts`, en la rama que ya detecta el cambio de `currentPlayer` a `0` y reproduce `turn_tick`, respetando la bandera de inicialización para no vibrar al montar.
- **Cuenta atrás:** en `src/screens/Game/hooks/useTurnCountdown.ts`, en la rama de los últimos 5 segundos (`timerSeconds <= 5`), que ya reproduce `timer_tick`, se dispara `tick` (impacto ligero) en cada pulso.
- **Tiempo agotado:** en la misma rama `timerSeconds === 0`, que ya reproduce `time_expire`, se dispara `expire` (aviso más perceptible).
- **Victoria:** en `src/screens/Game/hooks/usePotAward.ts`, una sola vez por mano (misma guarda `awardedHandRef`), cuando el ganador incluye al jugador humano.

### 4. Ajuste de vibración

En `settingsStore` se añade `hapticsEnabled: boolean` (por defecto `true`) con su setter, persistido automáticamente. En `GameSettings` se añade una sección con un control On/Off. Al ser booleano no encaja en `SettingSlider`; se usa el control segmentado extraído. Un control de dos opciones reutiliza la receta ya existente (idioma) en vez de introducir un patrón nuevo de interruptor.

### 5. Extraer `src/components/SegmentedControl.tsx`

Componente reutilizable que encapsula la receta de “pill” seleccionable hoy repetida en `GameSettings` (velocidad e idioma) y que también usarán el nuevo ajuste de vibración. Props: lista de opciones `{ value, label }`, valor activo, `onChange`, número de columnas y `aria-label`. Renderiza botones con las mismas utilidades nativas, `aria-pressed` y los mismos estilos activo/inactivo.

**Reutilización:** se reutilizan `SettingSlider` (música, efectos, CRT), `Button` y las utilidades/tokens de Tailwind. Se **extrae** `SegmentedControl` para velocidad, idioma y vibración. No se duplica la receta en tres sitios. No se especula con extraer el `Dialog`/`Modal` ni el `Screen` señalados en la auditoría: quedan fuera del alcance de este change (ver Non-Goals implícitos) y no se repiten como parte de este trabajo.

**Justificación de lo que no se extrae:** el bloque de la sección “Apoya el proyecto” en `GameSettings` es único y no se repite, por lo que se deja como está. La cuenta atrás no introduce un nuevo helper: se engancha al hook existente.

### 6. i18n

Se añaden claves `settings.haptics`, `settings.hapticsOn` y `settings.hapticsOff` en `src/i18n/locales/{es,en}/settings.ts`. Las etiquetas de las opciones del control segmentado se pasan ya traducidas desde `GameSettings`, igual que hoy con `LOCALE_LABELS` y el formateo de velocidad.

## Risks / Trade-offs

- **Exceso de vibración por pulsaciones frecuentes** → los taps usan impacto ligero y solo en clics reales de botón (no en inputs de rango ni en hover).
- **Vibración al cargar la partida** (la primera detección de turno puede coincidir con el montaje) → se respeta la bandera de inicialización de `useGameSounds`, como ya se hace con el sonido de reparto inicial.
- **Victoria múltiple o botes divididos** → se dispara una sola vez por mano gracias a la guarda ya existente en `usePotAward`.
- **Soporte dispar entre navegador/web y Android** → el módulo delega en el plugin, que no lanza si no hay soporte; en escritorio el efecto es nulo, lo que satisface la degradación silenciosa.
- **Impacto en el bundle web** → el plugin es pequeño y su parte web no añade peso nativo relevante.

## Migration Plan

1. Añadir `@capacitor/haptics@^8` a `package.json` e instalar.
2. Implementar el módulo, ajuste, componente y wiring.
3. En el siguiente build de Android, `npx cap sync android` incorpora el plugin y su permiso.
4. Rollback: revertir el change; la clave persistida `hapticsEnabled` quedaría sin uso (inocua). No hay migración de datos.

## Open Questions

- Ninguna que cambie specs, enfoque o tareas. El valor por defecto (activado) y el conjunto de eventos quedan fijados en el proposal y las specs.
