# Tasks

## 1. Componentes de cabecera compartidos

- [x] 1.1 Extraer `src/components/BackButton.tsx` (ghost `←` con `aria-label` por prop) a partir de las copias de `Local.tsx`/`HandsGuide.tsx`; verificar que ambas pantallas lo usan y no cambia el resultado visual ni la navegación.
- [x] 1.2 Extraer `src/components/PageHeader.tsx` (`BackButton` + `Wordmark` stack, con `right?`) y migrar `Local.tsx` y `HandsGuide.tsx`; verificar mismo markup de cabecera y `npx tsc --noEmit` en verde.
- [x] 1.3 Reutilizar el `Wordmark` compartido (`src/components/Wordmark.tsx`, `layout="stack"`) en `Local.tsx`/`HandsGuide.tsx` y eliminar sus copias locales; verificar con `npx oxlint src/` que no quedan imports/definiciones sin usar.

## 2. Hub online (`src/screens/Online.tsx`)

- [x] 2.1 Sustituir `TopBar` por `PageHeader` en móvil y escritorio y alinear contenedor/espaciado a `Local` (`mx-auto max-w-[87.5rem] px-10 lg:px-20`, móvil `px-[1.375rem] pt-8 pb-7`); verificar que el botón `←` vuelve al menú en ambos layouts.
- [x] 2.2 Aplicar la receta de título con `<em>` (claves nuevas `…Em`/`…Rest`) y envolver la caja de acciones en panel `bg-ink-900 rounded-[14px]`; verificar visualmente móvil y escritorio.
- [x] 2.3 Mantener el vocabulario de motion compartido (`FadeIn`); verificar que crear partida y unirse por código siguen funcionando entre dos pestañas.

## 3. Lobby (`src/screens/Lobby.tsx`)

- [x] 3.1 Sustituir `TopBar` por `PageHeader` (con `right` = `Avatar`) y alinear contenedor/espaciado; verificar cabecera en móvil y escritorio.
- [x] 3.2 Estilar el bloque de código y el editor de nombre como panel `bg-ink-900 rounded-[14px]`; mantener el QR sobre `bg-bone`; verificar que el QR sigue siendo legible/escaneable.
- [x] 3.3 Aplicar la receta de título compartida al estado del lobby; verificar los estados conectando / sala llena / esperando jugadores.

## 4. i18n de títulos

- [x] 4.1 Añadir las claves `…Em`/`…Rest` de los títulos del hub y del join en `src/i18n/locales/{es,en}/online.ts`; verificar con `npx tsc --noEmit` que `en: Dict` cubre las mismas claves y que no hay texto nuevo hardcodeado.

## 5. Verificación de reutilización, calidad e integración

- [x] 5.1 Repasar la checklist de `AGENTS.md`: utilidades nativas y tokens (sin clases propias ni valores crudos), componentes de `src/components/` reutilizados, sin duplicación de la cabecera, todo el texto por `t(...)`; anotar el resultado.
- [x] 5.2 Ejecutar `npx oxlint src/`, `npx tsc --noEmit` y `npm run build`; verificar que los tres terminan sin errores.
- [ ] 5.3 Recorrido de integración móvil/escritorio: hub (crear/unirse), join por código, lobby (nombre, QR, copiar código/enlace, empezar) y comparación visual con `Local`/`HandsGuide`; comprobar coherencia de cabecera, título, contenedor y paneles, y que no hay cambios de comportamiento.

## Workflow follow-up

- Archivar el change cuando el proyecto cumpla sus requisitos de revisión.
- Verificar el resultado archivado.
