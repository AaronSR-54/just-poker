# Tasks

## 1. Componentes compartidos extraídos de `local/`

- [x] 1.1 Extraer `src/components/Panel.tsx` (contenedor `bg-ink-900 rounded-[14px]` con el padding de `TableDetail`) y usarlo en `Local.tsx`; verificar el aspecto del panel de mesa.
- [x] 1.2 Extraer `src/components/PersonCard.tsx` (`Avatar` + nombre `text-fs-300` + línea secundaria `text-fs-100 tracking-[0.04em] opacity-70`) y usarlo en `RivalCard` de `Local.tsx`; verificar con `npx tsc --noEmit` y `npx oxlint src/` sin errores.

## 2. Diálogos reutilizables

- [x] 2.1 Crear `src/components/NameField.tsx` (etiqueta + input con `randomName()` como placeholder y texto grande) y usarlo en los pasos de crear y unirse; si el campo queda vacío se usa el nombre del placeholder; retirar `NameDialog.tsx`.
- [x] 2.2 Crear `src/components/QrDialog.tsx` que reutilice `QrCode` en un overlay, con fondo claro; verificar que el QR sigue legible/escaneable.

## 3. Pantalla única de juego con amigos (`src/screens/Online.tsx`)

- [x] 3.1 Montar la geometría con el shell y `PageHeader` de `Local`: dos columnas en escritorio (`mx-auto max-w-[87.5rem] … gap-8 lg:gap-12`, `flex-[48]`/`flex-[52]`) y una columna en móvil (`px-[1.375rem] pt-8 pb-7`); verificar ambos layouts.
- [x] 3.2 Columna izquierda con las **tarjetas seleccionables** «Crear partida» y «Unirse con código» (etiqueta + descripción corta; activa `border-bone bg-bone text-ink`, inactiva `border-bone/40 bg-ink text-bone`) siempre visibles y marcando la activa; verificar el marcado al entrar y permanecer en la sala.
- [x] 3.3 Flujo crear: opción crear → nombre en el panel → `room:create` → panel de sala del anfitrión; verificar que se muestra el código y el estado de la sala.
- [x] 3.4 Flujo unirse: campo de código (teclado del dispositivo) + nombre en el panel → `room:join` → panel de sala del invitado; verificar con código válido e inválido.
- [x] 3.5 Panel de sala compartido (host/invitado) usando `Panel` + `PersonCard`: código copiable, jugadores en vivo con badges «Tú»/«Anfitrión», empezar (host, ≥2 jugadores) o «Esperando a «{anfitrión}»…» (invitado) y «Ver QR» (`QrDialog`); verificar transferencia de host y `room:closed`.

## 4. Rutas, enlaces y menú

- [x] 4.1 Unificar en `/online` (con `?code=`): retirar `Lobby.tsx` y las rutas `/lobby/:roomId` y `/join/:code` (o redirigirlas a `/online?code=`), cambiar el QR/enlace a `${origin}/online?code=<code>` y ajustar `Menu`; verificar que abrir un enlace/QR inicia el flujo de unirse con el código rellenado.

## 5. i18n

- [x] 5.1 Añadir/ajustar las claves del nuevo flujo (crear/unirse, diálogo de nombre, generar otro, esperando al anfitrión con nombre, ver QR) y retirar las del hub obsoletas en `src/i18n/locales/{es,en}/online.ts` y `menu.ts`; verificar con `npx tsc --noEmit` que `en: Dict` cubre las claves y que no hay texto nuevo hardcodeado.

## 6. Verificación de reutilización, calidad e integración

- [x] 6.1 Repasar la checklist de `AGENTS.md`: utilidades nativas y tokens, `Panel`/`PersonCard` reutilizados (sin duplicar en `Local` ni en online), botones de crear/unirse con el `Button` estándar, sin helpers duplicados y todo el texto por `t(...)`; anotar el resultado.
- [x] 6.2 Ejecutar `npx oxlint src/`, `npx tsc --noEmit`, `npm run build`, `npx vitest run` y `npm run test:online`; verificar que todos terminan sin errores.
- [ ] 6.3 Recorrido de integración móvil/escritorio: crear, unirse por código y por enlace/QR, empezar, esperar al anfitrión, reconectar y sala cerrada; comparar visualmente con `Local` y comprobar que cabecera, títulos, contenedor, paneles y tarjetas de jugador coinciden.

## 7. Pulido de coherencia con `local/`

- [x] 7.1 Extraer `SelectableCard` de la `DifficultyCard` de `Local` a `src/components/` y reutilizarla en `Local` y en la columna izquierda de Online; verificar el aspecto de las dificultades de `Local`.
- [x] 7.2 Añadir el titular (em en cursiva + resto) con la receta de `Local` encabezando la columna izquierda, en escritorio y móvil; claves i18n `online.titleEm`/`online.titleRest` en es/en.
- [x] 7.3 Igualar el CTA de cada paso a la receta `justify-between! rounded-[14px]! min-h-14!` + flecha y quitar el rótulo repetido en los encabezados de los paneles.
- [x] 7.4 Panel de sala: contexto `online.roomContext`, plazas vacías atenuadas sin repetir «Esperando jugadores…» y acción «Abandonar sala» (recuperar `online.leave`); verificar la transferencia de host al salir el anfitrión.
- [x] 7.5 Igualar los radios del campo de código y los CTAs a `rounded-[14px]` y arrancar con `container`/`fadeUp` + `slideSwap`, como `Local`.
- [x] 7.9 Aplicar a la columna izquierda de `Local` el mismo tratamiento que a `Online`: dificultades como `SelectableCard` de tamaño fijo (sin estirar) y columnas alineadas por el centro; verificar el aspecto de `Local`.
- [x] 7.7 Retirar el teclado en pantalla (`KeypadKey`) y las casillas (`CodeDigit`); unirse usa un único campo de código de 4 dígitos (`inputMode="numeric"`) escrito con el teclado del dispositivo.
- [ ] 7.6 Verificar `npx tsc --noEmit`, `npx oxlint src/` y `npm run build` y comparar visualmente con `Local` (titular, tarjetas, panel, CTA).

## Workflow follow-up

- Archivar el change cuando el proyecto cumpla sus requisitos de revisión.
- Verificar el resultado archivado.
