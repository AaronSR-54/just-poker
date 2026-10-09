# Tasks

## 1. Reanudar la partida local al recargar

- [x] 1.1 Marcar `continue=1` en la URL al inicializar la partida local (nueva o reanudada, no tutorial) en `src/screens/Game/hooks/useLocalGameInit.ts` con `setSearchParams(..., { replace: true })`; verificar `npx tsc -b` y `npx oxlint src/` sin errores.
- [x] 1.2 Verificar (manual) que recargar a mitad de mano conserva cartas del humano, fichas, `handNumber` y calle, y que «Nueva partida» (con su confirmación) sigue empezando de cero.

## 2. Temporizador: conservar el tiempo restante en Ajustes

- [x] 2.1 Modificar `src/screens/Game/hooks/useTurnTimer.ts` para capturar los ms restantes al pausar por Ajustes y reanudar desde ese remanente (limpiándolo al cambiar de turno); verificar `npx tsc -b` y `npx oxlint src/`.
- [x] 2.2 Cablear el remanente en `src/screens/Game/Game.tsx` si el hook lo requiere; verificar (manual) que al abrir/cerrar Ajustes en el turno humano la cuenta vuelve con el mismo tiempo restante y que, al agotarse tras reanudar, se resuelve el turno (check o fold).

## 3. Mano guiada: impedir all-in

- [x] 3.1 Acotar el máximo de subida cuando es tutorial en `src/screens/Game/gameView.ts` (a `allIn - 1`, sin bajar de `minRaise`) y aplicar el mismo tope en el `useEffect` de clamp de `src/screens/Game/Game.tsx`; verificar `npx tsc -b`.
- [x] 3.2 Extraer el cálculo del tope a un helper puro y añadir test unitario (vitest) que cubra tutorial y no-tutorial, incluido el caso `allIn - 1 < minRaise`; verificar `npm test` en verde.
- [x] 3.3 Pasar `isTutorial` (o el tope) a `src/screens/Game/components/RaiseControls.tsx` para omitir el atajo de all-in en el tutorial; verificar (manual) que el atajo no aparece y que la subida nunca confirma all-in en la mano guiada.

## 4. Verificación de integración

- [x] 4.1 Ejecutar la batería completa: `npx tsc -b`, `npx oxlint src/`, `npm test`, `npm run build` (verificar todo verde).
- [x] 4.2 Recorrer el smoke manual móvil + desktop de los tres fixes y de los flujos «Nueva partida» y «Continuar».

## Workflow follow-up

- Archivar el cambio cuando se cumplan los requisitos de revisión del proyecto.
- Verificar el resultado archivado.
