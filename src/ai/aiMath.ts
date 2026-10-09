import type { ActionKind } from './personalityTypes';

export function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

export function logistic(x: number, k: number, x0: number): number {
  return 1 / (1 + Math.exp(-k * (x - x0)));
}

export function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function noise(error: number): number {
  return (Math.random() * 2 - 1) * error;
}

export function weightedPick(entries: Array<[ActionKind, number]>): ActionKind {
  const total = entries.reduce((s, [, w]) => s + Math.max(0, w), 0);
  if (total <= 0) return entries[0][0];
  let r = Math.random() * total;
  for (const [kind, weight] of entries) {
    r -= Math.max(0, weight);
    if (r <= 0) return kind;
  }
  return entries[entries.length - 1][0];
}
