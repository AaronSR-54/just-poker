# Tasks

## 1. Corregir la disposición de la portada en escritorio/tablet

- [x] 1.1 Alinear el contenedor de escritorio del menú con el patrón de `Local`/`Online` (`min-h-0` + `overflow-y-auto`) en `src/screens/Menu.tsx`, verificando con `npm run dev` que la portada sigue centrada y navegable a 1280 px
- [x] 1.2 Quitar `[contain:size]` de la columna de tarjetas en `src/screens/Menu.tsx` y comprobar con `npm run dev` que la columna conserva su centrado y no desborda en 1024 px
- [x] 1.3 Ajustar el wrapper de `src/components/CtaCard.tsx` (`flex-1 min-h-0` / `h-full`) para que, con partida en curso, las filas no encojan por debajo de su contenido, y verificar en 768 px con una partida local en curso que «Continuar partida» y «Nueva partida» no se solapan
- [x] 1.4 Verificar en 768, 900 y 1023 px, con una y con las dos modalidades en curso, que las filas y las dos tarjetas se ven completas y sin solaparse
- [x] 1.5 Verificar con altura de ventana reducida (p. ej. ~600 px en tablet) que el contenido se ajusta o se desplaza y ninguna fila queda recortada ni solapada
- [x] 1.6 Verificar que la disposición móvil (<768 px) y el estado sin partida en curso no cambian de comportamiento respecto a antes del cambio

## 2. Verificación de reutilización y ausencia de duplicación

- [x] 2.1 Revisar la checklist de AGENTS.md: confirmar que se reutilizan `Screen`, `SettingsButton`, `Hero`, `CtaCard` y `Wordmark`; que no se crean clases CSS propias ni valores crudos (`rgba`, `#fff`, tamaños en px) fuera de los tokens; y que no se duplica markup ni lógica entre `Menu` y las pantallas hermanas
- [x] 2.2 Ejecutar `npx oxlint src/` y confirmar que no hay errores ni warnings nuevos
- [x] 2.3 Ejecutar `npx tsc --noEmit` y confirmar que no hay errores de tipos
- [x] 2.4 Ejecutar `npm run build` y confirmar que el build termina correctamente

## Workflow follow-up

- Archivar el change una vez revisados los artefactos y verificado el arreglo.
