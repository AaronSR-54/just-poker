/** Limita un número al rango [0, 1]. */
export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
