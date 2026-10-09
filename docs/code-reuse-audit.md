# Auditoría de reutilización y duplicación — Just Poker

Línea base de la deuda de reutilización de componentes y duplicación de código, elaborada para el change `enforce-coding-standards`. Responde a la pregunta «¿se está reutilizando código y evitando duplicación hasta ahora?» y sirve de backlog para changes de seguimiento.

- **Fecha:** 2026-10-09
- **Alcance:** todo `src/` (componentes, pantallas, layout de juego, estilos), `App.tsx` y `AGENTS.md`.
- **Método:** lectura de todos los componentes y pantallas + búsquedas con `rg` para cuantificar. Solo lectura, sin modificar código.
- **Referencias:** todas las rutas son relativas a la raíz del repo y usan el formato `archivo:línea`.

> Las pantallas `Lobby`, `Online` y `Profile` están marcadas `// PARKED` (`Lobby.tsx:1`, `Online.tsx:1`, `Profile.tsx:1`) y no son alcanzables desde el router (`src/App.tsx:33-39`). Se incluyen en la auditoría pero se etiquetan como deuda latente.

## 1. Resumen de cumplimiento

- **Pantallas y componentes activos (ruta viva): ~80 % conformes.** El flujo de juego usa `t(...)` de forma consistente, reutiliza `Button`/`Avatar`/`PokerCard`/`Badge` correctamente, no define clases CSS propias ni propiedades de fuente inline, y domina los tokens (`border-bone` ×61, `text-bone` ×58, `bg-ink` ×35, `bg-bone` ×30).
- **Incluyendo las pantallas aparcadas: ~55–60 %.** `Lobby`, `Online` y `Profile` concentran la mayor parte de los strings hardcodeados, tamaños `text-[…]` crudos y helpers de un solo uso.
- **Principales focos:** (1) motor de coach duplicado, (2) ausencia de un `Dialog`/`Modal` compartido, (3) `Wordmark`/`BackButton`/título repetidos, (4) toggles reimplementados y variantes de `Button` suplidas con `!important`, (5) helpers duplicados y deuda de tokens/i18n en las aparcadas.

## 2. Hallazgos por categoría

### 2.1 Duplicación de JSX / lógica

