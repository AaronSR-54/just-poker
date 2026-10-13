# Design

## Context

El fin de partida ya existe y es compartido por local y online: `GameOverOverlay`
(`src/screens/Game/components/GameOverOverlay.tsx`) renderiza el titular, la tabla de
posiciones y los botones dentro de `Modal`, y se monta desde `GameTail` en ambos
layouts. La pantalla decide cuándo abrirlo con `gameOverModal`, con un retardo
(`GAME_OVER_DELAY`) para dejar ver el showdown.

El motor expone `handNumber` (manos jugadas) pero no mide tiempo. La partida local se
persiste con `saveGame` (`src/game/saveGame.ts`) sobre un `SavedGame` versionado, que ya
se reescribe en cada cambio de estado (`useLocalGameInit`). La online usa una
`OnlineSession` en `sessionStorage` y estado autoritativo del anfitrión. El `gameId`
local es `local-<dificultad>` y **no es único por partida**: distinguir partida nueva de
reanudada depende del parámetro `continue` y de si existe un guardado coincidente.

Existen ya `Modal`, `Button`, `ChipIcon`, `playSfx`/`playHaptic` (háptica `win`/`expire`)
y los tokens de color (`success`, `danger`, `bone`, `ink`). La reducción de movimiento
del sistema se cubre por CSS para transiciones/animaciones, pero **no** para las
animaciones de framer-motion, que mueven transformaciones por JS.

## Goals / Non-Goals

**Goals:**

- Añadir al modal un resumen (duración jugada + manos), resultado con tratamiento
  visual propio, celebración al ganar, contadores animados y sonido/vibración de cierre.
- Medir la duración como tiempo con la pantalla de juego abierta, compartida por local y
  online, y conservarla al aparcar/reanudar.
- Reutilizar los componentes y helpers existentes; extraer solo lo nuevo y compartido.

**Non-Goals:**

- No se toca el motor (`PokerState`, serialización, tests). El protocolo online solo gana
  el instante de inicio de partida que la sala marca y reinicia (ver decisión 6).
- No se persiste la duración en el perfil ni se muestra en el historial (fuera de alcance).
- No se introduce ninguna clase CSS propia ni valores crudos: solo utilidades y tokens.

## Decisions

### 1. La duración local vive fuera del motor, en un almacén propio + hook

`PokerState` se serializa y se difunde en online; añadir tiempo ahí acoplaría motor, tests
y protocolo. Para la partida local se extrae un almacén dedicado `gameDurationStore`
(zustand persistido) con `elapsedByKey: Record<string, number>` (ms) y un `runningSince`
en memoria. Un helper `useGameDuration({ key, isResume, ready })` acumula por segmentos:
al montar/visible fija `runningSince`, y al desmontar/ocultar suma el segmento al total.
Total mostrado = `elapsedByKey[key] + (runningSince ? now - runningSince : 0)`.

- **Alternativas descartadas:** (a) campo en `PokerState` → rompe serialización, tests y
  broadcast; (b) solo dentro de `SavedGame` → no cubre la recarga antes de guardar.
- **Clave:** `local:<gameId>`. Como `gameId` local se reutiliza entre partidas de la misma
  dificultad, el hook recibe `isResume` (expuesto por `useLocalGameInit` a partir de
  `continue` + guardado coincidente): con `isResume=false` reinicia la entrada a 0; con
  `true` conserva el total. El tutorial no acumula.
- **Pausa:** `visibilitychange` + estado de la app de Capacitor detienen el segmento
  (app en segundo plano). Se acumula por marcas de tiempo, no por `setInterval`, para que
  el throttling del navegador no falsee el total.
- **Congelado:** al terminar la partida se captura el total y se muestra estático (los
  contadores animan hasta ese valor).

### 6. La duración online es un reloj compartido de la sala

La duración por cliente no vale en online: host e invitado miden cosas distintas y la
revancha solo reiniciaba al host. En su lugar la **sala del servidor** guarda
`gameStartedAt` (epoch ms), se fija al empezar la partida (`markStarted`) y se reinicia en
`game:restart`; el cliente calcula `now - gameStartedAt`. Así todos ven el mismo tiempo y
la revancha reinicia para todos. Este reloj no se pausa cuando un jugador se ausenta
(es tiempo de partida, no de pantalla), que es el comportamiento acordado.

- **Transporte:** `gameStartedAt` viaja en `publicState` (`room:state`), en
  `room:starting` y en el evento `game:restart` (que pasa a emitirse a toda la sala, no
  solo al resto, para que el host también reciba el nuevo instante). El cliente lo guarda
  en `useOnlineGame` y lo expone a `OnlineGame`.
