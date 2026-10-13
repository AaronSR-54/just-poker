# Tasks

## 1. Cómputo de duración (sin UI)

- [x] 1.1 Crear el almacén persistido `gameDurationStore` (total en ms por clave) y el hook `useGameDuration({ key, isResume, active })` que acumula por marcas de tiempo en los límites de visibilidad; verificar con tests unitarios que acumula con la pantalla abierta, pausa al ocultar/desmontar, reinicia con `isResume=false` y conserva con `isResume=true`
- [x] 1.2 Añadir el helper `formatDuration(ms)` en `src/utils/` y verificar con tests unitarios los casos `< 1 h` (`m:ss`), `>= 1 h` (`h:mm`) y `0`
- [x] 1.3 Conectar la pausa por app en segundo plano (`visibilitychange` y estado de la app de Capacitor) y verificar que el total no crece mientras la pantalla está oculta

## 2. Integración de la duración en local y online

- [x] 2.1 Exponer `isResume` desde `useLocalGameInit` (según `continue` + guardado coincidente) y consumir `useGameDuration` en `LocalGame`; verificar que una partida nueva arranca a 0 y una reanudada conserva el total
- [x] 2.2 Consumir `useGameDuration` en `OnlineGame` con clave de sala y reiniciar la entrada en la revancha; verificar que la revancha vuelve a 0 y que salir al menú pausa el cómputo
- [x] 2.3 Excluir el tutorial guiado del cómputo de duración y verificar que `gameId === 'guide'` no acumula

## 3. Componentes compartidos extraídos

- [x] 3.1 Extraer `src/components/AnimatedNumber.tsx` (cuenta hasta el valor con `motionT`) y verificar que muestra el valor final de inmediato con `useReducedMotion()`
- [x] 3.2 Extraer `src/components/ChipBurst.tsx` reutilizando `ChipIcon` y `motionT`, con degradación estática bajo `useReducedMotion()`, y verificar que se puede montar de forma aislada

## 4. i18n

- [x] 4.1 Añadir en `es` y `en` las claves del resumen (duración y manos) y del mensaje de apoyo por resultado, incluyendo `aria-label`/`title`, y verificar con `npx tsc --noEmit` que el tipo `Dict` las exige en ambos idiomas

## 5. Modal de fin de partida

- [x] 5.1 Propagar `durationMs` desde `Game.tsx`/`OnlineGame.tsx` por `GameTail`, `GameLayoutProps` y `buildGameLayoutProps` hasta `GameOverOverlay`; verificar que el modal recibe la duración en local y online
- [x] 5.2 Añadir el resumen (duración formateada + manos desde `state.handNumber`) y verificar con partida local y online que ambos valores aparecen
- [x] 5.3 Dar tratamiento visual distinto a victoria y derrota con tokens (`success`/`bone`) y mensaje de apoyo; verificar ambos resultados
- [x] 5.4 Reproducir `ChipBurst` solo en victoria y verificar que no se muestra al perder ni se anima con reducción de movimiento activa
- [x] 5.5 Usar `AnimatedNumber` en la clasificación y el resumen y verificar el conteo al abrir y el salto directo con reducción de movimiento
- [x] 5.6 Disparar sonido (`chips_stack`/`time_expire`) y háptica (`win`/`expire`) una sola vez al abrir el modal y verificar que no se repiten mientras sigue abierto y que respetan `sfxVolume` y `hapticsEnabled`

## 6. Verificación de integración y calidad

- [x] 6.1 Verificar de extremo a extremo en local: partida hasta el fin, aparcar en el menú y reanudar (el tiempo no cuenta lo aparcado), y comprobar resumen, celebración, contadores, sonido y vibración
- [x] 6.2 Verificar de extremo a extremo en online (host e invitado): fin de partida con resumen y feedback, y reinicio de duración en la revancha
- [x] 6.3 Revisar la checklist de reutilización de `AGENTS.md`: componentes de `src/components/` y helpers de `src/utils/` reutilizados, sin clases CSS propias ni valores crudos, sin duplicación de markup/lógica y todo el texto por `t(...)`
- [x] 6.4 Ejecutar `npx oxlint src/`, `npx tsc --noEmit` y `npm run build` y verificar que terminan sin errores

## 7. Duración compartida online desde la sala (servidor)

- [x] 7.1 Añadir `gameStartedAt` a la sala del servidor: fijarlo en `markStarted`, reiniciarlo en `game:restart`, incluirlo en `publicState` y en `room:starting`, y emitir `game:restart` a toda la sala con el nuevo instante; verificar con `server/socket/handlers.test.ts` y `server/game/GameManager.test.ts`
- [x] 7.2 Capturar `gameStartedAt` en los listeners de sala (`room:state`, `room:starting`, `game:restart`) y exponerlo desde `useOnlineGame`; verificar con `src/net/onlineRoom.test.ts`
- [x] 7.3 En `OnlineGame`, calcular la duración desde el `gameStartedAt` compartido (congelada al terminar) y retirar el uso del almacén por cliente; verificar que host e invitado ven el mismo tiempo y que la revancha vuelve a cero para ambos
- [x] 7.4 Verificar de extremo a extremo en online (host e invitado) el fin de partida con resumen y el reinicio de duración en la revancha

## Workflow follow-up

- Archivar el change tras satisfacer los requisitos de revisión del proyecto.
- Verificar el resultado archivado.
