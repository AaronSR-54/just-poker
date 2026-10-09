# Design

## Context

Ver `proposal.md` — Why. El refactor es **puro**: el comportamiento observable (textos, reglas del motor, layout, formato de guardado, latidos y sonidos) no debe cambiar. Las restricciones de estilo del proyecto (`AGENTS.md`) siguen vigentes: solo utilidades Tailwind nativas en JSX, tokens del `@theme`, textos vía `t(...)`, componentes reutilizables en `src/components/`.

Estado actual relevante:

- `src/screens/Game.tsx` (1660 líneas): contiene ~12 componentes (`TimerBar`, `DeltaLine`, `RivalSlot`, `ShowdownCards`, `HandLabel`, `CommunityRow`, `ActionLog`, `RaiseControls`, `RaisePanel`, `RaiseSheet`, `GameOverOverlay`) y toda la orquestación (`LocalGame`) con ~15 `useState`/`useEffect` (init/persistencia, temporizador, turnos de IA, reparto del bote, fin de partida, tutorial, ajustes).
- `src/game/poker.ts` (694): clase `PokerGame` con lógica de mano + `distributePots` + tipos + constantes.
- `src/i18n/translations.ts` (613): dos objetos `es`/`en` anidados por sección; `es` define el tipo `Dict`.
- `src/ai/personalities.ts` (589): lógica de decisión (funciones `decideAction`, helpers, `getActionDelay`) mezclada con datos de 9 perfiles y el mapa `PERSONALITIES`.
- Online/perfil/onboarding aparcados (`src/net/`, `server/`, `parked/`, `src/screens/Online.tsx`, `Lobby.tsx`, `Profile.tsx`, `OnboardingCoach`, `userStore`) que el ROADMAP conserva para la Fase 3.

Red de seguridad: `src/game/poker.test.ts` + `fuzz.test.ts` (41 tests), `hands.consistency.test.ts`, `tutorial.test.ts`, tests de IA; `tsconfig.app.json` con `noUnusedLocals`/`noUnusedParameters`/`verbatimModuleSyntax`; `oxlint`.

## Goals / Non-Goals

**Goals:**

- Ningún archivo fuente (`.ts`/`.tsx`, excluyendo tests y assets) supera **~400 líneas** tras el refactor.
- Misma API pública de los módulos compartidos: no romper imports del resto de la app.
- Mismo comportamiento observable y mismos textos i18n; tests, type-check, lint y build verdes en cada paso.
- Separar datos de lógica (perfiles de IA, traducciones) y presentación de orquestación (pantalla de juego).
- Dejar el código aparcado claramente identificado y agrupado, sin eliminarlo.

**Non-Goals:**

- No se añaden features, ni se cambia balance/reglas/UX.
- No se borra el código online/perfil/onboarding (conservado por ROADMAP).
- No se toca `AGENTS.md`, los tokens de `@theme`, ni se introducen clases CSS propias.
- No se cambia el formato de guardado (`VERSION = 1`).

## Decisions

### 1. Descomposición incremental de la pantalla de juego

Crear `src/screens/Game/`:

- `Game.tsx` — orquestador delgado (`LocalGame` + router `Game`): junta hooks + layout.
- `components/` — `RivalSlot.tsx`, `ShowdownCards.tsx`, `HandLabel.tsx`, `CommunityRow.tsx`, `ActionLog.tsx`, `RaiseControls.tsx` (+ `RaisePanel`/`RaiseSheet`), `GameOverOverlay.tsx`, `TimerBar.tsx`, `DeltaLine.tsx`, `HumanSeat.tsx`, `ActionButtons.tsx`.
- `hooks/` — `useLocalGameInit.ts` (init/resume + persistencia), `useTurnTimer.ts`, `useAiTurns.ts`, `usePotAward.ts`, `useTutorialRun.ts`.
- `layout/` — `MobileGameLayout.tsx`, `DesktopGameLayout.tsx` (los dos bloques de render actuales).

Mover **verbatim** (mismos props, mismas clases, mismos efectos) para no alterar comportamiento. **Alternativa considerada:** reescribir la pantalla desde cero con un modelo de estado distinto → rechazada por riesgo de regresión en una app sin cobertura de UI.

### 2. `poker.ts` como barril de compatibilidad

Mover la implementación a `src/game/engine/` (`pokerGame.ts`, `potDistribution.ts`, `serialization.ts`, `types.ts`, `constants.ts`) y dejar `src/game/poker.ts` re-exportando (`export * from './engine/...'`) para que ningún import existente cambie. **Alternativa:** actualizar todos los imports a las rutas nuevas → rechazada por ruido y riesgo innecesarios; el barril mantiene el contrato público. Se conservan tal cual los métodos privados y el orden de `distributePots`.

### 3. Traducciones por sección co-localizadas es/en

Dividir `src/i18n/translations.ts` en `src/i18n/locales/{es,en}/<seccion>.ts` (`common`, `difficulty`, `phase`, `handName`, `handDesc`, `menu`, `local`, `handsGuide`, `game`, `settings`, `onboarding`, `tutorial`) y un `src/i18n/translations.ts` que ensambla `es` y `en` y exporta el mismo tipo `Dict` (definido desde `es`, como hoy). Cada par es/en de una sección vive junto. **Alternativa:** un único archivo por idioma → seguiría siendo >400 líneas.

### 4. Separar datos y lógica de IA

`src/ai/personalities.ts` pasa a re-exportar: `src/ai/personalityTypes.ts` (tipos), `src/ai/personalityData.ts` (los 9 perfiles + `PERSONALITIES`), `src/ai/decision.ts` (helpers + `decideAction` + `getActionDelay`). Se preservan firmas y el comportamiento exacto que cubren `engine.test.ts`/`behavior.test.ts`/`personalities.test.ts`.

### 5. Aislamiento (no borrado) del código aparcado

Agrupar y documentar el código no activo con una cabecera `// PARKED (Fase 3 — ver ROADMAP.md)` y, cuando no rompa imports, concentrarlo en `src/parked/` o en subcarpetas claramente nombradas. `userStore.ts` y todo lo que importa el runtime activo se mantienen en su sitio. **Alternativa:** eliminar el código aparcado → rechazada: el ROADMAP lo conserva explícitamente.

### 6. Umbral y verificación

Umbral **400 líneas** por archivo fuente (los diccionarios de traducción y tests quedan fuera del recuento). No se añade herramienta nueva de medición (evitar dependencias); la comprobación es manual al cerrar la tarea, apoyada en `wc -l`. Se ejecuta la batería completa tras cada extracción.

## Risks / Trade-offs

- **Extracción de hooks altera `useEffect`/deps y provoca regresiones sutiles** → mover el código tal cual (sin reordenar deps), mantener `eslint-disable-next-line react-hooks/exhaustive-deps` existentes, y smoke manual del flujo completo (móvil + desktop) en cada paso.
- **Imports circulares tras dividir módulos** → fijar dirección de dependencias: `types` → `engine`/`data` → `hooks` → `components` → `layout`; los barriles solo re-exportan.
- **Deriva de claves i18n entre es/en** → el tipo `Dict` obliga a cubrir las mismas claves; `es` sigue siendo la fuente del tipo. Verificación con `tsc`.
- **Barriles que ocultan código muerto** → pase final de exports huérfanos con `tsc` (`noUnusedLocals`) y búsqueda de referencias antes de tocar.
- **Diff grande difícil de revisar** → commits pequeños por módulo, cada uno compilando y con tests verdes; rollback por `git revert` del commit concreto.
- **Trade-off del barril `poker.ts`** → mantiene compatibilidad pero añade una indirección; aceptable y reversible.