- **Alternativas descartadas:** (a) resetear localmente al recibir `game:restart` (arregla
  el invitado pero mantiene totales distintos); (b) meter el tiempo en el `PokerState`
  difundido (acopla motor y protocolo).

### 2. El modal recibe la duración; la lógica de resultado se centraliza

`GameOverOverlay` recibe `durationMs` (y usa `state.handNumber` para las manos). La
detección de resultado (`humanWon`) ya existe y se reutiliza. El resumen (duración +
manos) se muestra en dos cajas bajo el ranking, y el tratamiento visual
victoria/derrota son clases condicionales con tokens (`success`/`bone`) más un mensaje
de apoyo. `Game.tsx` obtiene `durationMs` del hook y `OnlineGame.tsx` del reloj compartido
de la sala (decisión 6); ambos lo pasan por `GameTail` → `GameOverOverlay` (nuevas props en
`GameLayoutProps`/`buildGameLayoutProps`). No se duplica markup: ambos modos comparten el
mismo componente.

### 3. Se extraen `ChipBurst` y `AnimatedNumber`

- **`src/components/ChipBurst.tsx`** (nuevo): ráfaga de fichas para la celebración,
  reutilizando `ChipIcon` y `motionT` de `src/animations/motion.ts`. Se extrae porque el
  patrón «fichas que vuelan» ya existe aislado en `PotAward` pero con lógica de reparto
  distinta; la celebración es genérica y reutilizable. Usa `useReducedMotion()` para
  degradar a una aparición estática.
- **`src/components/AnimatedNumber.tsx`** (nuevo): cuenta de un valor a otro con
  framer-motion, reutilizable por la clasificación y el resumen. Igualmente respeta
  `useReducedMotion()` (salta al valor final).
- **`formatDuration(ms)` en `src/utils/`** (nuevo helper): formatea con unidades a
  `0m 40s` (o `1h 05m`), sin depender de `Intl` para mantenerlo predecible y testeable.

Alternativa considerada: animar con CSS/counters propios dentro del modal. Descartada por
duplicar lógica en dos lugares y no respetar la reducción de movimiento de framer-motion.

### 4. Sonido y vibración reutilizan los primitivos existentes

- **Vibración:** `playHaptic('win')` en victoria y `playHaptic('expire')` en derrota
  (patrones `Success`/`Warning` ya definidos), disparados una sola vez al abrir el modal
  mediante un `ref` que recuerda el último resultado mostrado.
- **Sonido:** `playSfx('chips_stack')` en victoria y `playSfx('time_expire')` en derrota,
  reutilizando efectos ya existentes y respetando `sfxVolume`. Así no se añaden binarios
  nuevos. **Alternativa:** jingles dedicados (`victory`/`defeat`) con assets nuevos; se
  pospone para no introducir binarios en este change (ver Open Questions).

### 5. i18n

Todas las cadenas nuevas (resumen, etiquetas de duración/manos, mensaje de apoyo) van por
`t(...)` en `es` y `en`, incluidos `aria-label`/`title`. El total de manos usa
`state.handNumber`; no se traduce el nombre del motor.

## Risks / Trade-offs

- **`gameId` local reutilizado** → el total podría heredarse entre partidas. Mitigación:
  el reinicio se decide por `isResume`, no por la clave, y el tutorial no acumula.
- **Cronometraje en segundo plano** → `setInterval` en tabs ocultas se estrangula.
  Mitigación: acumular por diferencias de `Date.now()` en los límites de visibilidad.
- **Reducción de movimiento no cubierta por CSS** para framer-motion → usar
  `useReducedMotion()` explícitamente en `ChipBurst` y `AnimatedNumber`.
- **Desfase de reloj cliente/servidor en online** → la duración usa `Date.now()` del
  cliente contra un `gameStartedAt` del servidor; el desfase es de decenas de ms y no
  afecta a un marcador de partida.
- **Pérdida del evento `game:restart`** → si un cliente no recibe el nuevo `gameStartedAt`
  mantendría el anterior hasta re-sincronizar; al reconectar, `room:starting` lo refresca.
- **Reusar `time_expire` como sonido de derrota** → color de aviso, no un jingle; se
  acepta como provisional (ver Open Questions).

## Open Questions

- ¿Añadir jingles dedicados de victoria/derrota con assets nuevos más adelante? No cambia
  specs ni tareas; el change funciona con los efectos reutilizados.
- ¿Mostrar también la duración acumulada en perfil/historial en un change futuro?
