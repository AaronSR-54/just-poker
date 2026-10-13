# Tasks

## 1. Arreglo del intervalo del turno del rival

- [x] 1.1 En `src/screens/Game/hooks/useAiTurns.ts`, hacer que `runBar` recree el intervalo cuando cambia la clave del turno (`handNumber-phase-current`): limpiar el intervalo vigente, fijar la nueva clave, reiniciar duración/tiempo restante y arrancar un intervalo nuevo que capture el `playerIndex` actual. Verificación: el objeto `aiTurn` publicado pasa a apuntar al rival activo en cuanto cambia el turno, sin esperar a que termine el intervalo anterior.
- [x] 1.2 Mantener la reanudación con la misma clave (Ajustes abierto y cerrado) sin reiniciar el tiempo: cuando la clave no cambia y el intervalo sigue vivo, `runBar` no hace nada; si se limpió al pausar, reanuda desde el tiempo restante. Verificación: abrir y cerrar Ajustes en el turno de un rival conserva el tiempo restante.

## 2. Verificación del comportamiento observable

- [x] 2.1 Partida local con dos o más rivales actuando en turnos consecutivos: la barra es visible para cada rival mientras es su turno (escenario «Rivales consecutivos»). Verificar en pantalla jugando una mano con racha de rivales.
- [x] 2.2 Transición rival→rival y rival→humano: la cuenta atrás visible corresponde al nuevo rival activo y desaparece al terminar la racha o cerrarse la mano (escenarios «La barra sigue al rival activo» y «Fin de la racha de rivales»). Verificar en pantalla.
- [x] 2.3 Partida online (`npm run dev:all`): confirmar que la barra del rival se sigue mostrando sin regresiones. Verificar manualmente con dos clientes conectados a una sala.

## 3. Calidad y reutilización

- [x] 3.1 Ejecutar `npx oxlint src/` y confirmar que no hay avisos.
- [x] 3.2 Ejecutar `npx tsc --noEmit` y confirmar que compila sin errores.
- [x] 3.3 Ejecutar `npm run build` y confirmar que el build termina correctamente.
- [x] 3.4 Verificar reutilización y ausencia de duplicación con la checklist de `AGENTS.md`: confirmar que se reutilizan `TimerBar` y `RivalSlot` sin cambios, que no se introduce ningún componente ni helper nuevo y que no hay clases CSS propias ni valores crudos.

## Workflow follow-up

- Archivar el cambio cuando la revisión del proyecto esté satisfecha.
- Sincronizar el delta de `turn-timer` con el spec principal al archivar.
