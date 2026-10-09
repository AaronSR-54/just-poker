# Tasks

## 1. Acción de salida en la partida local

- [x] 1.1 En `src/screens/Game/Game.tsx`, sustituir `leaveGame`/`confirmLeaveGame` por una acción que navegue a `/` sin llamar a `clearSavedGame()`; verificar con `npx tsc --noEmit` que no quedan referencias a `leaveConfirmOpen` ni al borrado del guardado
- [x] 1.2 En `src/screens/Game/components/GameOverlays.tsx`, retirar `ConfirmDialog` y las props `leaveConfirmOpen`/`onConfirmLeave`/`onCancelLeave`; verificar con `npx tsc --noEmit` que los tipos cuadran

## 2. Etiqueta del botón y textos

- [x] 2.1 Cambiar `settings.leave` a «Volver al menú» en `src/i18n/locales/es/settings.ts` y a «Back to menu» en `src/i18n/locales/en/settings.ts`; verificar con `npx tsc --noEmit`
- [x] 2.2 Eliminar las claves `game.leaveTitle/leaveMessage/leaveConfirm/leaveCancel` sin uso en `es` y `en`; verificar con `npx tsc --noEmit` que el tipo `Dict` sigue completo

## 3. Verificación

- [x] 3.1 Ejecutar `npx oxlint src/` y `npx tsc --noEmit` y confirmar que pasan sin errores
- [x] 3.2 Probar manualmente con `npm run dev`: abrir los ajustes en una partida local, pulsar «Volver al menú», comprobar que no hay diálogo, que el menú muestra «Continuar partida» y que al reanudar se restaura la misma mano y fichas
- [x] 3.3 Confirmar que iniciar una partida nueva sigue descartando el guardado anterior y que salir desde el tutorial no modifica la partida local guardada
