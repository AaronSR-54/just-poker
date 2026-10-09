# Tasks

## 1. Última actividad y ventana online

- [x] 1.1 Crear `src/utils/lastPlayed.ts` con `markPlayed(mode)`, `getLastPlayed(mode)` y `clearLastPlayed(mode)` sobre `localStorage` (`just-poker-last-played`, marcas `{ local?, online? }`); verificar con una prueba manual que marcar y leer devuelve el timestamp correcto por modalidad.
- [x] 1.2 Añadir en `src/net/onlineSession.ts` `getActiveOnlineSession()` que devuelve la sesión solo si su última actividad (marcador online) es ≤30 min, y si no la descarta y devuelve `null`; verificar con marcas simuladas dentro y fuera de la ventana.
- [x] 1.3 Marcar actividad al jugar: `markPlayed('local')` junto al autosave en `src/screens/Game/hooks/useLocalGameInit.ts` y `markPlayed('online')` en el arranque de partida (`Lobby`) y en los cambios de estado de `useOnlineGame`; verificar que tras jugar en cada modo el marcador correspondiente se actualiza.

## 2. Textos i18n

- [x] 2.1 Ajustar `src/i18n/locales/es/menu.ts`: retirar `continueHint`/`returnHint` y añadir estado «Partida en curso», contextos local/online y rótulos `Continuar`/`Nueva partida`; verificar que ninguna clave de hover permanece.
- [x] 2.2 Ajustar `src/i18n/locales/es/online.ts`: textos del item «Volver a la partida» y su contexto, y del aviso de sala cerrada; replicar todo en `src/i18n/locales/en/{menu,online}.ts`; verificar con `npx tsc --noEmit` que `en: Dict` cubre las mismas claves.

## 3. `CtaCard`: estados y dos zonas

- [x] 3.1 En `src/components/CtaCard.tsx`, modelar los estados «nueva partida» y «partida en curso»: sin partida = título + descripción + `Nueva partida →`; con partida = eyebrow de estado + contexto + zona superior `Continuar →` y fila inferior full-width `Nueva partida`; verificar ambos estados.
- [x] 3.2 Añadir la variante `destacada` (rellena `bg-bone text-ink`) para la tarjeta recomendada; verificar visualmente que solo una tarjeta se rellena.
- [x] 3.3 Eliminar el uso de `Badge` y de `hint`/`hoverInfo` de `CtaCard`; verificar que no queda ninguna referencia a esos props ni imports sin usar (lo cubre `npx oxlint src/`).
- [x] 3.4 Preservar accesibilidad de cada zona (`role`/`aria-label` desde `t(...)`) y verificar navegación por teclado (Tab/Enter/Espacio) en ambos estados.

## 4. `Menu.tsx`: dos tarjetas dinámicas y jerarquía

- [x] 4.1 Montar cada tarjeta según su estado usando `loadSavedGame()` (local) y `getActiveOnlineSession()` (online), con el contexto correcto; verificar con partida local y con sesión online que aparece el estado y el contexto esperados.
- [x] 4.2 Implementar la prioridad de la tarjeta destacada (sin partidas → local; una → la empezada; dos → la última por `getLastPlayed`); verificar los tres casos y que solo una tarjeta va rellena.
- [x] 4.3 Conectar las acciones: `Continuar` navega a `/game/<gameId>?continue=1` (local) y `/game/online-<roomId>` (online); `Nueva partida` navega a `/local` y `/online`; verificar que no se solapan y que abrir el menú no navega solo.
- [x] 4.4 Verificar la ventana: con marcador online de hace más de 30 min, la tarjeta online aparece como sin partida y la sesión queda descartada.

## 5. Hub online: item de reanudar

- [x] 5.1 En `src/screens/Online.tsx` (modo `main`, móvil y desktop), añadir dentro de la caja el item «Volver a la partida» con contexto cuando `getActiveOnlineSession()` devuelve sesión, con `Volver` primario y `Crear` outline; verificar ambos casos (con y sin sesión).

## 6. Red de seguridad y onboarding

- [x] 6.1 Mejorar en `src/net/useOnlineGame.ts`/pantalla de juego el aviso cuando la sala ya no existe: mensaje claro y acción para volver al menú, con la sesión descartada; verificar entrando a `/game/online-<roomId>` con una sala inexistente.
- [x] 6.2 Actualizar el target del paso `new-game` de `src/components/OnboardingCoach.tsx` a `play-local`; verificar que el tour resalta la tarjeta local y avanza.

## 7. Verificación de reutilización, calidad e integración

- [x] 7.1 Repasar la checklist de AGENTS.md: sin clases CSS propias ni tokens crudos, reutilizar `Button`/`Hero`/`CtaCard` y los helpers de persistencia, sin duplicar la lógica de la ventana ni del contexto; anotar el resultado.
- [x] 7.2 Ejecutar `npx oxlint src/`, `npx tsc --noEmit` y `npm run build`; verificar que los tres terminan sin errores.
- [x] 7.3 Recorrido de integración (móvil y desktop): sin partidas, solo local, solo online, ambas con distintas recencias, y sesión online dentro/fuera de la ventana; comprobar jerarquía, acciones, contextos sin hover y ausencia de auto-navegación.

## Workflow follow-up

- Archivar el change cuando el proyecto cumpla sus requisitos de revisión.
- Verificar el resultado archivado.
