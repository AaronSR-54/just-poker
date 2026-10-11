# Proposal

## Why

Cambiar la velocidad de juego en mitad de un turno propio desincroniza la cuenta atrás: la barra visible se reinicia y deja de coincidir con el tiempo que realmente resuelve el turno. Detrás hay fallos de temporización relacionados (pausa/reanudación, barra del rival, decisión del rival, pausas de calle y game over) y una deuda técnica de duplicación y primitivas reinventadas que hace más fácil que aparezcan bugs de este tipo. Esta propuesta corrige esos fallos y, a la vez, reduce esa deuda para que el código sea más predecible y revisable.

## What Changes

### Corrección de bugs de temporización

- **La velocidad ya no desincroniza el turno propio**: cambiar la velocidad a mitad de turno conserva el tiempo restante de forma coherente (reescalado a la nueva duración) y la barra visible refleja el tiempo real que resuelve el turno.
- **Una sola fuente de verdad para el reloj**: el contador y la barra visible se derivan del mismo tiempo restante; el cambio de velocidad deja de remontar/reiniciar la animación.
- **La barra del rival se pausa con Ajustes**, igual que la del humano.
- **Cambiar la velocidad no reinicia** las pausas de resolución pendientes (calle y game over) ni extiende/duplica la decisión del rival.
- **Casos límite**: reanudar tras una pausa respeta la duración efectiva (sin reiniciar a la duración completa), el aviso de últimos segundos se reinicia por turno, el primer valor del contador parte de la duración efectiva y no se captura un tiempo restante obsoleto.

### Refactor y reducción de duplicación

- Extraer el motor de coach compartido por onboarding y tutorial (medición de anclaje, panel y spotlight) y sustituir ambas copias.
- Deduplicar el markup de la lista de rivales y el bloque final entre los layouts de móvil y escritorio, y unificar la construcción de props de juego entre partida local y online.
- Extraer el contenedor de pantalla común y reutilizar `ScreenTitle` donde hoy se reinventa.
- Enrutar los overlays que hoy se pintan a mano (`GameSettings`, `GameOverOverlay`, hoja de subida) por el `Modal` compartido, y corregir la accesibilidad del propio `Modal`.
- Extraer la fila de fichas (humano/rival) y los selectores tipo píldora.
- Unificar helpers duplicados (`clamp01`, `rankValue`, derivación de asientos/ciegas, iniciales, nombres por defecto) en módulos compartidos.
- Renombrar la colisión de nombre `t` entre i18n y motion (`motionT`).

### i18n, tokens y limpieza

- Sustituir valores crudos (`rgba(...)`, `bg-black`, `text-[…]`) por tokens (`bone`, `ink-950`, `text-fs-*`).
- Pasar a `t(...)` los textos visibles hardcodeados (alt de carta, "You"/`'Tú'`, marca en Ajustes) y eliminar el acoplamiento a la cadena `'Tú'`.
- Corregir el ternario redundante de `Avatar`.
- Eliminar código muerto y exports sin uso.

Impacto en reutilización: se reutilizan `Modal`, `ScreenTitle`, `Button`, `SegmentedControl`, `SelectableCard`, `ChipIcon`, `Avatar`, `Badge`, `PokerCard`, `TimerBar`, `RivalSlot` y `HumanSeat`. Se extraen a `src/components/` `CoachPanel`/`Spotlight` (+ hook `useCoachPositioning`), `Screen`, `ChipStackRow` y `buildGameLayoutProps`; y a `src/utils/` los helpers compartidos (`clamp`/`clamp01`, `rankValue`, `seats`/ciegas, `initials`, nombres por defecto, formateo de fechas).

## Capabilities

### New Capabilities

- `game-speed`: comportamiento observable de la velocidad de juego: duración efectiva de las pausas, reescalado coherente de temporizadores y pausas al cambiar de velocidad, y coherencia entre el reloj visible y la resolución del turno.

### Modified Capabilities

- `turn-timer`: la pausa/reanudación del turno propio se mantiene correcta ante cambios de velocidad y la barra del rival se pausa mientras Ajustes está abierto.

## Impact

- Código afectado: `src/screens/Game/hooks/` (`useTurnCountdown`, `useTurnTimer`, `useAiTurns`, `useCommitState`), `src/screens/Game/Game.tsx`, `OnlineGame.tsx`, `layout/*`, `components/*` (TimerBar, RivalSlot, HumanSeat, GameSettings, Onboarding/TutorialCoach, Modal, etc.), `src/store/settingsStore.ts`, `src/i18n`, `src/utils`, `src/animations/motion.ts`.
- Sin cambios de API ni dependencias externas. Sin cambios en el comportamiento online (velocidad fija) más allá de compartir el mismo núcleo de cuenta atrás.
- Riesgo principal: el refactor del coach y de los layouts; se mitiga con verificación manual de onboarding, tutorial y ambas disposiciones (móvil/escritorio).
