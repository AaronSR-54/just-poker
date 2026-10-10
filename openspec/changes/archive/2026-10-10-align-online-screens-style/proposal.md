# Proposal

## Why

Las pantallas de entrada de online (`src/screens/Online.tsx` y `src/screens/Lobby.tsx`) usan convenciones visuales propias —`TopBar` en vez de la cabecera `BackButton (←) + Wordmark`, títulos planos en vez de la receta con `<em>` itálica, `FadeIn`/`Stagger` en vez de las variantes de motion, y contenedores/paneles ad-hoc— que las hacen parecer una app distinta al resto (`Menu`, `Local`, `HandsGuide`). Alinearlas mejora la coherencia visual y, de paso, elimina la duplicación de cabecera.

## What Changes

- Adoptar en el hub online y el lobby la misma **cabecera** que `Local`/`HandsGuide`: `BackButton (←)` + `Wordmark` (stack, alineado a la derecha), en lugar de `TopBar`.
- Alinear el **contenedor y el espaciado** a `Local`/`HandsGuide`: escritorio `mx-auto max-w-[87.5rem] px-10 lg:px-20` con `pt-7`/`pb-…` y `gap-8 lg:gap-12`; móvil `px-[1.375rem] pt-8 pb-7`.
- Usar la **receta tipográfica de título** del resto de la app (`font-display font-bold leading-[…] tracking-[-0.015em]` con `<em className="font-light italic tracking-normal">`) en lugar de títulos planos.
- Estilar los **paneles/bloques** no funcionales (código, slots de jugador, caja de acciones) con el panel ya usado en el resto de la app (`bg-ink-900 rounded-[14px]`, `border-bone/40`/`border-bone`), sin radios/tamaños ad-hoc. El QR conserva fondo claro por legibilidad (motivo funcional).
- **Extraer la cabecera compartida**: `BackButton` y el `Wordmark` local están duplicados hoy en `Local.tsx` y `HandsGuide.tsx`; se extrae un componente en `src/components/` (reutilizando el `Wordmark` ya compartido) y se usa también en Online/Lobby.
- Reutilizar el vocabulario de motion ya compartido (`Animated`/`src/animations/motion`); no se introducen animaciones propias.
- **Sin cambios de comportamiento**: navegación, red, i18n y los textos existentes se conservan; solo cambian utilidades/clases y se extrae markup duplicado.

## Capabilities

### New Capabilities

<!-- Ninguna. -->

### Modified Capabilities

<!-- Ninguna: es un refactor visual sin cambio de comportamiento observable. -->

Este change declara `skip_specs: true` en su `.openspec.yaml`: es un refactor de presentación (utilidades Tailwind y extracción de componentes) que no altera requisitos de comportamiento, por lo que no introduce ni modifica specs.

## Impact

- Código: `src/screens/Online.tsx`, `src/screens/Lobby.tsx`, `src/screens/Local.tsx`, `src/screens/HandsGuide.tsx` (sustituir sus copias de cabecera por el componente extraído) y un componente nuevo en `src/components/`.
- Reutilización: se reutilizan `Button`, `Wordmark`, `Avatar`, `Badge`, `QrCode` y las variantes de motion de `src/animations/motion`; se **extrae** un `BackButton`/cabecera compartida para eliminar la duplicación existente.
- Sin cambios de dependencias, esquema de datos, protocolo de red, tokens ni i18n. No afecta a Android ni al despliegue.
