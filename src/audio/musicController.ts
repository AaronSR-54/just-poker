/** Dependencias del navegador que la música necesita, inyectables para poder testearla. */
export interface MusicDeps {
  createContext: () => AudioContext;
  fetchTrack: (url: string) => Promise<ArrayBuffer>;
  decodeTrack: (ctx: AudioContext, data: ArrayBuffer) => Promise<AudioBuffer>;
  getVolume: () => number;
  setTimeout: (handler: () => void, ms: number) => number;
  clearTimeout: (id: number) => void;
}

/** Máquina de estados de la música de fondo, desacoplada de la Web Audio API. */
export interface MusicController {
  /** Intenta arrancar al abrir, sin gesto; el gesto queda como respaldo. */
  attemptAutoplay: () => void;
  /** Desbloquea el audio dentro del gesto y arranca si aún no suena. */
  handleGesture: () => void;
  /** Pausa o reanuda al cambiar la visibilidad (idempotente). */
  handleVisibility: (visible: boolean) => void;
  /** Aplica el volumen de ajustes, arrancando si pasa de cero a sonar. */
  handleVolume: () => void;
  /** Reacciona a los cambios de estado del AudioContext. */
  handleStateChange: () => void;
  /** Baja momentáneamente la música para que se oiga un efecto. */
  duck: () => void;
  isStarted: () => boolean;
  dispose: () => void;
}

/** Duración del fundido de entrada, en segundos. */
const FADE = 1.2;
/** Ganancia base de la música sobre el deslizador (para que suene de fondo). */
const BASE_GAIN = 0.7;
/** Duración del fundido al cambiar el volumen, en segundos. */
const VOLUME_RAMP = 0.15;
/** Nivel al que baja la música mientras suena un efecto (ducking). */
const DUCK_LEVEL = 0.35;
const DUCK_FADE = 0.06;
const DUCK_HOLD = 0.3;
const DUCK_RESTORE = 0.4;

/**
 * Crea el controlador de la música de fondo. No toca el DOM: recibe todo lo
 * necesario por `deps`, de modo que la lógica de arranque/reintento/recuperación
 * pueda probarse con fakes.
 */
