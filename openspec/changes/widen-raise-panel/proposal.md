# Proposal

## Why

En pantallas anchas (escritorio y tablet), el panel de subida anclado que se abre al pulsar «Subir» es demasiado estrecho (`max-w-72`, 18rem): el deslizador de importe y los atajos de apuesta quedan apretados y cuesta leer y ajustar la cantidad. Darle más ancho mejora el control de la apuesta sin tocar el resto de la mesa.

## What Changes

- Ampliar el ancho del panel de subida anclado que aparece en pantallas anchas (≥768px), dando más espacio horizontal al deslizador y a los atajos de apuesta.
- Mantener intactos el contenido, el orden y el comportamiento del panel, así como el tamaño de sus controles y textos: solo cambia el ancho del contenedor.
- No se modifica la hoja de subida de móvil (pantallas estrechas).

## Capabilities

### New Capabilities

- `raise-panel`: define la presentación y las dimensiones del panel de subida anclado que se muestra en pantallas anchas al abrir las opciones de apuesta.

### Modified Capabilities

<!-- Ninguna: no cambian requisitos de capacidades existentes. -->

## Impact

- Código afectado: `src/screens/Game/components/RaiseControls.tsx` (el panel anclado), consumido por `ActionButtons`.
- Reutilización: no se introduce ni extrae ningún componente de `src/components/` ni helper de `src/utils/`; se reutilizan tal cual `RaiseControls`, `Button`, `ChipIcon` y `SegmentedControl`. El cambio es solo de utilidades de ancho en el contenedor del panel.
- Sin cambios en i18n, tokens del tema ni dependencias.
