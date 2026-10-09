import { describe, it, expect, vi } from 'vitest';
import { createMusicController, type MusicController, type MusicDeps } from './musicController';

class FakeParam {
  value = 0;
  cancelScheduledValues = (): void => {};
  setValueAtTime = (value: number): void => {
    this.value = value;
  };
  linearRampToValueAtTime = (value: number): void => {
    this.value = value;
  };
}

class FakeGainNode {
  gain = new FakeParam();
  destination: unknown = null;
  connect = (node: unknown): void => {
    this.destination = node;
  };
}

class FakeSourceNode {
  buffer: unknown = null;
  loop = false;
  onended: (() => void) | null = null;
  started = false;
  connected: unknown = null;
  start = (): void => {
    this.started = true;
  };
  stop = (): void => {};
  connect = (node: unknown): void => {
    this.connected = node;
  };
}

class FakeContext {
  state = 'suspended';
  currentTime = 0;
  destination: unknown = {};
  gains: FakeGainNode[] = [];
  sources: FakeSourceNode[] = [];
  resumeCount = 0;
  suspendCount = 0;
  allowResume = true;
  private listeners: Record<string, Array<() => void>> = {};

  createGain = (): FakeGainNode => {
    const node = new FakeGainNode();
    this.gains.push(node);
    return node;
  };

  createBufferSource = (): FakeSourceNode => {
    const node = new FakeSourceNode();
    this.sources.push(node);
    return node;
  };

  addEventListener = (type: string, callback: () => void): void => {
    (this.listeners[type] ??= []).push(callback);
  };

  emit = (type: string): void => {
    for (const callback of this.listeners[type] ?? []) callback();
  };

  resume = async (): Promise<void> => {
    this.resumeCount += 1;
    if (!this.allowResume) return;
    this.state = 'running';
    this.emit('statechange');
  };

  suspend = async (): Promise<void> => {
    this.suspendCount += 1;
    this.state = 'suspended';
    this.emit('statechange');
  };
}

interface Harness {
  ctx: FakeContext;
  controller: MusicController;
  fetchMock: ReturnType<typeof vi.fn>;
  setVolume: (value: number) => void;
  flush: () => Promise<void>;
}

function createHarness(options: {
  volume?: number;
  fetchTrack?: () => Promise<ArrayBuffer>;
} = {}): Harness {
  const ctx = new FakeContext();
  let volume = options.volume ?? 0.6;
  const fetchMock = vi.fn(options.fetchTrack ?? (() => Promise.resolve(new ArrayBuffer(0))));
  const deps: MusicDeps = {
    createContext: () => ctx as unknown as AudioContext,
    fetchTrack: () => fetchMock() as Promise<ArrayBuffer>,
    decodeTrack: () => Promise.resolve({} as AudioBuffer),
    getVolume: () => volume,
    setTimeout: () => 0,
    clearTimeout: () => {},
  };
  const controller = createMusicController(deps, '/music/theme.webm');
  return {
    ctx,
    controller,
    fetchMock,
    setVolume: (value) => {
      volume = value;
    },
    flush: () => new Promise((resolve) => setTimeout(resolve, 0)),
  };
}

describe('music controller', () => {
  it('no arranca con volumen cero y arranca al subirlo', async () => {
    const h = createHarness({ volume: 0 });
    expect(h.controller.isStarted()).toBe(false);

    h.controller.handleGesture();
    await h.flush();
    expect(h.controller.isStarted()).toBe(false);
    expect(h.ctx.sources).toHaveLength(0);

    h.setVolume(0.6);
    h.controller.handleVolume();
    await h.flush();
    expect(h.controller.isStarted()).toBe(true);
    expect(h.ctx.sources).toHaveLength(1);
    expect(h.ctx.sources[0].started).toBe(true);
  });

  it('arranca automáticamente al abrir cuando la plataforma lo permite', async () => {
    const h = createHarness({ volume: 0.6 });
    h.controller.attemptAutoplay();
    await h.flush();
    expect(h.controller.isStarted()).toBe(true);
    expect(h.ctx.state).toBe('running');
    expect(h.ctx.sources).toHaveLength(1);
  });

  it('cae al gesto cuando la plataforma bloquea el autoplay', async () => {
    const h = createHarness({ volume: 0.6 });
    h.ctx.allowResume = false;
    h.controller.attemptAutoplay();
    await h.flush();
    expect(h.ctx.state).toBe('suspended');

    h.ctx.allowResume = true;
    h.controller.handleGesture();
    expect(h.ctx.state).toBe('running');
    await h.flush();
    expect(h.controller.isStarted()).toBe(true);
  });

  it('reintenta la carga tras un fallo reutilizando el intento posterior', async () => {
    let attempts = 0;
    const h = createHarness({
      volume: 0.6,
      fetchTrack: () => {
        attempts += 1;
        return attempts === 1 ? Promise.reject(new Error('network')) : Promise.resolve(new ArrayBuffer(0));
      },
    });

    h.controller.handleGesture();
    await h.flush();
    expect(h.controller.isStarted()).toBe(false);
    expect(h.fetchMock).toHaveBeenCalledTimes(1);

    h.controller.handleGesture();
    await h.flush();
    expect(h.controller.isStarted()).toBe(true);
    expect(h.fetchMock).toHaveBeenCalledTimes(2);
  });

  it('reintenta en gestos posteriores y desbloquea el contexto dentro del gesto', async () => {
    let attempts = 0;
    const h = createHarness({
      volume: 0.6,
      fetchTrack: () => {
        attempts += 1;
        return attempts === 1 ? Promise.reject(new Error('blocked')) : Promise.resolve(new ArrayBuffer(0));
      },
    });

    h.controller.handleGesture();
    expect(h.ctx.state).toBe('running');

    await h.flush();
    expect(h.controller.isStarted()).toBe(false);

    h.controller.handleGesture();
    await h.flush();
    expect(h.controller.isStarted()).toBe(true);
    expect(h.ctx.sources).toHaveLength(1);
  });

  it('reanuda tras una interrupción y recrea la fuente inválida', async () => {
    const h = createHarness({ volume: 0.6 });
    h.controller.handleGesture();
    await h.flush();
    expect(h.ctx.sources).toHaveLength(1);

    h.ctx.state = 'suspended';
    h.ctx.emit('statechange');
    expect(h.ctx.state).toBe('running');

    h.ctx.sources[0].onended?.();
    h.ctx.state = 'running';
    h.ctx.emit('statechange');
    await h.flush();
    expect(h.ctx.sources).toHaveLength(2);
    expect(h.controller.isStarted()).toBe(true);
  });

  it('es idempotente ante eventos de visibilidad duplicados', async () => {
    const h = createHarness({ volume: 0.6 });
    h.controller.handleGesture();
    await h.flush();
    const resumeBase = h.ctx.resumeCount;
    const suspendBase = h.ctx.suspendCount;

    h.controller.handleVisibility(true);
    h.controller.handleVisibility(true);
    expect(h.ctx.resumeCount).toBe(resumeBase);
    expect(h.ctx.suspendCount).toBe(suspendBase);

    h.controller.handleVisibility(false);
    h.controller.handleVisibility(false);
    expect(h.ctx.suspendCount).toBe(suspendBase + 1);

    h.controller.handleVisibility(true);
    h.controller.handleVisibility(true);
    expect(h.ctx.resumeCount).toBe(resumeBase + 1);
    expect(h.ctx.sources).toHaveLength(1);
  });
});
