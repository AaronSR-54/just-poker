export const STARTING_CHIPS = 1000;
export const DEFAULT_NAMES = ['Tú', 'Mia', 'Dan', 'Sam', 'Leo', 'Nora'];

export function initials(name: string): string {
  return name.slice(0, 2).toUpperCase();
}
