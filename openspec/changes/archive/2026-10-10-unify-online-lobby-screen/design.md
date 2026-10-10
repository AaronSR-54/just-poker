# Design

## Context

Ver `proposal.md – Why`. Estado actual relevante:

- `src/screens/Online.tsx` es el hub (elegir crear/unirse) y `src/screens/Lobby.tsx` implementa la sala (`room:state`, `room:host`, `room:starting`, `room:closed`, código, QR, editar nombre, empezar, transferencia de host). Rutas `/online`, `/lobby/:roomId`, `/join/:code` (`src/App.tsx`). El QR/enlace usa `${origin}/join/${code}` (`Lobby.tsx`).
- Reactividad/anónimo en `src/net/socket.ts` (`connectSocket`, `emitAck`), `src/net/onlineSession.ts` (`getActiveOnlineSession`, `setOnlineSession`, `getPlayerId`/`Name`) y `src/utils/randomName.ts`.
- Recetas de la preparación local (`src/screens/Local.tsx`, ya alineado por `align-online-screens-style` con `PageHeader`): shell `relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone`; móvil `px-[1.375rem] pb-7 pt-8`; escritorio header `mx-auto max-w-[87.5rem] px-10 pt-7 lg:px-20` y contenido `mx-auto … px-10 pb-[3.5rem] pt-4 lg:px-20`; dos columnas `flex w-full items-stretch justify-center gap-8 lg:gap-12` (`flex-[48]` / `flex-[52]`); título `font-display font-bold leading-[0.94] tracking-[-0.015em]` + `<em>`; panel `bg-ink-900 rounded-[14px]`; tarjeta de persona `Avatar` + nombre `text-fs-300` + línea `text-fs-100 tracking-[0.04em] opacity-70`; CTA `Button variant="primary" className="justify-between! rounded-[14px]! min-h-14!"` con flecha.
- `ConfirmDialog` es el patrón de overlay modal existente (z-440, `Escape`, `role="alertdialog"`, `aria-modal`).

## Goals / Non-Goals

**Goals:**
- Una sola pantalla para crear/unirse y ver el lobby, con presentación **idéntica** a `Local`, incluido el titular y las tarjetas seleccionables de la columna izquierda.
- Entrada por enlace/QR a `/online?code=…` sin romper invitaciones.
- Reutilización máxima: extraer de `Local` los patrones que se repiten, en vez de copiarlos.

**Non-Goals:**
- Cambiar el servidor, el protocolo de red o la ventana de reanudación (30 min) o la transferencia de host.
- Rediseñar `Menu`, `Profile`, la mesa de juego o `OnlineGame`.
- Cambiar el comportamiento de la partida local.

## Decisions

### 1. Modelo de la pantalla única

`Online.tsx` pasa a orquestar todo. Estado local: `mode: 'create' | 'join'` (tarjeta activa de la columna izquierda), `phase: 'choose' | 'room'` y `name` (campo del paso activo). Los eventos de sala ya existentes alimentan la fase `room`; la lógica de lobby de `Lobby.tsx` se absorbe aquí (o se extrae a un hook `useOnlineRoom`). `Lobby.tsx` se elimina y las rutas `/lobby/:roomId` y `/join/:code` se retiran.

### 2. Disposición de dos columnas (espejo de `Local`)

- Escritorio: mismo contenedor y `gap` que `Local`; **columna izquierda** `flex-[48]` con el **titular** (misma receta `font-display font-bold leading-[0.94] tracking-[-0.015em]` + `<em className="font-light italic tracking-normal">`) y **dos tarjetas seleccionables** («Crear partida» y «Unirse con código», cada una con una descripción corta); **columna derecha** `flex-[52]` con el paso activo (entrada de código, modal de nombre o panel de sala).
- Las tarjetas son el mismo patrón seleccionable que las dificultades de `Local` (`SelectableCard`, extraído): etiqueta grande + texto secundario, con la activa en `border-bone bg-bone text-ink` y la inactiva en `border-bone/40 bg-ink text-bone`; permanecen visibles durante todo el flujo y, dentro de la sala, quedan deshabilitadas con la activa marcada.
- Móvil: titular y las mismas dos tarjetas (a ancho completo) sobre el contenido, en una sola columna; shell y paddings idénticos a `Local` móvil.

### 3. Extraer de `Local.tsx` a `src/components/`

Para que el estilo sea idéntico sin copiar, se extraen y se sustituyen también en `Local`:
- `Panel`: el contenedor `bg-ink-900 rounded-[14px]` con padding de `TableDetail` de `Local`; online lo usa para el paso de unirse y para la sala.
- `PersonCard`: `Avatar` + nombre + línea secundaria (hoy `RivalCard` en `Local`); online lo usa en la lista de jugadores.
- `SelectableCard`: la tarjeta seleccionable de `DifficultyCard` de `Local` (etiqueta grande + texto secundario, estado activo `border-bone bg-bone text-ink`, hover/`aria-pressed`); online la usa para crear/unirse y `Local` la reutiliza para las dificultades.