| # | Patrón duplicado | Ubicaciones (`archivo:línea`) | Notas |
|---|---|---|---|
| 1 | **Motor «medir + posicionar panel» del coach**: `measure()` (bucle rAF + `resize` + intervalo de 300 ms), `ResizeObserver` y cálculo de `panelPosition` | `src/components/OnboardingCoach.tsx:83-131`, `src/components/OnboardingCoach.tsx:135-157` vs `src/components/TutorialCoach.tsx:160-200`, `src/components/TutorialCoach.tsx:229-236`, `src/components/TutorialCoach.tsx:241-261` | ~140 líneas duplicadas. También el `boxShadow` del spotlight (`OnboardingCoach.tsx:176` vs `TutorialCoach.tsx:288`), el panel (`OnboardingCoach.tsx:193` vs `TutorialCoach.tsx:314`) y el enlace de saltar (`OnboardingCoach.tsx:206-212` vs `TutorialCoach.tsx:327-333`). Mayor duplicación del repo. |
| 2 | **Scaffold de modal/diálogo** (backdrop `fixed inset-0 … bg-ink-900/85` + panel con motion + `role`/`aria-modal`) | `src/components/ConfirmDialog.tsx:44-91`; `src/components/GameSettings.tsx:60-188`; `src/screens/Game/components/GameOverOverlay.tsx:24-86`; `src/screens/Game/components/RaiseControls.tsx:94-117`; `src/components/TutorialCoach.tsx:346-368` | 5 overlays hechos a mano; no existe `<Dialog>`/`<Modal>`. Backdrops en `ConfirmDialog.tsx:48`, `GameSettings.tsx:62`, `GameOverOverlay.tsx:26`, `RaiseControls.tsx:97`, `TutorialCoach.tsx:349`. |
| 3 | **Botón «pill» seleccionable** (`rounded-full`, `border-[1.5px]`, `hover:-translate-y-0.5`, estado seleccionado `bg-bone text-ink`) | `src/components/GameSettings.tsx:105-116` y `src/components/GameSettings.tsx:127-138` (idénticos); `src/screens/Game/components/RaiseControls.tsx:47-57`; `src/screens/HandsGuide.tsx:104-115` | `GameSettings` repite la misma receta dos veces en el mismo archivo. No hay `SegmentedControl`/`ChoicePill`. |
| 4 | **`Wordmark`** reimplementado en lugar de reutilizar el componente | Componente: `src/components/Wordmark.tsx` (usado solo en `src/components/TopBar.tsx:16` y `src/components/Hero.tsx:29`). Copias locales: `src/screens/Local.tsx:152-157`, `src/screens/HandsGuide.tsx:15-20`. Inline: `src/screens/Lobby.tsx:249`, `src/screens/Online.tsx:163`, `src/screens/Online.tsx:177`, `src/components/GameSettings.tsx:82` | 3 implementaciones de «Just / *Poker*» (componente + 2 copias + inline). |
| 5 | **`BackButton`** (ghost `Button`, `min-h-0! p-0! text-fs-500! …`, `←`) | `src/screens/Local.tsx:137-150` y `src/screens/HandsGuide.tsx:22-35` | Idénticos salvo el `aria-label` (`common.backToMenu` vs `common.back`). |
| 6 | **Título de pantalla** (`font-display … tracking-[-0.015em]` + `<em>` itálica) | `src/screens/Local.tsx:159-166` y `src/screens/HandsGuide.tsx:37-44` | Misma receta, distinta clave i18n. |
| 7 | **Fila de fichas humano/rival** (`<ChipIcon>` + fichas / `ALL-IN` + `<DeltaLine>` + color de ganador) | `src/screens/Game/components/HumanSeat.tsx:59-69` vs `src/screens/Game/components/RivalSlot.tsx:111-124` | Misma anatomía copiada con pequeñas diferencias de markup. |
| 8 | **Render de la lista de rivales** (`visibleRivals.map` + `<RivalSlot>` + `<ShowdownCards>` + `<HandLabel>` + `AnimatePresence`) | `src/screens/Game/layout/DesktopGameLayout.tsx:66-104` vs `src/screens/Game/layout/MobileGameLayout.tsx:57-95` | Bloque completo duplicado entre los dos layouts. |
| 9 | **Receta de «card-button»** (`flex w-full … border-[1.5px] transition-[…] hover:border-bone …` + variantes seleccionada/sólida) | `src/screens/Menu.tsx:22-49`, `src/screens/Local.tsx:51-88`, `src/screens/HandsGuide.tsx:104-115` | Tres casi-copias; candidato a un `SelectableCard`. |
| 10 | **Contenedor de pantalla completa** (`relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone`) | **15 usos / 10 archivos**: `src/screens/Menu.tsx:89`, `src/screens/Menu.tsx:125`; `src/screens/Local.tsx:217`; `src/screens/HandsGuide.tsx:170`, `:194`; `src/screens/Lobby.tsx:235`, `:247`, `:276`; `src/screens/Online.tsx:170`, `:255`; `src/screens/Profile.tsx:199`, `:239`; `src/screens/Game/layout/DesktopGameLayout.tsx:47`; `src/screens/Game/layout/MobileGameLayout.tsx:46`; `src/screens/Game/components/ScreenMessage.tsx:5` | `AGENTS.md` lo documenta como receta; un componente `<Screen>` eliminaría 15 copias. |
| Bonus | **Pantalla de error duplicada** | `src/screens/Lobby.tsx:233-243` vs `src/screens/Game/components/ScreenMessage.tsx:4-14` | `Lobby` reimplementa `ScreenMessage`. |

### 2.2 Primitivas reutilizables reinventadas

