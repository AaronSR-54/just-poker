/** Iniciales de un nombre (hasta dos, tomadas de sus primeras palabras). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0] ?? '').join('').toUpperCase() || '?';
}
