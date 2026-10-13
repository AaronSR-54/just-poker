# Proposal

## Why

En la portada, cuando hay una partida en curso, cada tarjeta de modo pasa a tener dos filas
(continuar + nueva partida). A tamaño tablet (768–1023px) la maquetación de escritorio se mantiene
sin adaptarse: la columna de tarjetas se estira a la altura del hero y las filas se desbordan, de
modo que la fila «Nueva partida» se solapa con la tarjeta siguiente. El resultado es ilegible y
rompe la promesa de que el menú siempre ofrece continuar o empezar de forma clara.

## What Changes

- Corregir la disposición de la portada en escritorio/tablet para que, **con partida en curso, las
  dos filas de cada tarjeta y las dos tarjetas entre sí queden siempre completas y sin solaparse**.
- Mantener la estructura de dos columnas actual (hero a la izquierda, tarjetas a la derecha) en
  tablet; no se introduce una variante de layout nueva.
- Cuando la altura disponible no baste (viewport corto en tablet), el contenido de la portada debe
  poder reducirse o desplazarse en lugar de recortarse o solaparse, siguiendo el patrón ya usado por
  las pantallas hermanas (`Local`, `Online`).

## Capabilities

### New Capabilities

<!-- Ninguna: el comportamiento del menú de inicio ya está cubierto por game-entry. -->

### Modified Capabilities

- `game-entry`: se añade un requisito de disposición responsive — con partida en curso, las filas
  de las tarjetas del menú deben permanecer sin solaparse en todos los tamaños soportados
  (incluido tablet), ajustándose o desplazándose cuando la altura no alcance.

## Impact

- Código afectado: `src/screens/Menu.tsx` (rama de escritorio), `src/components/CtaCard.tsx`
  (restricciones de altura del contenedor de tarjetas) y, si la altura del hero contribuye al
  problema, `src/components/Hero.tsx`.
- Sin cambios de API, dependencias ni backend. Sin cambios en el comportamiento con partida no
  iniciada ni en móvil.
- Reutilización: se mantienen los componentes existentes `Screen`, `SettingsButton`, `Hero`,
  `CtaCard` y `Wordmark`. No se espera crear componentes nuevos; cualquier patrón repetido se
  resolvería ajustando utilidades nativas de Tailwind o props existentes. No hay lógica duplicada
  que extraer.
