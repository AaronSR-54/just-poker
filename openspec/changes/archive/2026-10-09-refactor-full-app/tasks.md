# Tasks

## 1. Baseline y red de seguridad

- [x] 1.1 Registrar el estado verde de partida: `npx tsc -b`, `npx oxlint src/`, `npm test`, `npm run build` (verificar que los 41 tests del motor y el resto pasan).
- [x] 1.2 Definir y anotar el checklist de smoke manual (móvil + desktop): Menu → Local → Game, jugar mano completa, subir/all-in, guardar y reanudar, ajustes, tutorial guiado, fin de partida (verificar que el checklist cubre cada flujo de `Game.tsx`).

## 2. Motor de juego (`src/game/poker.ts`)

- [x] 2.1 Extraer tipos/constantes a `src/game/engine/types.ts` y `constants.ts` (verificar `npx tsc -b`).
- [x] 2.2 Extraer `distributePots` a `src/game/engine/potDistribution.ts` (verificar que `poker.test.ts` cubre side pots y sigue verde).
- [x] 2.3 Extraer serialización a `src/game/engine/serialization.ts` y la clase a `src/game/engine/pokerGame.ts` (verificar `fuzz.test.ts` con round-trip y `npx tsc -b`).
- [x] 2.4 Convertir `src/game/poker.ts` en barril de re-export y confirmar que ningún import externo cambió (verificar `npx tsc -b`, `npx oxlint src/`, `wc -l` de cada archivo de `engine/` < 400).

## 3. IA (`src/ai/personalities.ts`)

- [x] 3.1 Extraer tipos a `src/ai/personalityTypes.ts` y datos a `src/ai/personalityData.ts` (verificar `personalities.test.ts` verde).
- [x] 3.2 Extraer lógica de decisión y `getActionDelay` a `src/ai/decision.ts` manteniendo firmas (verificar `engine.test.ts` y `behavior.test.ts` verdes; `AI_BENCH=1 vitest run src/ai/behavior.test.ts` si aplica).
- [x] 3.3 Dejar `src/ai/personalities.ts` como barril de re-export (verificar `npx tsc -b` y `wc -l` < 400 por archivo).

## 4. Internacionalización (`src/i18n/translations.ts`)

- [x] 4.1 Crear `src/i18n/locales/{es,en}/` y mover cada sección a su archivo por idioma (verificar `npx tsc -b`).
- [x] 4.2 Reensamblar `es`/`en` y el tipo `Dict` en `src/i18n/translations.ts`, manteniendo las mismas claves (verificar que `useI18n`/`t` compilan en `npx tsc -b`).
- [x] 4.3 Verificar cobertura de claves es/en y que `npx tsc -b` no reporta claves faltantes; confirmar `wc -l` < 400 por archivo.

## 5. Pantalla de juego — componentes

- [x] 5.1 Crear `src/screens/Game/components/` y extraer `TimerBar`, `DeltaLine`, `HandLabel`, `ShowdownCards` (verificar `npx tsc -b` y `npx oxlint src/`).
- [x] 5.2 Extraer `RivalSlot` y `CommunityRow` (verificar smoke visual móvil/desktop: asientos, bote, cartas comunitarias).
- [x] 5.3 Extraer `ActionLog` (verificar log en móvil compacto y en desktop).
- [x] 5.4 Extraer `RaiseControls`, `RaisePanel`, `RaiseSheet` (verificar smoke: atajos, slider, subir en móvil y desktop).
- [x] 5.5 Extraer `HumanSeat`, `ActionButtons` y `GameOverOverlay` (verificar smoke: acciones, all-in, overlay de fin de partida).

## 6. Pantalla de juego — hooks

- [x] 6.1 Extraer `useLocalGameInit` (init/reanudar + persistencia) preservando los `useEffect` tal cual (verificar smoke: guardar y reanudar partida).
- [x] 6.2 Extraer `useTurnTimer` y `useAiTurns` sin reordenar dependencias (verificar smoke: temporizador de turno, tic-tac y turnos de IA).
- [x] 6.3 Extraer `usePotAward` y `useTutorialRun` (verificar smoke: animación de reparto del bote y mano guiada/tutorial).

## 7. Pantalla de juego — orquestación y layouts

- [x] 7.1 Extraer `MobileGameLayout` y `DesktopGameLayout` (verificar smoke a 375px, 820px y 1280px de ancho).
- [x] 7.2 Dejar `src/screens/Game/Game.tsx` como orquestador delgado (< 400 líneas) y actualizar el import en `src/App.tsx` si cambia la ruta del archivo (verificar `npx tsc -b`, `npm run build`).

## 8. Aislamiento y consistencia

- [x] 8.1 Etiquetar/agrupar el código aparcado (online, perfil, onboarding) con cabecera `PARKED` y mover lo que no rompa imports (verificar `npx tsc -b` y `npm run build`; no debe quedar código del runtime activo bajo `parked/`).
- [x] 8.2 Pase de exports huérfanos y nombres inconsistentes apoyado en `noUnusedLocals` (verificar `npx tsc -b` sin warnings y `npx oxlint src/` limpio).
- [x] 8.3 Comprobar el umbral: ningún archivo fuente `.ts`/`.tsx` (excluyendo tests y diccionarios) supera ~400 líneas (verificar con `wc -l` sobre `src/`).

## 9. Verificación de integración

- [x] 9.1 Ejecutar la batería completa: `npx tsc -b`, `npx oxlint src/`, `npm test`, `npm run build` (verificar todo verde).
- [x] 9.2 Recorrer el checklist de smoke manual móvil + desktop y confirmar comportamiento idéntico (textos, layout, guardado y reanudar).
- [x] 9.3 Actualizar `ROADMAP.md` solo si cambió la ubicación de módulos activos o aparcados (verificar que las rutas citadas existen).

## Workflow follow-up

- Archivar el cambio cuando se cumplan los requisitos de revisión del proyecto.
- Verificar el resultado archivado.
