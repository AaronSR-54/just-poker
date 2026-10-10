import { describe, it, expect } from 'vitest';
import { resolveDeepLink } from './deepLink';

const ORIGIN = 'https://just-poker-delta.vercel.app';

describe('resolveDeepLink', () => {
  it('acepta un enlace de invitación y conserva el código', () => {
    expect(resolveDeepLink(`${ORIGIN}/online?code=ABCD`, ORIGIN)).toBe('/online?code=ABCD');
  });

  it('acepta el enlace heredado /join', () => {
    expect(resolveDeepLink(`${ORIGIN}/join/ABCD`, ORIGIN)).toBe('/join/ABCD');
  });

  it('rechaza rutas que no son de invitación', () => {
    expect(resolveDeepLink(`${ORIGIN}/`, ORIGIN)).toBeNull();
    expect(resolveDeepLink(`${ORIGIN}/hands`, ORIGIN)).toBeNull();
  });

  it('rechaza esquemas que no son https', () => {
    expect(resolveDeepLink(`http://just-poker-delta.vercel.app/online?code=ABCD`, ORIGIN)).toBeNull();
  });

  it('rechaza otro host', () => {
    expect(resolveDeepLink('https://evil.example/online?code=ABCD', ORIGIN)).toBeNull();
  });

  it('rechaza una URL malformada', () => {
    expect(resolveDeepLink('not a url', ORIGIN)).toBeNull();
  });

  it('no resuelve nada sin origen online configurado', () => {
    expect(resolveDeepLink(`${ORIGIN}/online?code=ABCD`, '')).toBeNull();
  });
});