- **`<button>` crudo en lugar de `Button`/un control compartido (10 sitios):** `src/components/GameSettings.tsx:85` (cerrar ✕, duplica `SettingsButton`), `src/components/GameSettings.tsx:105`, `src/components/GameSettings.tsx:127`; `src/screens/Menu.tsx:44`; `src/screens/Local.tsx:66`; `src/screens/Online.tsx:37`; `src/screens/Game/components/RaiseControls.tsx:47`; `src/screens/HandsGuide.tsx:104`; `src/components/OnboardingCoach.tsx:206`; `src/components/TutorialCoach.tsx:327`.
- **`!important` para suplir variantes de `Button` (8 sitios):** `src/components/ConfirmDialog.tsx:82` (`border-danger! bg-danger! text-ink!`), `src/components/GameSettings.tsx:21`, `:166`, `:181`; `src/screens/Local.tsx:143`; `src/screens/HandsGuide.tsx:28`; `src/screens/Game/Game.tsx:249`; `src/screens/Lobby.tsx:239`.
- **Placeholder de carta a mano en lugar de `PokerCard`:** `src/screens/Game/components/CommunityRow.tsx:70` construye el hueco vacío con un `div` punteado; `PokerCard` no tiene prop `back`.
- **Deriva de documentación:** `AGENTS.md:94` anuncia `PokerCard.back` (no implementado, ver `src/components/PokerCard.tsx:20-26`) y `AGENTS.md:96` anuncia `ProgressDots` (no existe; solo `ProgressBar` local en `src/screens/Profile.tsx:30`).
- **Correcto:** `Avatar`, `Badge` y `PokerCard` se reutilizan bien en todos los usos encontrados; no hay reimplementaciones de avatar fuera del propio componente.

### 2.3 Violaciones de tokens de diseño

| Tipo | Cantidad | Ejemplos representativos (`archivo:línea`) |
|---|---|---|
| `rgba(...)` crudo en UI | **9 en 5 archivos** | `src/components/OnboardingCoach.tsx:176` y `src/components/TutorialCoach.tsx:288` → `rgba(13,12,12,0.82)` + `rgba(205,197,183,0.85)` (el literal de `bone` que `AGENTS.md` prohíbe); `src/components/TutorialCoach.tsx:314` / `src/components/OnboardingCoach.tsx:193` → `shadow-[…rgba(0,0,0,0.3)]`; `src/components/PotAward.tsx:209`; `src/screens/Game/components/RaiseControls.tsx:88`; `src/components/CrtOverlay.tsx:117`, `:118`, `:125`. |
| Color no-token crudo | **1** | `src/screens/Game/components/RaiseControls.tsx:97` → `bg-black/60` (existe `--color-ink-950` en `src/styles/index.css:32`). |
| Tamaño de fuente crudo `text-[…]` | **22 usos / 8 archivos** (16 rem/px + 6 em) | Rem/px: `src/screens/Online.tsx:21`, `:179`, `:183`, `:192`, `:268`, `:286`; `src/screens/Profile.tsx:84`, `:99`, `:210`, `:213`, `:255`, `:258`; `src/screens/Menu.tsx:52`, `:60`; `src/screens/Lobby.tsx:224`, `:258`. Basados en `em`: `src/components/Wordmark.tsx:18`, `:19`; `src/screens/Local.tsx:154`, `:155`; `src/screens/HandsGuide.tsx:17`, `:18`. |
| `fontFamily`/`letterSpacing`/`textTransform` inline | **0** | Cumplimiento total. |
| Hex crudo en UI | **0** | Solo `src/ai/debug.ts:120` (log de consola, no UI). |

### 2.4 Texto visible sin `t(...)`

**Código activo (pocos):**
- `src/components/PokerCard.tsx:50` → `alt={\`${rank} de ${suit}\`}`, con preposición en español hardcodeada.
- `src/components/GameSettings.tsx:82` → `'Just Poker'` literal en lugar del componente `Wordmark`.
- Literales de marca dentro de las copias locales de `Wordmark`: `src/screens/Local.tsx:154-155`, `src/screens/HandsGuide.tsx:17-18`, `src/components/Wordmark.tsx:18`, `:28`.
- **Acoplamiento frágil:** `src/screens/Game/components/HumanSeat.tsx:52` hace `name === 'Tú' ? t('common.you') : name`, dependiendo del literal `'Tú'` de `DEFAULT_NAMES` (`src/game/engine/constants.ts:2`, `src/game/gameState.ts:13`, `src/screens/Game/hooks/useLocalGameInit.ts:36`, `src/store/userStore.ts:49`). Renombrar rompe la traducción.

