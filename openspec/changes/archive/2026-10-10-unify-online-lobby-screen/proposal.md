# Proposal

## Why

Hoy el modo online se reparte en dos pantallas (`/online` para elegir y `/lobby`/`/join` para la sala) y su presentación no sigue la de la preparación de partida local, así que se percibe como una experiencia distinta. Unificar crear/unirse y el lobby en una sola pantalla —con el mismo lenguaje visual que `local/`— elimina pasos intermedios y hace que ambas experiencias se sientan idénticas. Además, la columna izquierda de la entrada online (dos botones sueltos) queda vacía frente al titular y las tarjetas seleccionables de `local/`.

## What Changes

- **Fusionar** las pantallas de entrada online y de lobby en una sola pantalla de «juego con amigos»: en escritorio, la **columna izquierda** contiene el **titular y las tarjetas seleccionables de crear partida o unirse con código**, y la **columna derecha** el paso activo; en móvil, el titular y las mismas tarjetas sobre el contenido, en una sola columna.
- **Selección siempre visible**: las dos tarjetas seleccionables («Crear partida» y «Unirse con código», cada una con una descripción corta) se mantienen a la vista durante todo el flujo, marcando la activa; mientras se está en la sala quedan visibles pero deshabilitadas.
- **Titular propio**: la pantalla muestra un titular con la misma receta que `local/` (palabra en cursiva + resto) en lugar de una columna izquierda vacía.
- **Abandonar la sala**: el panel de sala ofrece una acción explícita para salir de la sala y volver al selector (hoy solo se puede salir volviendo al menú).
- **Código sin teclado en pantalla**: para unirse, el código de 4 dígitos se escribe con el teclado del dispositivo en cuatro casillas de dígito; se retira el teclado numérico en pantalla. Las tarjetas de crear/unirse mantienen un tamaño fijo para no cambiar de tamaño al alternar entre modos.
- **Nombre en el paso activo**: al crear o unirse, el nombre del jugador se introduce en un campo dentro del panel del paso activo (columna derecha), con un nombre genérico mostrado como placeholder (sin acción de regenerar) y texto grande; sin diálogo modal. Confirmar continúa la acción.
- **Vista de lobby idéntica** para anfitrión e invitado: código de 4 dígitos copiable, contexto «Sala {code} · {count} jugadores», plazas vacías atenuadas (sin repetir «Esperando jugadores…»), jugadores que se incorporan en vivo y un botón **«Ver QR»** que muestra el QR en grande. El anfitrión tiene **«Empezar partida»**; el invitado, en su lugar, **«Esperando a «{anfitrión}»…»**.
- **Un solo punto de entrada `/online`**: el QR y los enlaces codifican `/online?code=<code>`, que abre el flujo de unirse con el código rellenado. Se retirean las rutas `/join/:code` y `/lobby/:roomId` (pasan a redirigir a `/online`).
- **Estilo idéntico a `local/`**: se reutilizan la cabecera de marca, la receta de título, el contenedor de dos columnas, el panel `bg-ink-900 rounded-[14px]`, las tarjetas de jugador y el CTA con flecha; los patrones que hoy viven solo en `Local.tsx` (panel de detalle, tarjeta de persona y tarjeta seleccionable) se **extraen** a `src/components/` para que ambas pantallas compartan una única definición. Las tarjetas de crear/unirse son el mismo patrón seleccionable que las dificultades de `local/` (activa con `border-bone bg-bone text-ink`), ambas de tamaño fijo para no crecer al cambiar de paso.
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
