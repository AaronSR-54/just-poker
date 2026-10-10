# Design

## Context

Ver `proposal.md` - Why. El CTA de la preparación local se renderiza con `src/components/CtaButton.tsx` desde `src/screens/Local.tsx` con `variant="outlineFill"`, mientras que los CTA de crear y unirse (`src/screens/Online.tsx`) usan la variante por defecto `primary` (rellena). Las etiquetas salen de `t('local.play')` y `t('online.joinAction')`.

## Goals / Non-Goals

**Goals:**
- Que el CTA local se vea relleno como los de crear/unirse.
- Que las etiquetas sean «Empezar partida» (local) y «Unirse a partida» (unirse), en es y en.

**Non-Goals:**
- Cambiar la forma de píldora, la flecha, los tamaños o los estados.
- Tocar los CTA de crear partida ni la tarjeta de modo «Unirse a una partida».

## Decisions

- **Relleno vía la variante existente `primary`.** En `Local.tsx` se retira `variant="outlineFill"` del `CtaButton` para que use la variante por defecto `primary`, la misma que los CTA de Online. Alternativa considerada: un `className` con `bg-bone`; descartada porque duplicaría la receta de la variante ya existente.
- **Etiquetas en las claves i18n existentes.** Se actualiza el valor de `local.play` → «Empezar partida»/«Start game» y de `online.joinAction` → «Unirse a partida»/«Join game» (es y en). Alternativa considerada: reutilizar `online.start` (mismo valor) para el CTA local; descartada por acoplar pantallas de dominios distintos. La clave `local.play` solo la consume `Local.tsx` y `online.joinAction` solo `Online.tsx`.
- **Sin extracción ni componentes nuevos.** El relleno reutiliza una variante existente y las etiquetas pasan por `t(...)`; no hay markup ni lógica repetidos que extraer.

## Risks / Trade-offs

- [La variante `outlineFill` de `Button` queda sin uso tras retirarla de `Local.tsx`] → Se deja como variante pública disponible; eliminarla ampliaría el alcance más allá de lo pedido.
- [El valor de `online.start` y el nuevo `local.play` coinciden («Empezar partida»)] → Es duplicación de valor en diccionarios i18n, no de lógica; se mantienen claves separadas por dominio.
