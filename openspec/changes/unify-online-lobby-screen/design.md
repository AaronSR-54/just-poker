# Design

## Context

Ver `proposal.md – Why`. Estado actual relevante:

- `src/screens/Online.tsx` es el hub (elegir crear/unirse) y `src/screens/Lobby.tsx` implementa la sala (`room:state`, `room:host`, `room:starting`, `room:closed`, código, QR, editar nombre, empezar, transferencia de host). Rutas `/online`, `/lobby/:roomId`, `/join/:code` (`src/App.tsx`). El QR/enlace usa `${origin}/join/${code}` (`Lobby.tsx`).
- Reactividad/anónimo en `src/net/socket.ts` (`connectSocket`, `emitAck`), `src/net/onlineSession.ts` (`getActiveOnlineSession`, `setOnlineSession`, `getPlayerId`/`Name`) y `src/utils/randomName.ts`.
- Recetas de la preparación local (`src/screens/Local.tsx`, ya alineado por `align-online-screens-style` con `PageHeader`): shell `relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone`; móvil `px-[1.375rem] pb-7 pt-8`; escritorio header `mx-auto max-w-[87.5rem] px-10 pt-7 lg:px-20` y contenido `mx-auto … px-10 pb-[3.5rem] pt-4 lg:px-20`; dos columnas `flex w-full items-stretch justify-center gap-8 lg:gap-12` (`flex-[48]` / `flex-[52]`); título `font-display font-bold leading-[0.94] tracking-[-0.015em]` + `<em>`; panel `bg-ink-900 rounded-[14px]`; tarjeta de persona `Avatar` + nombre `text-fs-300` + línea `text-fs-100 tracking-[0.04em] opacity-70`; CTA `Button variant="primary" className="justify-between! rounded-[14px]! min-h-14!"` con flecha.
- `ConfirmDialog` es el patrón de overlay modal existente (z-440, `Escape`, `role="alertdialog"`, `aria-modal`).

## Goals / Non-Goals

**Goals:**
- Una sola pantalla para crear/unirse y ver el lobby, con presentación **idéntica** a `Local`.
- Entrada por enlace/QR a `/online?code=…` sin romper invitaciones.
- Reutilización máxima: extraer de `Local` los patrones que se repiten, en vez de copiarlos.

**Non-Goals:**
- Cambiar el servidor, el protocolo de red o la ventana de reanudación (30 min) o la transferencia de host.
- Rediseñar `Menu`, `Profile`, la mesa de juego o `OnlineGame`.
- Cambiar el comportamiento de la partida local.

## Decisions

### 1. Modelo de la pantalla única

`Online.tsx` pasa a orquestar todo. Estado local: `mode: 'create' | 'join'` (columna izquierda), `phase: 'choose' | 'room'`, `namingOpen` (modal). Los eventos de sala ya existentes alimentan la fase `room`; la lógica de lobby de `Lobby.tsx` se absorbe aquí (o se extrae a un hook `useOnlineRoom`). `Lobby.tsx` se elimina y las rutas `/lobby/:roomId` y `/join/:code` se retiran.

### 2. Disposición de dos columnas (espejo de `Local`)

- Escritorio: mismo contenedor y `gap` que `Local`; **columna izquierda** `flex-[48]` con los **dos botones** («Crear partida» y «Unirse con código»); **columna derecha** `flex-[52]` con el paso activo (entrada de código, modal de nombre o panel de sala).
- Los botones son el `Button` estándar de la app: el de la modalidad activa en `primary` y el otro en `outline`; permanecen visibles durante todo el flujo (también dentro de la sala).
- Móvil: los mismos dos botones (a ancho completo) sobre el contenido, en una sola columna; shell y paddings idénticos a `Local` móvil.

### 3. Extraer de `Local.tsx` a `src/components/`

Para que el estilo sea idéntico sin copiar, se extraen y se sustituyen también en `Local`:
- `Panel`: el contenedor `bg-ink-900 rounded-[14px]` con padding de `TableDetail` de `Local`; online lo usa para el paso de unirse y para la sala.
- `PersonCard`: `Avatar` + nombre + línea secundaria (hoy `RivalCard` en `Local`); online lo usa en la lista de jugadores.

Los botones de crear/unirse **no** se reinventan: se usa el `Button` de `src/components/` (variantes `primary`/`outline`), que es el mismo control del resto de la app.

Se reutilizan además `PageHeader`, `Button`, `Avatar`, `Badge`, `QrCode`, `Animated`/`src/animations/motion` y `randomName`.

### 4. Modal de nombre (`NameDialog`)

Nuevo `src/components/NameDialog.tsx` siguiendo el patrón de `ConfirmDialog` (overlay, `Escape`, foco, `aria-modal`): input pre-rellenado con `randomName()`, acción para generar otro nombre y botón de confirmar (crear/unirse). Compartido por ambos flujos.

### 5. QR en grande (`QrDialog`)

Nuevo `src/components/QrDialog.tsx` que reutiliza `QrCode` en un overlay, abierto por la acción «Ver QR» del panel de sala. El QR mantiene fondo claro por legibilidad.

### 6. Rutas y enlaces

Un único punto de entrada `/online` (con `?code=` opcional). QR y enlace pasan a `${origin}/online?code=<code>`. `/join/:code` y `/lobby/:roomId` dejan de existir; si se conservan por compatibilidad, redirigen a `/online?code=`. `Menu` sigue enviando a `/online` (o a `/game/online-<roomId>` si hay sesión activa).

### 7. Panel de sala host/invitado

Un único componente de sala (con prop `isHost`) evita duplicar host e invitado: código copiable, `PersonCard` por jugador (con badges «Tú»/«Anfitrión»), acción de empezar (host, habilitada con ≥2) o aviso «Esperando a «{anfitrión}»…» (invitado), y acción «Ver QR».

### 8. i18n

Claves nuevas/ajustadas en `src/i18n/locales/{es,en}/online.ts` (crear/unirse, título del diálogo de nombre, generar otro, esperando al anfitrión con nombre, ver QR, etc.). Se retiran las claves del hub que dejan de usarse. `en: Dict` obliga a cubrir ambas lenguas.

### 9. Sin cambios de servidor

El protocolo y la lógica de sala no cambian; solo la presentación y la composición de pantallas.

## Risks / Trade-offs

- [Extraer `Panel`/`PersonCard` de `Local` puede alterar su aspecto] → Sustituir en `Local` y comparar lado a lado; verificación en tareas.
- [Se pierde deep-link `/join/:code` ya compartido] → Es pre-lanzamiento; aun así, redirigir `/join/:code` y `/lobby/:roomId` a `/online?code=` para no romper enlaces.
- [Modal de nombre: foco/escape/scroll] → Reutilizar el patrón y las garantías de `ConfirmDialog`.
- [Duplicar host/invitado] → Un solo componente de sala con `isHost` (decisión 7).
- [Dos `phase`/`mode` pueden desincronizarse con el socket] → Derivar la fase de los eventos de sala y limpiar la sesión ante `room:closed`.

## Migration Plan

Cambio de cliente (React/UI) sin migración de datos ni de red. Rollback: revertir el código; las sesiones antiguas siguen en `localStorage` y la reanudación por `/game/online-<roomId>` no se ve afectada.
