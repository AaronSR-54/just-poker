# Tasks

## 1. Salida del lobby con confirmación

- [x] 1.1 Quitar el deshabilitado de las tarjetas de modo durante la sala en `src/screens/Online.tsx` (hoy `disabled={Boolean(room)}`), manteniendo marcada la del modo en uso; verificar que ambas siguen pulsables con la activa marcada.
- [x] 1.2 Retirar la acción «Abandonar sala» del panel de sala y verificar que ya no aparece en el lobby.
- [x] 1.3 Implementar un destino de salida pendiente y la confirmación al pulsar la otra tarjeta de modo: al confirmar abandona la sala y cambia de modo; al cancelar permanece intacto. Verificar ambos casos.
- [x] 1.4 Enrutar la acción de volver (`PageHeader`/`goMenu`) por la misma confirmación cuando hay sala (al confirmar sale al menú) y mantener la navegación actual sin sala; verificar ambos casos.
- [x] 1.5 Añadir las claves i18n del diálogo de salida (título, mensaje, confirmar) en `src/i18n/locales/{es,en}/online.ts` y verificar que `en: Dict` cubre las claves.

## 2. Código de la sala en la dirección

- [x] 2.1 Escribir el código en la dirección con `useSearchParams` al entrar en la sala (`?code=<code>`, `replace: true`) y retirarlo al abandonarla; verificar que la dirección cambia y que no se apilan entradas de historial.
- [x] 2.2 Resolver el arranque en `src/screens/Online.tsx`: sesión activa → reincorporar a esa sala y reflejar su código; `?code=` sin sesión → rellenar el código y abrir el flujo de unirse (reincorporación automática si ya hay nombre guardado); verificar recargando la página.
- [x] 2.3 Verificar que abrir la dirección de una sala inexistente muestra el aviso de que la partida ya no existe y no incorpora a ninguna sala.

## 3. Estado de conexión del lobby

- [x] 3.1 Registrar los eventos `connect`/`disconnect` del socket mientras hay sala y exponer un indicador de conexión en `src/screens/Online.tsx`.
- [x] 3.2 Mostrar el aviso al perder la conexión y, al recuperarla, reemitir `room:join` y ocultarlo sin duplicar la plaza.
- [x] 3.3 Añadir las claves i18n de conexión (perdida/recuperada) en `src/i18n/locales/{es,en}/online.ts`.

## 4. Rediseño base del panel de sala y feedback de copia

- [x] 4.1 Reorganizar el panel de sala con jerarquía propia reutilizando `Panel`/`PersonCard`/`Badge`/`Avatar`; verificar escritorio y móvil comparando con `Local`.
- [x] 4.2 Separar el feedback de copia (`copied: 'code' | 'link' | null`) para que el código y el enlace confirmen cada uno su propia acción.
- [x] 4.3 Ajustar las claves i18n del panel de sala en es/en.

## 5. Atrás del navegador y de Android (data router)

- [x] 5.1 Migrar `src/App.tsx` a `createBrowserRouter` + `RouterProvider` con una ruta de layout que conserve `Background`, `CrtOverlay`, `OnboardingCoach`, el `AnimatePresence` de transiciones y `useAndroidBackButton`; verificado con build y navegación.
- [x] 5.2 Implementar `useBlocker` en `src/screens/Online.tsx` (bloqueo con `room` presente, `bypassBlockRef` para el salto a la mesa y solo navegaciones no-`REPLACE`) y unificar la acción de volver con `navigate('/')`; verificado con Playwright: atrás del navegador muestra el diálogo, cancelar permanece, confirmar sale y empezar partida no se bloquea.
- [x] 5.3 Controlar el atrás también en **carga directa** (enlace/recarga): al activarse la sala con `history.state.idx === 0` se empuja una entrada idéntica (con `bypassBlockRef`) para que el atrás sea un `POP` controlable; confirmar limpia la sala y navega al menú. Verificado con Playwright: host y invitado por enlace directo muestran el diálogo, confirman y la plaza se libera sin fantasma.

## 6. Rediseño visual avanzado del lobby

- [x] 6.1 Ampliar `src/components/PersonCard.tsx` con `avatarName` (inicial del avatar), `muted` (plaza libre) y `strong` (peso del nombre) y componer las plazas (ocupadas y libres) sin números de asiento ni chips por fila; verificado en escritorio y móvil.
- [x] 6.2 Código protagonista, centrado y activable (copia el enlace) con contador `n/4` y chip de anfitrión solo para el anfitrión; a su lado, un QR pequeño de la misma altura que el código que abre el QR en grande en `QrDialog` con `QrCode` sobre fondo claro; eyebrow «Código de sala» alineado a la izquierda. Verificado. Se corrigió `QrCode` para convertir los tokens `rgb(...)` a hex (antes no se dibujaba) y para ceder el tamaño de visualización a las utilidades (el estilo inline de `qrcode` lo pisaba).
- [x] 6.3 Estado «solo en la sala»: guía para invitar y CTA del anfitrión con etiqueta estable («Empezar partida») y el requisito de 2 jugadores como texto de ayuda.
- [x] 6.4 Movimiento: entrada/salida de plazas con `AnimatePresence` + `fadeUp`/`layout` y aviso de conexión con `fadeDown`.
- [x] 6.5 Añadir las claves i18n nuevas (plaza libre, invitación, contador, guía «solo», requisito) y retirar las obsoletas en es/en.

## 7. Verificación de reutilización, calidad e integración

- [x] 7.1 Repasar la checklist de `AGENTS.md`: utilidades nativas y tokens, `Panel`/`PersonCard`/`SelectableCard`/`ConfirmDialog` reutilizados sin duplicar, sin helpers definidos dos veces, y todo el texto por `t(...)`.
- [x] 7.2 Ejecutar `npx oxlint src/`, `npx tsc -b`, `npm run build`, `npx vitest run` y `npm run test:online`; verificado sin errores.
- [x] 7.3 Integración headless con Playwright: crear, unirse por enlace, recargar con `?code=`, cambiar de modo con confirmación, atrás del navegador con confirmación, cancelar, QR visible, copiar enlace, borrado de sala vacía y sin desbordamiento en móvil.
- [ ] 7.4 Pase en dispositivo: reconexión transitoria (corte y restauración reales de red) y atrás de hardware de Android.

## Workflow follow-up

- Archivar este change después de archivar `online-private-multiplayer` y `unify-online-lobby-screen`, reconciliando los requisitos que supersede.
- Verificar el resultado archivado.
