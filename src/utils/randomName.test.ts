import { describe, it, expect } from 'vitest';
import { randomName } from './randomName';

describe('randomName', () => {
  it('devuelve un nombre no vacío', () => {
    expect(randomName().length).toBeGreaterThan(0);
  });

  it('es determinista con un generador inyectable', () => {
    expect(randomName(() => 0)).toBe(randomName(() => 0));
  });

  it('recorre los extremos del catálogo', () => {
    expect(randomName(() => 0)).not.toBe(randomName(() => 0.999999));
  });
});
