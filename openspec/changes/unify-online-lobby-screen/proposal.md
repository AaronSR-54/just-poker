# Proposal

## Why

Hoy el modo online se reparte en dos pantallas (`/online` para elegir y `/lobby`/`/join` para la sala) y su presentación no sigue la de la preparación de partida local, así que se percibe como una experiencia distinta. Unificar crear/unirse y el lobby en una sola pantalla —con el mismo lenguaje visual que `local/`— elimina pasos intermedios y hace que ambas experiencias se sientan idénticas.

## What Changes

- **Fusionar** las pantallas de entrada online y de lobby en una sola pantalla de «juego con amigos»: en escritorio, la **columna izquierda** contiene los **botones de crear y unirse con código**, y la **columna derecha** el paso activo; en móvil, los mismos dos botones sobre el contenido, en una sola columna.
- **Botones de la izquierda siempre visibles**: «Crear partida» y «Unirse con código» se mantienen a la vista durante todo el flujo, marcando el modo activo (también mientras se está en la sala).
- **Nombre en diálogo modal**: al crear o unirse, un modal con un nombre genérico pre-rellenado y una acción para generar otro; confirmar continúa la acción.
- **Vista de lobby idéntica** para anfitrión e invitado: código de 4 dígitos copiable, jugadores que se incorporan en vivo y un botón **«Ver QR»** que muestra el QR en grande. El anfitrión tiene **«Empezar partida»**; el invitado, en su lugar, **«Esperando a «{anfitrión}»…»**.
- **Un solo punto de entrada `/online`**: el QR y los enlaces codifican `/online?code=<code>`, que abre el flujo de unirse con el código rellenado. Se retirean las rutas `/join/:code` y `/lobby/:roomId` (pasan a redirigir a `/online`).
- **Estilo idéntico a `local/`**: se reutilizan la cabecera de marca, la receta de título, el contenedor de dos columnas, el panel `bg-ink-900 rounded-[14px]` y las tarjetas de jugador; los patrones que hoy viven solo en `Local.tsx` (panel de detalle y tarjeta de persona) se **extraen** a `src/components/` para que ambas pantallas compartan una única definición. Los botones de crear/unirse usan el `Button` estándar de la app.
- Se conservan la **transferencia de host** al salir el anfitrión y la **ventana de reanudación de 30 min**: si hay sesión activa, la pantalla abre directamente el lobby.

## Capabilities

### New Capabilities

<!-- Ninguna: la entrada online ya está dentro de `game-entry`. -->

### Modified Capabilities

- `game-entry`: la superficie de entrada online deja de ser un «hub» con item de reanudar y pasa a ser una pantalla única que integra la creación/unión y el lobby, con entrada por enlace/QR y estilo coherente con la preparación local.

## Impact

- Código: `src/screens/Online.tsx` (pantalla única, absorbe el lobby), retirada de `src/screens/Lobby.tsx`, `src/App.tsx` (rutas), `src/screens/Menu.tsx` (si cambia el destino del CTA) y `src/i18n/locales/{es,en}/{online,menu}.ts`.
- Reutilización: se usan `PageHeader`, `Button`, `Avatar`, `Badge`, `QrCode`, `Animated`/`src/animations/motion` y los helpers de `onlineSession`. Se **extraen** a `src/components/` los patrones de `Local.tsx` (tarjeta seleccionable, panel `bg-ink-900`, tarjeta de persona/nombre) y se sustituyen también en `Local.tsx`.
- Sin cambios de servidor, protocolo, dependencias ni esquema de datos. No afecta a Android ni al despliegue.
- Relación con changes en curso: se apoya en `align-online-screens-style` (ya extrajo `PageHeader`/`BackButton`). Reorganiza pantallas que pertenecen a `online-private-multiplayer` (aún sin archivar); no altera su protocolo de red.
