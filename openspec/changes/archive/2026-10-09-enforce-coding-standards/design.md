# Design

## Context

Ver `proposal.md` — Why. Estado actual relevante:

- `openspec/config.yaml` solo declara `schema: spec-driven`; no tiene `context` ni `rules`, así que ningún change recibe guía del proyecto sobre reutilización.
- `AGENTS.md` documenta el stack de estilos y los componentes existentes, pero **no** obliga a reutilizarlos ni a evitar duplicación, y tiene deriva (`PokerCard.back` y `ProgressDots` documentados pero inexistentes).
- Ya existen primitivas reutilizables en `src/components/` (`Button`, `Avatar`, `PokerCard`, `Badge`, `TopBar`, `SettingSlider`, `RichText`, `Wordmark`, `SettingsButton`, `ConfirmDialog`...).
- La auditoría (read-only) encontró, entre otros:
  - `OnboardingCoach.tsx` ↔ `TutorialCoach.tsx`: medición/posicionamiento/spotlight/panel/skip duplicados (~140 líneas).
  - 5 overlays con backdrop+motion+a11y propios (`ConfirmDialog`, `GameSettings`, `GameOverOverlay`, `RaiseSheet`, fin de tutorial) y sin un `Dialog` compartido.
  - Recetas repetidas: contenedor de pantalla (15 usos/10 archivos), `Wordmark` (componente + 2 copias locales + inline), `BackButton` y título (`Local.tsx` ↔ `HandsGuide.tsx`), toggle pill (`GameSettings.tsx:105` y `:127` idénticos).
  - Helpers duplicados: `clamp01` (4 defs), iniciales (3), blinds/posición (3), `rankValue` (2), `nextAlive` (2).
  - Violaciones de tokens: 9 `rgba(...)` crudos (incluida la `bone` literal), 1 `bg-black/60`, 22 `text-[…]` crudos; 0 `fontFamily/letterSpacing/textTransform` inline (bien).
  - i18n: cobertura fuerte en el flujo de juego; toda la deuda de strings hardcodeados está en las pantallas aparcadas (`Lobby`, `Online`, `Profile`) y en `PokerCard.alt` + el acoplamiento `name === 'Tú'`.

Restricciones (`AGENTS.md`): estilo solo con utilidades nativas de Tailwind, componentes en `src/components/`, tokens de diseño, sin clases CSS propias, textos vía `t(...)`. Herramientas: `npx oxlint src/`, `npx tsc --noEmit`, `npm run build`, `npm test`.

## Goals / Non-Goals

**Goals:**

- Que **todo change futuro** razone y justifique reutilización y ausencia de duplicación en sus artefactos, con una regla explícita por artefacto.
- Dejar en `AGENTS.md` una norma única y accionable (qué hacer / qué no, checklist de revisión).
- Dejar una **línea base medible** de la deuda actual (`docs/code-reuse-audit.md`) que responda "¿hasta ahora se está haciendo?" y alimente changes de seguimiento.

**Non-Goals:**

- No refactorizar el código de la app en este change (ni siquiera los focos grandes); serán changes independientes que la auditoría enumera.
- No crear una capability spec ni requirements de proceso verificables: el usuario eligió que la norma viva en `config.yaml` + `AGENTS.md`.
- No añadir reglas de lint personalizadas ni un job de CI que detecte duplicación (queda como posible follow-up, fuera de alcance).
- No arreglar la deriva de `AGENTS.md` sobre componentes inexistentes más allá de lo que la norma necesite (se anotará como hallazgo/remediación).

## Decisions

### 1. La norma vive en `AGENTS.md` (guía) + `rules` de `openspec/config.yaml` (aplicación)

`AGENTS.md` recibe la sección normativa legible por humanos/agentes; `openspec/config.yaml` recibe `context` y `rules` por artefacto para que cada change las reciba en `openspec instructions`.

- **Por qué**: `rules` se inyectan en la generación de cada artefacto (proposal/specs/design/tasks) de todos los changes, así que la norma se aplica sin depender de la memoria del agente; `AGENTS.md` sigue siendo la fuente única para humanos.
- **Alternativas rechazadas**: capability spec `coding-standards` (el usuario prefirió config+AGENTS.md; además sería requisitos de proceso, no de comportamiento); documentar solo en `AGENTS.md` (no se inyecta en los artefactos, fácil de ignorar).

