# Design

## Context

Ver `proposal.md` para la motivación. El estado actual relevante:

- Existen **dos relojes** para el turno propio: un contador en JS (`useTurnCountdown`, que gobierna sonidos, vibración, expiración y pausa) y una animación CSS (`TimerBar` vía `animate-timer-drain`) que es lo único que el jugador ve. Nada los sincroniza.
- `TimerBar` lleva `gameSpeed` en su `key` (`MobileGameLayout.tsx:125`, `DesktopGameLayout.tsx:135`), así que cambiar la velocidad lo remonta y reinicia la animación desde cero.
- `useTurnCountdown` mete `turnDurationMs` en las dependencias de `startTimer` y del efecto de pausa/reanudación, y al reanudar conserva milisegundos absolutos sin reescalarlos.
- `useAiTurns` re-ejecuta su efecto al cambiar `speed`/`turnDurationMs`, volviendo a decidir y a observar la mano sobre el mismo estado emocional. `getAIAction` (en `ai/aiPlayer.ts`) crea un `setTimeout` no cancelable.
- `useCommitState` y el temporizador de game over calculan su espera una vez y no la reescalan si cambia la velocidad.
- Hay duplicación estructural: motor de coach doble (`OnboardingCoach`/`TutorialCoach`), bloques de layout móvil/escritorio repetidos, constructores de props paralelos (`Game.tsx`/`OnlineGame.tsx`), overlays que reinventan `Modal`, y helpers con varias definiciones (`clamp01` ×4, `rankValue` ×2, derivación de asientos/ciegas ×3, iniciales, nombres por defecto).

Restricciones del proyecto (`AGENTS.md` y `openspec/config.yaml`): layout siempre con utilidades nativas de Tailwind en JSX; tokens en lugar de valores crudos; reutilizar componentes de `src/components/` y helpers de `src/utils/`; extraer en lugar de copiar; i18n obligatorio en todo texto visible.

## Goals / Non-Goals

**Goals:**

- Un único origen de verdad para el tiempo del turno propio: el mismo valor de milisegundos restantes alimenta la barra visible, los avisos y la resolución del turno.
- Cambiar la velocidad en cualquier momento conserva el tiempo restante de forma coherente y no reinicia cuenta atrás, pausas ni decisiones del rival.
- La barra del rival se pausa con Ajustes.
- Reducir duplicación y primitivas reinventadas siguiendo las reglas de reutilización del proyecto, sin cambiar el comportamiento visible más allá de los bugs corregidos.

**Non-Goals:**

- No se toca el comportamiento del modo online (velocidad fija); solo comparte el núcleo de cuenta atrás refactorizado.
- No se rediseña la UI ni se introducen dependencias nuevas.
- `Profile.tsx` sigue aparcado (marcado `// PARKED` y sin ruta): no se reencamina ni se elimina en este cambio.

## Decisions

### D1. `useTurnCountdown` devuelve tiempo restante en ms y desacopla la duración

- Sustituir el estado `initialSeconds`/`timerSeconds` como salida principal por `remainingMs` (se conserva `timerSeconds` solo para los avisos si hace falta).
- Guardar `turnDurationMs` en un ref (`turnDurationRef`) y **quitarlo** de las dependencias de `startTimer`, de modo que el efecto de pausa/reanudación dependa solo de `active`, `turnKey` y `settingsOpen`.
- Reescalado al cambiar la duración: un efecto observa `turnDurationMs`; si el turno está activo y no pausado, recalcula `remaining = remaining * (newDuration / oldDuration)` y reanuda el intervalo, preservando la fracción consumida.
- Registrar el `turnKey` con el que arrancó el temporizador (`startedTurnKey`) y solo reanudar si coincide, evitando capturar un `remainingMs` obsoleto (caso límite de Ajustes abierto antes de que arranque el turno).
- Reiniciar `lastTimerCue` cuando cambia `turnKey`/`active` o al pausar.

**Alternativas consideradas:** (a) mantener la duración escalada dentro del propio `startTimer` y reescalar a mano en cada sitio; descartada por dispersar la lógica. (b) Reescalar solo al reanudar desde Ajustes; descartada porque el bug también aparece si la velocidad cambia sin abrir/cerrar Ajustes.

### D2. `TimerBar` pasa a ser una primitiva dirigida por estado

- Props: `remainingMs`, `durationMs`, `paused?`, `className?`. Renderiza el ancho con `style={{ width: (remainingMs / durationMs) * 100 + '%' }}` (valor dinámico → `style`, permitido por `AGENTS.md`).
- La pausa la produce el propio núcleo al congelar `remainingMs`; `paused` solo lo usa el rival. Se elimina `gameSpeed` del `key` (el remount por turno se hará con una clave de turno, no de velocidad).
- Se deja de usar `animate-timer-drain` para el turno (la animación queda solo si algún uso lo requiere); la barra se actualiza a la cadencia del núcleo (100 ms), suficiente y sin desincronización por construcción.

**Alternativas consideradas:** conservar la animación CSS y ajustar `animation-delay`/`animation-play-state`/`animationDuration` al cambiar la velocidad. Descartada: frágil (el remount y el reescalado de la fracción con duración variable son propensos a errores) y mantiene dos relojes.

### D3. La barra del rival usa la misma primitiva

- `useAiTurns` expone, además de `playerIndex`, el `remainingMs` del turno del rival (contador propio a 100 ms que se congela con `settingsOpen`), y `RivalSlot` recibe `timerRemainingMs`/`paused` y reutiliza `TimerBar`.
- Alternativa considerada: añadir un `paused` a la `TimerBar` animada por CSS y dejar el resto igual. Descartada por no unificar la primitiva y mantener lógica de animación aparte.

