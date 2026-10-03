# Just Poker — Guía de Estilos y Convenciones

## Design Tokens

Todos los estilos deben usar tokens CSS definidos en `src/styles/tokens.css`. **No uses valores crudos** para colores, fuentes o espaciado.

### Colores

| Token | Valor | Uso |
|-------|-------|-----|
| `var(--bone)` | `rgb(205,197,183)` | Texto principal, bordes activos, acentos |
| `var(--ink)` | `rgb(34,32,31)` | Fondo principal oscuro |
| `var(--bg)` | `var(--ink)` | Fondo de pantalla |
| `var(--fg)` | `var(--bone)` | Color de texto por defecto |
| `var(--border)` | `rgba(255,255,255,0.10)` | Bordes sutiles |
| `var(--surface)` | `var(--ink-alt)` | Fondo de tarjetas |

Para colores con opacidad, usa directamente `rgba(205,197,183,0.XX)` porque `var(--bone)` no se puede componer con opacidad.

### Tipografía

| Clase | Font | Peso | Tamaño | Uso |
|-------|------|------|--------|-----|
| `.jp-h1` | Display | 700 | 64px | Título de pantalla |
| `.jp-h2` | Display | 700 | 36px | Subtítulo |
| `.jp-h3` | Display | 700 | 22px | Nombre de jugador, encabezado |
| `.jp-label` | Display | 700 | 11px | Etiquetas, badges, indicadores |
| `.jp-caption` | Body | 400 | 11px | Texto secundario |
| `.jp-body` | Body | 400 | 14px | Texto general |
| `.jp-eyebrow` | Display | 700 | 11px | Overline/labels pequeños |

**Para cualquier texto, usa las clases tipográficas.** No hagas `fontFamily: 'var(--font-display)'` inline.

### Espaciado

Usa las clases `.gap-1` a `.gap-8` (4px, 8px, 12px, 16px, 20px, 24px, 32px, 48px). No hagas `gap: 6px` inline.

### Bordes y Radios

| Token | Valor | Uso |
|-------|-------|-----|
| `var(--jp-stroke-hair)` | `1px solid #cdc5b72e` | Borde por defecto de tarjetas/slots |
| `var(--jp-radius-pill)` | `999px` | Badges, botones, chips |
| `var(--jp-radius-screen)` | `12px` | Bordes de pantalla |
| `14px` | — | Borde de slots de jugador |

---

## Componentes Reutilizables (CSS)

Estas clases ya existen en `app.css`. Úsalas en vez de repetir estilos inline.

### Slot de jugador

```css
.jp-slot        /* contenedor del jugador: col, gap-2, padding, border, radius */
.jp-slot.active /* borde var(--bone) + glow */
.jp-slot.folded /* opacity 0.32 */
.jp-slot.winner /* borde var(--bone) + bg rgba */
```

**Siempre usa `.jp-slot`** en vez de replicar `border`, `borderRadius`, `boxShadow` inline.

### Chip stack

```css
.jp-chip-stack       /* row + gap para mostrar fichas */
.jp-chip-stack .icon /* emoticono de ficha */
.jp-chip-stack .amt  /* número de fichas */
.jp-chip-stack.low   /* .amt se pone rojo */
```

### Bet badge

```css
.jp-bet-badge  /* pill badge para apuesta actual: bg azul suave, texto azul */
```

### All-in badge

```css
.jp-allin-badge  /* pill badge naranja para estado all-in */
```

### Blind position dot

```css
.jp-blind-dot         /* círculo base */
.jp-blind-dot.dealer  /* D blanca sobre fondo oscuro */
.jp-blind-dot.sb      /* SB azul */
.jp-blind-dot.bb      /* BB naranja */
```

### Quick raise

```css
.jp-quick-raise        /* botón de subida rápida */
.jp-quick-raise.active /* resaltado cuando la cantidad coincide */
```

### Raise slider

```css
.jp-raise-slider     /* contenedor del slider de subida */
```

---

## Reglas: Clases vs Inline Styles

| Situación | Usar |
|-----------|------|
| Layout (display, flex-direction) | `.row`, `.col` |
| Espaciado entre elementos | `.gap-*` |
| Texto estático | `.jp-h3`, `.jp-label`, `.jp-caption` |
| Bordes, fondos, sombras de slots | `.jp-slot`, `.jp-slot.active` |
| Estados (active, folded) | Modificador de clase |
| Opacidad | `.muted` (0.6), `.faint` (0.4) |
| Valores dinámicos (posición, color condicional, minWidth) | Inline style |
| Condiciones complejas (color según chips < 100) | Inline + `var(--token)` |

---

## Patrones Específicos del Juego

### Slot de jugador

```tsx
// BIEN
<div className={`jp-slot${isActive ? ' active' : ''}${folded ? ' folded' : ''}${isWinner ? ' winner' : ''}`}>
  <Avatar name={name} size={48} muted={folded} />
  <div className="jp-h3">{name}</div>
  <RankBadge points={420} compact />
</div>

// MAL
<div style={{
  alignItems: 'center', padding: '16px 20px', borderRadius: 14,
  border: isWinner ? '1.5px solid var(--bone)' : ...
  ...muchos estilos inline...
}}>
```

### Indicador de turno

```tsx
{isActive && <span className="jp-label" style={{ color: 'var(--bone)' }}>Tu turno</span>}
```

### Fichas del jugador

```tsx
<div className={`jp-chip-stack${chips < 100 ? ' low' : ''}`}>
  <span className="icon">🪙</span>
  <span className="amt">{chips}</span>
</div>
```

### Badges (ciegas, all-in, apuesta)

```tsx
{isDealer && <span className="jp-blind-dot dealer">D</span>}
{isSmallBlind && <span className="jp-blind-dot sb">SB</span>}
{isBigBlind && <span className="jp-blind-dot bb">BB</span>}
{bet > 0 && <span className="jp-bet-badge">Apuesta: {bet}</span>}
{isAllIn && <span className="jp-allin-badge">ALL-IN</span>}
```

### Controles de subida

```tsx
<div className="jp-raise-slider">
  <input type="range" min={minRaise} max={maxRaise} value={raiseAmount} onChange={...} />
  <span className="value">{raiseAmount}</span>
</div>
```

---

## Do's y Don'ts

### ✅ DO
- Usa `var(--bone)` para colores, no `rgb(205,197,183)`
- Usa clases tipográficas (`.jp-label`, `.jp-h3`) para todo texto
- Usa `.jp-slot` para contenedores de jugador
- Usa `.muted` / `.faint` para opacidad
- Usa `.gap-*` para espaciado entre elementos
- Añade clases nuevas a `app.css` cuando un patrón se repite

### ❌ DON'T
- No uses `fontFamily: 'var(--font-display)'` inline — usa `.jp-h3`, `.jp-label`, etc.
- No uses `rgba(205,197,183,0.XX)` si puedes usar `var(--bone)` con una clase de opacidad
- No repliques estilos de `.jp-slot` inline
- No uses tamaños de fuente que no estén en la escala (ej: `fontSize: 7`)
- No uses colores que no sean tokens del sistema (ej: `color: '#fff'`)
- No uses `letterSpacing` inline si hay una clase tipográfica que lo incluya

---

## Tooling

- **Lint:** `npx oxlint src/`
- **Type check:** `npx tsc --noEmit`
- **Dev server:** `npm run dev`