**Pantallas aparcadas (~63 strings, solo español):**
- `src/screens/Lobby.tsx` ~13: p. ej. `:48` «Anfitrión», `:56` «Esperando…», `:178-182`, `:200` «← Abandonar sala», `:209`, `:213`, `:221`, `:228`.
- `src/screens/Online.tsx` ~35: p. ej. `:84`, `:130`, `:157`, `:179` «Jugar en línea», `:182-200`, `:211-225`, `:232-244`, `:267-344`.
- `src/screens/Profile.tsx` ~15: `:16-21` (`timeAgo`), `:146` `placeholder="Tu nombre"`, `:151`, `:158-161`, `:167`, `:178`, `:182`, `:203`, `:243`; además `:25` fija el locale `'es-ES'` y `:62` literales `'Local'`/`'Online'`.

### 2.5 Helpers y funciones duplicadas

| Helper | Duplicados (`archivo:línea`) |
|---|---|
| `clamp01` | **4 definiciones**: `src/ai/aiMath.ts:3`, `src/store/settingsStore.ts:31`, `src/audio/sfx.ts:47`, `src/ai/emotion.ts:21`. |
| Extracción de iniciales | **3 variantes**: `src/game/engine/constants.ts:4` (`slice(0,2)`), `src/components/Avatar.tsx:38-41`, `src/screens/Profile.tsx:136` (`slice(0,2)`). |
| Derivación de blinds/posición | **3 implementaciones**: `src/game/engine/seats.ts:12-22`, `src/ai/aiTable.ts:17-26`, `src/screens/Game/gameView.ts:71-81`. Regla «SB = dealer en 2 jugadores» rederivada. |
| `rankValue` | `src/game/hands.ts:27` y `src/ai/handStrength.ts:19`. |
| `nextAlive`/`nextAliveIdx` | `src/game/engine/seats.ts:4` vs `src/ai/aiTable.ts:9`. |
| Nombre de combinación | `src/screens/Game/gameView.ts:85-99` vs `src/components/TutorialCoach.tsx:78-89`. |
| Medición/posición del coach | `src/components/OnboardingCoach.tsx` vs `src/components/TutorialCoach.tsx` (ver 2.1 #1). |

**Helpers de un solo uso mal ubicados** (candidatos a `src/utils/`): `splitAmount`, `easeOutCubic`, `lerp`, `centerOf` en `src/components/PotAward.tsx:65-84`; `timeAgo`/`formatDate` en `src/screens/Profile.tsx:13-26`; `makeNoise` en `src/components/CrtOverlay.tsx:24-41`.

## 3. Remediaciones propuestas (changes de seguimiento)

Ordenadas por impacto × esfuerzo. Los changes que toquen comportamiento observable llevarán su propia delta spec; los puramente internos usarán `skip_specs: true`.

1. **Primitivas compartidas fundacionales**
   - `Dialog`/`Modal` (backdrop + panel + motion + a11y) → elimina los 5 overlays hechos a mano (2.1 #2).
   - `SegmentedControl`/`ChoicePill` → elimina toggles reinventados (2.1 #3, 2.2).
   - Variantes `danger`/`bare`/`link` en `Button` → elimina los `!important` (2.2).
   - `Screen`, `BackButton`, `Title` y `Wordmark` unificado → elimina las recetas repetidas (2.1 #4, #5, #6, #10).
2. **Extracción del motor del coach** (`useCoachPositioning` + `CoachPanel` + `Spotlight`) → ~140 líneas (2.1 #1).
3. **Deduplicación de helpers** a `src/utils/`: `clamp01`, iniciales, blinds/posición, `rankValue`, `nextAlive` (2.5).
4. **Deuda de tokens e i18n** en código activo primero: `PokerCard.alt`, el acoplamiento `name === 'Tú'` / `DEFAULT_NAMES`, `rgba`/`bg-black` de `RaiseControls`/`PotAward`/`CrtOverlay`, `text-[…]` de `Menu` (2.3, 2.4).
5. **Pantallas aparcadas** (`Lobby`, `Online`, `Profile`): i18n completa, tokens y reutilización de `ScreenMessage`; al final, por ser deuda latente (2.4).
6. **Reconciliar `AGENTS.md`** con los componentes reales (`PokerCard.back`, `ProgressDots`) — parcialmente cubierto en este change (2.2).
