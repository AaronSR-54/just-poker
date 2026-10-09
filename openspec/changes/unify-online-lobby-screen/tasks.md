# Tasks

## 1. Componentes compartidos extraídos de `local/`

- [ ] 1.1 Extraer `src/components/Panel.tsx` (contenedor `bg-ink-900 rounded-[14px]` con el padding de `TableDetail`) y usarlo en `Local.tsx`; verificar el aspecto del panel de mesa.
- [ ] 1.2 Extraer `src/components/PersonCard.tsx` (`Avatar` + nombre `text-fs-300` + línea secundaria `text-fs-100 tracking-[0.04em] opacity-70`) y usarlo en `RivalCard` de `Local.tsx`; verificar con `npx tsc --noEmit` y `npx oxlint src/` sin errores.

## 2. Diálogos reutilizables

- [ ] 2.1 Crear `src/components/NameDialog.tsx` (patrón de `ConfirmDialog`: overlay, `Escape`, `aria-modal`) con nombre pre-rellenado por `randomName()`, acción de generar otro y confirmar; verificar teclado (Tab/Enter/Esc) y regeneración.
- [ ] 2.2 Crear `src/components/QrDialog.tsx` que reutilice `QrCode` en un overlay, con fondo claro; verificar que el QR sigue legible/escaneable.

## 3. Pantalla única de juego con amigos (`src/screens/Online.tsx`)

- [ ] 3.1 Montar la geometría con el shell y `PageHeader` de `Local`: dos columnas en escritorio (`mx-auto max-w-[87.5rem] … gap-8 lg:gap-12`, `flex-[48]`/`flex-[52]`) y una columna en móvil (`px-[1.375rem] pt-8 pb-7`); verificar ambos layouts.
- [ ] 3.2 Columna izquierda con los **botones** «Crear partida» y «Unirse con código» (`Button`; modo activo en `primary`, el otro en `outline`) siempre visibles y marcando el activo; verificar el marcado al entrar y permanecer en la sala.
- [ ] 3.3 Flujo crear: opción crear → `NameDialog` → `room:create` → panel de sala del anfitrión; verificar que se muestra el código y el estado de la sala.
- [ ] 3.4 Flujo unirse: entrada de 4 dígitos + `NameDialog` → `room:join` → panel de sala del invitado; verificar con código válido e inválido.
- [ ] 3.5 Panel de sala compartido (host/invitado) usando `Panel` + `PersonCard`: código copiable, jugadores en vivo con badges «Tú»/«Anfitrión», empezar (host, ≥2 jugadores) o «Esperando a «{anfitrión}»…» (invitado) y «Ver QR» (`QrDialog`); verificar transferencia de host y `room:closed`.

## 4. Rutas, enlaces y menú

- [ ] 4.1 Unificar en `/online` (con `?code=`): retirar `Lobby.tsx` y las rutas `/lobby/:roomId` y `/join/:code` (o redirigirlas a `/online?code=`), cambiar el QR/enlace a `${origin}/online?code=<code>` y ajustar `Menu`; verificar que abrir un enlace/QR inicia el flujo de unirse con el código rellenado.

## 5. i18n

- [ ] 5.1 Añadir/ajustar las claves del nuevo flujo (crear/unirse, diálogo de nombre, generar otro, esperando al anfitrión con nombre, ver QR) y retirar las del hub obsoletas en `src/i18n/locales/{es,en}/online.ts` y `menu.ts`; verificar con `npx tsc --noEmit` que `en: Dict` cubre las claves y que no hay texto nuevo hardcodeado.

## 6. Verificación de reutilización, calidad e integración

- [ ] 6.1 Repasar la checklist de `AGENTS.md`: utilidades nativas y tokens, `Panel`/`PersonCard` reutilizados (sin duplicar en `Local` ni en online), botones de crear/unirse con el `Button` estándar, sin helpers duplicados y todo el texto por `t(...)`; anotar el resultado.
- [ ] 6.2 Ejecutar `npx oxlint src/`, `npx tsc --noEmit`, `npm run build`, `npx vitest run` y `npm run test:online`; verificar que todos terminan sin errores.
- [ ] 6.3 Recorrido de integración móvil/escritorio: crear, unirse por código y por enlace/QR, empezar, esperar al anfitrión, reconectar y sala cerrada; comparar visualmente con `Local` y comprobar que cabecera, títulos, contenedor, paneles y tarjetas de jugador coinciden.

## Workflow follow-up

- Archivar el change cuando el proyecto cumpla sus requisitos de revisión.
- Verificar el resultado archivado.
