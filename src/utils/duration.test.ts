import { describe, it, expect } from 'vitest';
import { createDurationTracker, formatDuration, resolveInitialElapsed } from './duration';

describe('createDurationTracker', () => {
  it('acumula mientras está en marcha', () => {
    let now = 1000;
    const tracker = createDurationTracker(0, () => now);
    tracker.start();
    now += 5000;
    expect(tracker.elapsed()).toBe(5000);
  });

  it('pausa y no crece mientras está detenido', () => {
    let now = 0;
    const tracker = createDurationTracker(0, () => now);
    tracker.start();
    now += 3000;
    tracker.pause();
    const frozen = tracker.elapsed();
    now += 10000;
    expect(tracker.elapsed()).toBe(frozen);
    expect(tracker.value()).toBe(3000);
  });

  it('reanuda desde el valor acumulado', () => {
    let now = 0;
    const tracker = createDurationTracker(0, () => now);
    tracker.start();
    now += 2000;
    tracker.pause();
    now += 60000;
    tracker.start();
    now += 1000;
    expect(tracker.elapsed()).toBe(3000);
  });

  it('reinicia a cero', () => {
    let now = 0;
    const tracker = createDurationTracker(1000, () => now);
    tracker.start();
    now += 500;
    tracker.reset();
    expect(tracker.elapsed()).toBe(0);
  });

  it('parte del valor acumulado inicial', () => {
    const tracker = createDurationTracker(7000, () => 0);
    expect(tracker.elapsed()).toBe(7000);
  });
});

describe('resolveInitialElapsed', () => {
  it('conserva lo guardado al reanudar', () => {
    expect(resolveInitialElapsed(4200, true)).toBe(4200);
  });

  it('empieza en cero en una partida nueva', () => {
    expect(resolveInitialElapsed(4200, false)).toBe(0);
  });

  it('trata un valor ausente o negativo como cero', () => {
    expect(resolveInitialElapsed(undefined, true)).toBe(0);
    expect(resolveInitialElapsed(-100, true)).toBe(0);
  });
});

describe('formatDuration', () => {
  it('muestra minutos y segundos por debajo de una hora', () => {
    expect(formatDuration(0)).toBe('0m 00s');
    expect(formatDuration(5000)).toBe('0m 05s');
    expect(formatDuration(65000)).toBe('1m 05s');
    expect(formatDuration(59 * 60_000 + 59_000)).toBe('59m 59s');
  });

  it('muestra horas y minutos a partir de una hora', () => {
    expect(formatDuration(60 * 60_000)).toBe('1h 00m');
    expect(formatDuration(3600_000 + 5 * 60_000)).toBe('1h 05m');
  });

  it('trata los negativos como cero', () => {
    expect(formatDuration(-5000)).toBe('0m 00s');
  });
});
