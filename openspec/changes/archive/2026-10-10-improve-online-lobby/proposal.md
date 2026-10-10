# Proposal

## Why

La fase de lobby queda hoy en un callejón sin salida: al entrar en una sala, las tarjetas de crear/unirse se deshabilitan (`Online.tsx`) y las únicas salidas son un botón «Abandonar sala» o volver al menú, sin confirmar y sin distinguir «cambiar de idea» de «salir del juego». Además la dirección no refleja la sala, así que reiniciar el navegador no reabre el lobby, no hay señal cuando se pierde la conexión y la presentación del lobby no tiene jerarquía propia. Rediseñar el lobby y rehacer el flujo de salida lo hace coherente, robusto y sin callejones sin salida.

## What Changes

- **Tarjetas de modo siempre activas**: dentro de la sala, las tarjetas «Crear partida» y «Unirse con código» dejan de estar deshabilitadas y siguen pulsables; la del modo en uso queda marcada.
- **Sin botón «Abandonar sala»**: se retira la acción explícita de abandonar del panel de sala. La salida se hace eligiendo el otro modo o usando la acción de volver.
- **Confirmación al salir**: cuando el humano está en una sala y pulsa la otra tarjeta de modo, la acción de volver, el **atrás del navegador** o el **atrás de Android**, el sistema pide confirmación; al confirmar abandona la sala y sale (al selector o a la pantalla anterior); al cancelar permanece en la sala. Para bloquear la navegación del navegador/Android de forma fiable se **migra el enrutado a un data router** (`createBrowserRouter` + `useBlocker`).
- **La sala vacía se elimina**: cuando el último jugador abandona una sala sin empezar, la sala y su código se eliminan, de modo que el código deja de ser válido. (El servidor ya lo hace; se hace observable y se verifica.)
- **Código de la sala en la dirección**: mientras se está en una sala, la dirección refleja el código (`/online?code=XXXX`); abrir o recargar esa dirección reincorpora a la misma sala si sigue disponible y avisa si ya no existe; al salir, el código se retira de la dirección. Así, reiniciar el navegador permite volver a entrar.
- **Estado de conexión en el lobby**: el lobby muestra cuándo se ha perdido la conexión con la sala y cuándo se recupera, en lugar de quedarse congelado con datos obsoletos.
- **Rediseño visual del lobby**: el lobby adquiere jerarquía propia con el mismo lenguaje visual que la preparación local. El **código es el protagonista** (dígitos grandes, activable y con contador de plazas); la **invitación es directa** —activar el código copia el enlace y a su lado hay un **QR pequeño, de la misma altura que el código, que abre el QR en grande** en un diálogo—; las **plazas son filas uniformes** (avatar pequeño, nombre o «Libre», y el jugador actual en negrita con «(Tú)»; sin números de asiento ni chips por fila, y sin chip de invitado); el estado de «solo en la sala» guía a invitar; y los jugadores y avisos entran con **movimiento**. Se **corrigen tamaños** para que todo sea coherente y no desborde en móvil ni obligue a hacer scroll en escritorio.
- **Feedback al copiar**: activar el código copia el enlace de invitación y lo confirma.

## Capabilities

### New Capabilities

<!-- Ninguna. -->

### Modified Capabilities

- `online-lobby`: cambian el flujo de salida del lobby (selección de modo activa + confirmación, también con el atrás del navegador y de Android), la entrada por código en la dirección, la eliminación de la sala vacía, el estado de conexión y la invitación directa (enlace copiable y QR visible); la vista del lobby gana jerarquía y deja de tener una acción dedicada de abandonar.

> Nota de secuencia: `online-lobby` aún no está en `openspec/specs/` —su delta vive en el change sin archivar `online-private-multiplayer`—, por lo que este delta se redacta como requisitos `ADDED` y **supersede** los requisitos introducidos por `unify-online-lobby-screen` «Selección de crear o unirse» (tarjetas deshabilitadas durante la sala) y «Abandonar la sala» (acción explícita), y ajusta «Vista de lobby del anfitrión» y «Entrada por enlace o QR». Este change debe archivarse **después** de `online-private-multiplayer` y `unify-online-lobby-screen`, reconciliando esos requisitos.

## Impact

- Código: `src/App.tsx` (**migración a data router**: `createBrowserRouter` + `RouterProvider` con una ruta de layout que conserva `Background`, `CrtOverlay`, `OnboardingCoach`, transiciones y el hook del atrás de Android), `src/screens/Online.tsx` (confirmación de salida también con `useBlocker`, sincronización de la dirección, estado de conexión y rediseño del panel de sala), `src/components/PersonCard.tsx` (se amplía con estado vacío, inicial del avatar y peso del nombre para reutilizarlo en las plazas), `src/components/QrCode.tsx` (cede el tamaño de visualización a las utilidades y convierte los tokens a hex) y `src/i18n/locales/{es,en}/online.ts`. Se reutiliza `QrDialog` para el QR en grande. Sin cambios de servidor, protocolo ni esquema de datos: la eliminación de la sala vacía ya existe en `server/game/GameManager.leaveRoom`.
- Reutilización: se usan `Panel`, `PersonCard`, `SelectableCard`, `Badge`, `Avatar`, `PageHeader`, `ScreenTitle`, `CtaButton`, `Button`, `NameField`, `QrCode`, `QrDialog`, `ConfirmDialog`, los helpers de `src/net/onlineSession` y el vocabulario de `src/animations/motion`. Se **amplía** `PersonCard` (vacío, inicial del avatar, peso del nombre) en vez de duplicar su markup en Online; no se extraen otros componentes salvo que aparezca una tercera copia.
- Relación con changes en curso: se apoya en `unify-online-lobby-screen` (pantalla única y tarjetas de modo) y en `online-private-multiplayer` (protocolo de salas). No altera su protocolo de red.
- Sin cambios de dependencias (react-router ya está en v7), tokens ni despliegue; en Android el atrás de hardware pasa a mostrar la confirmación vía `useBlocker`.