### 2. Reglas accionables por artefacto (concretas, no genéricas)

Las `rules` piden cosas verificables en el momento de escribir cada artefacto:

- **proposal**: declarar el impacto en componentes reutilizables y si se introduce/extrae algún componente o helper.
- **specs**: no especificar detalles de implementación; cuando aplique, expresar el comportamiento sin acoplarlo a duplicación.
- **design**: nombrar los componentes de `src/components/` que se reutilizan y los que se extraen; justificar cualquier markup/lógica repetida.
- **tasks**: incluir una tarea explícita de verificación de reutilización/duplicación y ejecutar lint/typecheck/build.

- **Por qué**: reglas genéricas ("no dupliques") no cambian el resultado; las concretas obligan a un paso de diseño y verificación.
- **Alternativas rechazadas**: una sola regla global (menos precisa); checklist solo en `AGENTS.md` (no inyectada).

### 3. Auditoría como documento durable `docs/code-reuse-audit.md`

El informe se versiona en el repo (no se entierra en `design.md`, que es efímero y no sobrevive al archivado). Estructura: resumen de cumplimiento, hallazgos por categoría con `archivo:línea`, y **remediaciones propuestas como changes de seguimiento** priorizadas por impacto/esfuerzo.

- **Por qué**: responde a "¿hasta ahora se está haciendo?" con evidencia y sirve de backlog para los refactors, sin mezclarlos en este change.
- **Alternativas rechazadas**: incluir hallazgos solo en `design.md` (se pierde al archivar); crear ya los changes de refactor (fuera de alcance del usuario).

### 4. Remediar en changes de seguimiento (no aquí)

La auditoría enumera como cambios propuestos, en este orden de impacto: (a) primitivas compartidas fundacionales (`Dialog`/`Modal`, `ChoicePill`/`SegmentedControl`, variantes `danger`/`bare` en `Button`, `Screen`, `BackButton`, `Title`, `Wordmark` unificado), (b) extracción del motor del coach (`useCoachPositioning`/`CoachPanel`), (c) deduplicación de helpers a `src/utils/`, (d) deuda de tokens/i18n (priorizar pantallas activas y `PokerCard.alt`/`DEFAULT_NAMES`; aparcadas al final). Los que toquen comportamiento observable llevarán su propia delta spec; los puramente internos usarán `skip_specs`.

- **Por qué**: mantiene este change pequeño y revisable, y evita un refactor masivo sin verificación por partes.
- **Alternativas rechazadas**: refactorizar top-offenders aquí (mayor riesgo y revisión; el usuario lo descartó).

## Risks / Trade-offs

- [Las `rules` en `config.yaml` son advisory y no bloquean con `openspec validate`] → Se refuerzan con una checklist explícita en `AGENTS.md` y con la verificación de tareas; queda como follow-up evaluar lint/CI que las haga verificables.
- [La auditoría puede quedar obsoleta al refactorizar] → Las remediaciones se marcan como changes propuestos; el informe se actualiza o archiva al ejecutarlos.
- [Añadir `context`/`rules` afecta a **todos** los changes, incluidos los dos en curso] → Los texts se redactan como guía aditiva y no bloqueante; no cambian requisitos de comportamiento.
- [Deriva de `AGENTS.md` (componentes documentados inexistentes) si la norma habla de ellos] → La sección normativa referenciará solo lo que existe; la reconciliación se anota como remediación en la auditoría.

## Migration Plan

- Cambio solo de documentación/configuración. Sin migración de datos ni despliegue especial.
- Rollback: revertir `AGENTS.md`, `openspec/config.yaml` y eliminar `docs/code-reuse-audit.md`.
- Orden sugerido de aplicación: (1) `docs/code-reuse-audit.md`, (2) `config.yaml` (`context`+`rules`), (3) sección en `AGENTS.md`, (4) validar.

## Open Questions

Ninguna que afecte a specs, enfoque o desglose de tareas. La elección de si añadir detección automática de duplicación (lint/CI) se pospone como follow-up fuera de alcance.
