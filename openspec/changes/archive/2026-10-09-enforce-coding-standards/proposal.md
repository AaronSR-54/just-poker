# Proposal

## Why

El proyecto ya trabaja con OpenSpec SDD, pero no existe una norma explícita ni un punto de control que obligue a **reutilizar componentes** y **no duplicar código** en cada cambio. La auditoría inicial confirma deuda real (motor de posicionamiento duplicado en `OnboardingCoach`/`TutorialCoach` ~140 líneas, 5 overlays sin un `Dialog` compartido, `Wordmark`/`BackButton`/título repetidos, toggles reimplementados como `<button>`, helpers como `clamp01` definidos 4 veces). Sin una norma que se aplique a cada change, la duplicación seguirá creciendo y el coste de corregirla aumenta con cada feature.

## What Changes

- **Norma en `AGENTS.md`**: añadir una sección de reutilización y buenas prácticas (usar los componentes de `src/components/`, extraer un componente React cuando un patrón se repite, no duplicar markup/lógica/helpers, usar tokens y `t(...)`), con una checklist de revisión.
- **Aplicación en `openspec/config.yaml`**: añadir `context` y `rules` por artefacto (proposal/specs/design/tasks) para que cada change razone explícitamente su impacto en reutilización y duplicación y lo verifique.
- **Auditoría inicial**: crear `docs/code-reuse-audit.md` con los hallazgos (duplicación de JSX/lógica, primitivas reinventadas, violaciones de tokens, strings hardcodeados, helpers duplicados) y las remediaciones propuestas como changes de seguimiento.
- **BREAKING**: ninguna.
- **No** se refactoriza código de la app en este change: las correcciones se planifican como changes independientes (ver auditoría). La norma aplica a partir de ahora.

## Capabilities

### New Capabilities

Ninguna. Es un cambio de gobernanza, configuración de OpenSpec y documentación, sin cambio de comportamiento observable del sistema; se marca `skip_specs: true` en `.openspec.yaml`.

### Modified Capabilities

Ninguna. Los refactors derivados de la auditoría, al preservar comportamiento, tampoco cambian specs.

## Impact

- **Documentación**: `AGENTS.md` (nueva sección normativa), `docs/code-reuse-audit.md` (nuevo informe).
- **Configuración OpenSpec**: `openspec/config.yaml` (`context` + `rules` por artefacto).
- **Código de la app**: sin cambios en `src/`.
- **Dependencias / APIs / persistencia**: sin cambios.
- **Verificación**: `openspec validate enforce-coding-standards`, y confirmar que `openspec/config.yaml` parsea.