export function createMusicController(deps: MusicDeps, trackUrl: string): MusicController {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let duckGain: GainNode | null = null;
  let source: AudioBufferSourceNode | null = null;
  let buffer: AudioBuffer | null = null;
  let loading: Promise<AudioBuffer> | null = null;
  let started = false;
  let hasPlayed = false;
  let visible = true;
  let pending = false;
  let sourceEnded = false;
  let duckTimer: number | null = null;
  let disposed = false;

  function targetGain(): number {
    return deps.getVolume() * BASE_GAIN;
  }

  function ensureContext(): AudioContext {
    if (!ctx) {
      const created = deps.createContext();
      const masterNode = created.createGain();
      masterNode.gain.value = 0;
      masterNode.connect(created.destination);
      const duckNode = created.createGain();
      duckNode.gain.value = 1;
      duckNode.connect(masterNode);
      created.addEventListener('statechange', handleStateChange);
      ctx = created;
      master = masterNode;
      duckGain = duckNode;
    }
    return ctx;
  }

  /** Crea el contexto y reanuda de forma síncrona, sin salir del gesto del usuario. */
  function unlock(): void {
    const context = ensureContext();
    const state: string = context.state;
    if (state === 'suspended' || state === 'interrupted') {
      void context.resume().catch(() => {});
    }
  }

  /** Carga y decodifica la pista; si falla, limpia la caché para poder reintentar. */
  function loadBuffer(context: AudioContext): Promise<AudioBuffer> {
    if (buffer) return Promise.resolve(buffer);
    if (!loading) {
      loading = deps
        .fetchTrack(trackUrl)
        .then((data) => deps.decodeTrack(context, data))
        .then((decoded) => {
          buffer = decoded;
          return decoded;
        })
        .catch((error: unknown) => {
          loading = null;
          buffer = null;
          throw error;
        });
    }
    return loading;
  }

  function startSource(loaded: AudioBuffer): void {
    const context = ctx;
    const duckNode = duckGain;
    const masterNode = master;
    if (!context || !duckNode || !masterNode) return;
    const next = context.createBufferSource();
    next.buffer = loaded;
    next.loop = true;
    next.connect(duckNode);
    next.onended = () => {
      if (source === next && !disposed) sourceEnded = true;
    };
    next.start();
    source = next;
    sourceEnded = false;
    started = true;

    const now = context.currentTime;
    masterNode.gain.cancelScheduledValues(now);
    if (hasPlayed) {
      masterNode.gain.setValueAtTime(targetGain(), now);
    } else {
      masterNode.gain.setValueAtTime(0, now);
      masterNode.gain.linearRampToValueAtTime(targetGain(), now + FADE);
      hasPlayed = true;
    }
  }

  async function ensurePlaying(): Promise<void> {
    if (disposed) return;
    if (started && source && !sourceEnded) return;
    if (pending) return;
    if (!visible) return;
    if (deps.getVolume() <= 0) return;

    const context = ensureContext();
    pending = true;
    try {
      const loaded = await loadBuffer(context);
      if (disposed || !visible) return;
      if (started && source && !sourceEnded) return;
      if (deps.getVolume() <= 0) return;
      startSource(loaded);
    } catch {
      /* la caché ya quedó limpia: el próximo gesto vuelve a intentarlo */
    } finally {
      pending = false;
    }
  }

  async function recover(): Promise<void> {
    if (disposed || !visible) return;
    const context = ensureContext();
    const state: string = context.state;
    if (state === 'suspended' || state === 'interrupted') {
      try {
        await context.resume();
      } catch {
        return; // reintentable en el próximo gesto o cambio de estado
      }
    }
    if (!source || sourceEnded) {
      void ensurePlaying();
    }
  }

  function attemptAutoplay(): void {
    if (disposed) return;
    unlock();
    void ensurePlaying();
  }

  function handleGesture(): void {
    attemptAutoplay();
  }

  function handleVisibility(nextVisible: boolean): void {
    if (disposed || nextVisible === visible) return;
    visible = nextVisible;
    if (!ctx) return;
    if (!visible) {
      void ctx.suspend();
      return;
    }
    void recover();
  }

  function handleVolume(): void {
    if (disposed) return;
    const volume = deps.getVolume();
    if (volume > 0 && (!started || sourceEnded)) {
      void ensurePlaying();
      return;
    }
    if (!ctx || !master || !started) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(volume * BASE_GAIN, now + VOLUME_RAMP);
  }

  function handleStateChange(): void {
    if (disposed || !ctx) return;
    const state: string = ctx.state;
    if (state === 'running') {
      if (visible && sourceEnded) void ensurePlaying();
      return;
    }
    if (!visible) return;
    if (state === 'suspended' || state === 'interrupted') {
      void ctx.resume().catch(() => {});
    }
  }

  function duck(): void {
    if (disposed || !ctx || !duckGain || !started) return;
    const context = ctx;
    const duckNode = duckGain;
    const now = context.currentTime;
    duckNode.gain.cancelScheduledValues(now);
    duckNode.gain.setValueAtTime(duckNode.gain.value, now);
    duckNode.gain.linearRampToValueAtTime(DUCK_LEVEL, now + DUCK_FADE);
    if (duckTimer !== null) deps.clearTimeout(duckTimer);
    duckTimer = deps.setTimeout(() => {
      duckTimer = null;
      if (disposed) return;
      const t = context.currentTime;
      duckNode.gain.cancelScheduledValues(t);
      duckNode.gain.setValueAtTime(duckNode.gain.value, t);
      duckNode.gain.linearRampToValueAtTime(1, t + DUCK_RESTORE);
    }, DUCK_HOLD * 1000);
  }

  function dispose(): void {
    disposed = true;
    if (duckTimer !== null) {
      deps.clearTimeout(duckTimer);
      duckTimer = null;
    }
  }

  return {
    attemptAutoplay,
    handleGesture,
    handleVisibility,
    handleVolume,
    handleStateChange,
    duck,
    isStarted: () => started,
    dispose,
  };
}