### D4. Las pausas de resolución se reescalan, no se reinician

- `useCommitState`: guardar el instante objetivo (`endsAt`) en lugar de solo el id del timeout; suscribirse a `gameSpeed` y recalcular el tiempo restante restante al cambiar, reprogramando el timeout.
- Game over (`Game.tsx`): mismo patrón con `endsAt`; el cambio de velocidad ajusta la espera en curso en vez de reiniciarla.
- Alternativa considerada: leer `gameSpeed` de forma no reactiva dentro del timeout (parcial, ya presente). Descartada porque solo funciona si el timeout aún no se ha disparado y no ajusta esperas largas.

### D5. El turno del rival no se re-decide al cambiar la velocidad

- `useAiTurns` lee `speed`/`turnDurationMs` desde refs y los quita de las dependencias del efecto (que pasa a depender solo de `gameState`/jugador actual y `settingsOpen`).
- `getAIAction` (`src/ai/aiPlayer.ts`) acepta una señal de cancelación (o devuelve un handle cancelable) para abortar su `setTimeout`, y se evita volver a llamar a `observeHand` sobre la misma mano ya observada.

### D6. Reutilización y extracción

Se reutilizan sin cambios: `Modal`, `ScreenTitle`, `Button`, `SegmentedControl`, `SelectableCard`, `ChipIcon`, `Avatar`, `Badge`, `PokerCard`, `TimerBar`, `RivalSlot`, `HumanSeat`.

Se extraen:

- `src/components/`: `CoachPanel` + `Spotlight` + hook `useCoachPositioning` (compartido por `OnboardingCoach`/`TutorialCoach`); `Screen` (contenedor de pantalla común).
- `src/screens/Game/components/`: `ChipStackRow` (fila de fichas+ALL-IN+delta de `HumanSeat`/`RivalSlot`).
- `src/screens/Game/layout/`: `buildGameLayoutProps` (props comunes de `Game.tsx`/`OnlineGame.tsx`); subcomponentes para la lista de rivales y el bloque final compartidos por layouts.
- `src/utils/` / `src/game/`: `clamp`/`clamp01`, `rankValue`, derivación de asientos/ciegas (`nextAlive`/blinds), `initials`, `DEFAULT_NAMES`.

Decisiones de reutilización/limpieza:

- Renombrar el export `t` de `src/animations/motion.ts` a `motionT` para eliminar la colisión con el `t` de i18n y los alias en cada import.
- Enrutar `GameSettings`, `GameOverOverlay` y la hoja de subida por `Modal`, y reforzar `Modal` (focus trap, restauración de foco, bloqueo de scroll, `aria-labelledby`/`role`).
- Sustituir el `Title` local de `HandsGuide` por `ScreenTitle`; usar `SegmentedControl` en las píldoras que hoy se pintan a mano (lista de manos de `HandsGuide` y atajos de subida de `RaiseControls`). Se amplía `SegmentedControl` con `columns={1}`, `fill` (filas repartidas, sin scroll), `variant` (`solid`/`subtle`, para conservar el resaltado sutil de los atajos) y `size` (`sm`/`md`).
- i18n: `PokerCard` (alt de carta), `HumanSeat` (decidir "You" sin comparar con la cadena `'Tú'`: usar el índice de jugador o una marca de identidad, no el nombre), marca en `GameSettings`.
- Tokens: sustituir `rgba(...)`, `bg-black` y `text-[…]` por `bone`/`ink-950`/`text-fs-*`.
- Corregir el ternario redundante de `Avatar`.
- Eliminar código muerto tras verificar que no tiene importadores: `Logo`, `RankBadge` (además usa la clase inexistente `rank-roman`), `JFigure`/`KFigure`/`QFigure`, y exports sin uso (`SPEED_LABELS`, `isRed`, `slideInLeft`/`slideInRight`/`scaleIn`/`swap`, tipos sin uso).

**Se repite y no se extrae (justificación):**

- El par `TopBar`/`Animated` se mantiene aunque hoy solo lo use `Profile` aparcado: está fuera de alcance y eliminarlo rompería ese trabajo en curso si vuelve a ruta.
- Las variantes de `TimerBar` entre turno propio y rival no se duplican: ambas usan la misma primitiva (D2/D3); la única diferencia es que el rival pasa `paused`.

## Risks / Trade-offs

- **Barra a 100 ms puede verse escalonada** → usar una transición lineal corta en el ancho o aceptar el refresco; verificar en móvil y escritorio.
- **Refactor del coach puede desalinear el panel/spotlight** → mantener la lógica de medición (rAF + `ResizeObserver`) idéntica al moverla; verificar onboarding, tutorial y pasos con anclas (`data-tour`).
- **Extraer props de layout puede cambiar un flag** → comparar key por key entre `Game.tsx`/`OnlineGame.tsx` antes de unificar; verificar ambas disposiciones y el modo online.
- **Abortar `getAIAction` puede dejar una promesa colgada** → la señal de cancelación debe resolver/rechazar de forma segura y `applyAction` ya ignora acciones tras `settled`.
- **Borrado de código muerto puede eliminar algo usado dinámicamente** → comprobar importadores antes de borrar; si hay duda, dejar el archivo.

## Migration Plan

Sin migración de datos ni cambios de infraestructura. Es una SPA; el despliegue es el build de Vite. Rollback: revertir el commit.

## Open Questions

- Ninguna que bloquee la implementación. El formato exacto de la señal de cancelación de `getAIAction` (callback, `AbortSignal` o handle) se decidirá al implementar sin afectar a los specs ni al desglose de tareas.
