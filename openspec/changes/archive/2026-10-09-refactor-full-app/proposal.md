# Proposal

## Why

La base de código (≈11.4k LOC) funciona y está cubierta por tests, pero concentra la complejidad en unos pocos archivos gigantes: `src/screens/Game.tsx` (1660 líneas, con ~12 componentes y ~15 hooks/efectos inline), `src/game/poker.ts` (694), `src/i18n/translations.ts` (613) y `src/ai/personalities.ts` (589). Esto hace costoso leer, revisar y modificar cualquier parte del juego sin arrastrar contexto irrelevante. El objetivo es un refactor **puro** (sin cambios de comportamiento observable) que reparta esa complejidad en módulos pequeños y cohesionados, con la red de seguridad de los tests y el type-check actuales.

## What Changes

- **Descomponer `Game.tsx`** en una capa de orquestación delgada más componentes de presentación y hooks de dominio específicos, con los mismos props, textos, estilos y animaciones.
- **Descomponer `poker.ts`** en módulos separados (estado/tipos, `PokerGame`, reparto de botes y side pots, serialización), manteniendo la API pública `PokerGame` / `distributePots` intacta.
- **Descomponer `translations.ts`** en diccionarios por sección (es/en co-localizados), ensamblando el mismo tipo `Dict` y las mismas claves.
- **Descomponer `personalities.ts`** separando datos de perfiles de la lógica de decisión/tiempos, sin alterar el comportamiento de la IA ni sus tests.
- **Aislar y ordenar el código aparcado** (online en `src/net/` y `server/`, snapshot en `parked/`, pantallas `Online`/`Lobby`/`Profile`, onboarding), dejándolo claramente etiquetado y fuera del camino crítico. **No se elimina** (el ROADMAP lo conserva para la Fase 3).
- **Pase de consistencia**: eliminar código muerto/exports huérfanos, unificar nombres, y dejar ningún archivo fuente por encima del umbral acordado.
- **Sin cambios de comportamiento**: mismos textos i18n, mismas reglas y resultados del motor, misma UX y layout, mismo formato de guardado (`VERSION = 1`).

## Capabilities

### New Capabilities

Ninguna. Es un refactor puro: no cambia el comportamiento del sistema, por lo que no se modifica ni crea ninguna spec (`skip_specs: true` en `.openspec.yaml`).

### Modified Capabilities

Ninguna.

## Impact

- **Código afectado**: `src/screens/Game.tsx`, `src/game/poker.ts`, `src/i18n/translations.ts`, `src/ai/personalities.ts`; reorganización de `src/net/`, `parked/`, `server/`, `src/components/`, `src/screens/`, `src/types/`.
- **APIs/dependencias**: sin cambios en dependencias externas. Se preservan las exportaciones usadas por el resto del código (p. ej. `PokerGame`, `distributePots`, `PERSONALITIES`, `useI18n`, `t`).
- **Persistencia**: el formato de guardado `just-poker-active-game` se mantiene idéntico; no se sube `VERSION`.
- **Riesgo**: regresiones visuales o de flujo por movimientos de código. Mitigado con `npx tsc -b`, `npx oxlint src/`, `npm test` (41 tests del motor + resto) y `npm run build` en cada paso.
- **Fuera de alcance**: nuevas funcionalidades, cambios de reglas o de balance, rediseño visual, reactivación del online, borrado del código aparcado, cambios en `AGENTS.md`/tokens de Tailwind.
