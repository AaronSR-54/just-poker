# Design

## Context

Ver `proposal.md` — Why. El botón de confirmar subida vive en `RaiseControls` (`src/screens/Game/components/RaiseControls.tsx`) y lo comparten `RaiseSheet` (hoja modal de móvil) y `RaisePanel` (popover de escritorio/tablet), así que un único cambio cubre ambas superficies. Su etiqueta actual es texto interpolado (`game.raiseAmount` = «Subir {amount}», `game.allInAmount` = «All-in {amount}»), con el importe embebido en la cadena. El patrón de cantidad de fichas ya existente en la mesa separa icono y número (`ChipIcon` + `<span>{n}</span>`, p. ej. bote en `CommunityRow`).

## Goals / Non-Goals

**Goals:**
- Mostrar el icono de ficha justo antes del importe en el botón de confirmar subida, con el mismo patrón icono+número que el bote y los montones de asiento.
- Cubrir las dos superficies (modal móvil y panel de escritorio) con un solo cambio en el componente compartido.
- Mantener la lógica de subida, los estados y el comportamiento intactos.

**Non-Goals:**
- No se rediseñan los atajos rápidos (`SegmentedControl`) ni el slider.
- No se añade el icono al botón «Subir» de la barra de acciones (`game.raise`), solo al botón de confirmar de los controles de subida.
- No se refactoriza el patrón de cantidad de fichas del resto de la interfaz.

## Decisions

### 1. Separar etiqueta e importe para poder intercalar el icono
El importe debe ir precedido del icono, y la interpolación de `t('… {amount}')` no puede contener JSX. En lugar de reescribir el motor i18n, el botón compone el contenido en el JSX a partir de una etiqueta y un importe separados:

- Etiqueta: se reutilizan claves ya existentes — `game.raise` («Subir» / «Raise») y `game.quickAllIn` («All-in») — eligiendo una u otra según si el importe alcanza el all-in.
- Importe: nodo propio `<span className="tabular-nums">` (evita el baile de anchura al mover el slider, como en `ChipStackRow`).
- Se elimina la clave ahora sin uso `game.raiseAmount` de `src/i18n/locales/es/game.ts` y `src/i18n/locales/en/game.ts` (solo la usaba este botón). `game.allInAmount` se conserva: el botón de igualar (`ActionButtons`) la sigue usando cuando la igualada deja al jugador all-in.

Alternativas consideradas:
- **Icono antes de toda la etiqueta** («🪙 Subir 20»): descartada por el usuario; además diverge del patrón icono+número de la mesa.
- **Claves nuevas dedicadas** (`raiseLabel`, `allInLabel`): descartada para no duplicar palabras visibles («Subir», «All-in») que ya existen; AGENTS pide una sola definición.

### 2. Reutilizar `ChipIcon` y `Button`, sin componentes nuevos
Se reutilizan `ChipIcon` de `src/components/ChipIcon.tsx` (icono ya usado en bote, montones y resultado; hereda el color con `currentColor`, por lo que toma el `text-ink` del botón primario sin color extra) y `Button` de `src/components/Button.tsx`. El contenido se envuelve en un contenedor `inline-flex items-center` con separación corta, y el icono se dimensiona con una utilidad de tamaño de Tailwind (p. ej. `size-4`) adecuada al botón compacto.

Justificación de lo que NO se extrae: el markup `<ChipIcon/> + número` se repite en `CommunityRow`, `ChipStackRow`, `GameOverOverlay` y `PotAward`, pero cada instancia lleva tamaños y colores propios de su contexto (bote atenuado, asiento con color de ganador, overlay invertido, animación). Extraer un componente compartido de cantidad de fichas excede el alcance de este cambio y tocaría superficies ajenas; aquí se reutiliza la primitiva real (`ChipIcon`) y se mantiene la micro-maquetación local, coherente con las instancias existentes. Queda como posible remediación futura en `docs/code-reuse-audit.md`.

### 3. El icono es decorativo
`ChipIcon` ya declara `aria-hidden="true"`, así que no añade texto accesible ni requiere `t(...)`; el nombre accesible del botón sigue siendo su etiqueta y su importe.

## Risks / Trade-offs

- **Peso visual del icono en un botón pequeño** → usar un tamaño de icono compacto y la separación ya prevista, sin engordar el botón.
- **Baile de anchura al mover el slider** → el importe va en un `span` con `tabular-nums`.
- **Borrar claves i18n aún referenciadas** → `game.raiseAmount` solo lo usaba `RaiseControls` (se elimina); `game.allInAmount` se conserva porque lo usa `ActionButtons` (botón de igualar). Se verifica con búsqueda y `tsc`.
- **Acoplamiento de la etiqueta all-in a `game.quickAllIn`** → comparten texto «All-in»; si cambia el atajo, cambia el botón, lo cual es consistente.

## Migration Plan

Solo frontend, sin migración de datos. Despliegue con el build normal de la web/Android. Rollback: revertir el commit.
