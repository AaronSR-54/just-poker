# Tasks

## 1. Informe de auditoría (línea base)

- [x] 1.1 Crear `docs/code-reuse-audit.md` con: resumen de cumplimiento (activas ~80%, incluyendo aparcadas ~55–60%), hallazgos por categoría con referencias `archivo:línea` (duplicación de JSX/lógica, primitivas reinventadas, violaciones de tokens, strings sin `t(...)`, helpers duplicados) y remediaciones propuestas como changes de seguimiento priorizadas por impacto/esfuerzo. Verificar que el archivo existe y que cada hallazgo incluye al menos una referencia `archivo:línea`.
- [x] 1.2 Revisar que las referencias citadas resuelven a rutas reales del repo (spot-check de los 5 focos principales) y corregir cualquier ruta desactualizada. Verificar que no queda ninguna ruta inexistente en el informe.

## 2. Norma de reutilización en `AGENTS.md`

- [x] 2.1 Añadir la sección «Reutilización y buenas prácticas» con reglas accionables (reutilizar componentes de `src/components/`; extraer un componente React cuando un patrón se repite; no duplicar markup, lógica ni helpers; usar tokens de diseño; usar `t(...)` para texto visible) y una checklist de revisión de change. Verificar que la checklist cubre las cinco categorías de la auditoría.
- [x] 2.2 Reconciliar la deriva de `AGENTS.md` (p. ej. `PokerCard.back`, `ProgressDots`) con los componentes reales: ajustar el texto a lo existente o marcarlo explícitamente como pendiente con referencia a `docs/code-reuse-audit.md`. Verificar que cada componente nombrado en la sección existe en `src/components/`.

## 3. Aplicación de la norma vía OpenSpec

- [x] 3.1 Añadir el bloque `context` en `openspec/config.yaml` con las restricciones clave que un agente no infiere (Tailwind nativo sin clases propias, usar `src/components/`, tokens, i18n), sin duplicar documentación general. Verificar que `openspec instructions proposal --change <cualquier-change> --json` devuelve ese contexto.
- [x] 3.2 Añadir `rules` por artefacto en `openspec/config.yaml` accionables: `proposal` (declarar impacto en reutilización y si se extrae componente/helper), `specs` (sin detalles de implementación), `design` (nombrar componentes reutilizados/extraídos y justificar duplicación), `tasks` (incluir tarea de verificación de reutilización + lint/typecheck/build). Verificar que `openspec instructions design --change <cualquier-change> --json` incluye las reglas de `design`.

## 4. Verificación

- [x] 4.1 Ejecutar `openspec validate enforce-coding-standards` y confirmar que pasa con `skip_specs: true` (sin archivos bajo `specs/`). Verificar salida sin errores.
- [x] 4.2 Confirmar que `openspec/config.yaml` parsea y que el `context`/`rules` se inyectan en un change distinto al de este (p. ej. `openspec instructions tasks --change improve-music-playback --json`). Verificar que las reglas aparecen en la respuesta.
- [x] 4.3 Confirmar que no hay impacto en código: `npx oxlint src/`, `npx tsc --noEmit` y `npm run build` terminan sin errores. Verificar salida en verde.

## Workflow follow-up

- Archivar el change cuando se cumplan los requisitos de revisión del proyecto.
- A partir de aquí, planificar como changes independientes las remediaciones listadas en `docs/code-reuse-audit.md`.