Así, las tarjetas de crear/unirse se ven y se comportan como las de dificultad de `Local`, sin reinventar el control.

Se reutilizan además `PageHeader`, `Button`, `Avatar`, `Badge`, `QrCode`, `Animated`/`src/animations/motion` y `randomName`.

### 4. Nombre en el paso activo (`NameField`)

El nombre no usa modal: se introduce en un campo dentro del panel del paso activo (crear y unirse). Se extrae `src/components/NameField.tsx` (etiqueta + input con `randomName()` como placeholder y texto grande, `text-fs-500`), reutilizado por los dos pasos. Si el campo queda vacío se usa el nombre genérico del placeholder; «Crear partida»/«Unirse» continúa la acción. Se retira `NameDialog.tsx` (queda sin uso).

### 5. QR en grande (`QrDialog`)

Nuevo `src/components/QrDialog.tsx` que reutiliza `QrCode` en un overlay, abierto por la acción «Ver QR» del panel de sala. El QR mantiene fondo claro por legibilidad.

### 6. Rutas y enlaces

Un único punto de entrada `/online` (con `?code=` opcional). QR y enlace pasan a `${origin}/online?code=<code>`. `/join/:code` y `/lobby/:roomId` dejan de existir; si se conservan por compatibilidad, redirigen a `/online?code=`. `Menu` sigue enviando a `/online` (o a `/game/online-<roomId>` si hay sesión activa).

### 7. Panel de sala host/invitado

Un único componente de sala (con prop `isHost`) evita duplicar host e invitado: contexto «Sala {code} · {count} jugadores» (`online.roomContext`), código copiable, `PersonCard` por jugador (con badges «Tú»/«Anfitrión»), plazas vacías atenuadas (un único placeholder, sin repetir «Esperando jugadores…» por hueco), acción de empezar (host, habilitada con ≥2) o aviso «Esperando a «{anfitrión}»…» (invitado), acción «Ver QR» y acción de **abandonar la sala** (vuelve al selector).

### 8. i18n

Claves nuevas/ajustadas en `src/i18n/locales/{es,en}/online.ts` (titular `titleEm`/`titleRest`, crear/unirse, descripciones de las tarjetas, título del diálogo de nombre, generar otro, esperando al anfitrión con nombre, ver QR, abandonar sala, etc.). Se retiran las claves del hub que dejan de usarse y se reincorpora `online.leave`. `en: Dict` obliga a cubrir ambas lenguas.

### 9. Sin cambios de servidor

El protocolo y la lógica de sala no cambian; solo la presentación y la composición de pantallas.

### 10. CTA y animaciones (coherencia con `Local`)

- El CTA principal de cada paso (crear, unirse, empezar) usa la receta de `Local`: `Button variant="primary"` con `justify-between! rounded-[14px]! min-h-14!` y flecha `→`. Se evita repetir el rótulo de la tarjeta en el encabezado del panel.
- Entrada con el mismo ritmo que `Local`: `container`/`fadeUp` para el titular y las tarjetas, y `slideSwap` al alternar crear/unirse, en vez de una única animación.

### 11. Entrada de código sin teclado en pantalla

Unirse usa cuatro casillas de dígito (una por cifra, `inputMode="numeric"`) que se rellenan con el teclado del dispositivo, con avance automático y borrado hacia atrás; se retira el teclado numérico en pantalla (`KeypadKey`). Cada casilla filtra a dígitos y «Unirse» se deshabilita hasta completar las cuatro.

### 12. Tamaño fijo de las tarjetas

Las tarjetas seleccionables (`SelectableCard`) no se estiran con el alto del panel: mantienen un tamaño fijo para que no crezcan al alternar entre pasos ni al cambiar el contenido del panel. Se aplica tanto a las tarjetas de crear/unirse de `Online` como a las dificultades de `Local` (que hasta ahora se estiraban para llenar la columna). Por eso ambas pantallas alinean las columnas por el centro en vez de estirarlas.

## Risks / Trade-offs

- [Extraer `Panel`/`PersonCard`/`SelectableCard` de `Local` puede alterar su aspecto] → Sustituir en `Local` y comparar lado a lado; verificación en tareas.
- [Se pierde deep-link `/join/:code` ya compartido] → Es pre-lanzamiento; aun así, redirigir `/join/:code` y `/lobby/:roomId` a `/online?code=` para no romper enlaces.
- [Campo de nombre inline: nombre vacío o repetido] → Deshabilitar la confirmación si el campo está vacío; el servidor ya valida el nombre (errores `name`).
- [Duplicar host/invitado] → Un solo componente de sala con `isHost` (decisión 7).
- [Dos `phase`/`mode` pueden desincronizarse con el socket] → Derivar la fase de los eventos de sala y limpiar la sesión ante `room:closed`.

## Migration Plan

Cambio de cliente (React/UI) sin migración de datos ni de red. Rollback: revertir el código; las sesiones antiguas siguen en `localStorage` y la reanudación por `/game/online-<roomId>` no se ve afectada.
