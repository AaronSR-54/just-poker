import { useSettingsStore } from '../store/settingsStore';

/** Pista de fondo: un único tema global que suena en bucle. */
const TRACK_URL = '/music/theme.webm';
/** Duración del fundido de entrada/salida, en segundos. */
const FADE = 1.2;
/** Ganancia base de la música sobre el deslizador (para que suene de fondo). */
const BASE_GAIN = 0.7;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let duck: GainNode | null = null;
let source: AudioBufferSourceNode | null = null;
let buffer: AudioBuffer | null = null;
let loading: Promise<AudioBuffer> | null = null;
let started = false;
let duckTimer: number | null = null;

/** Nivel al que baja la música mientras suena un efecto (ducking). */
const DUCK_LEVEL = 0.35;
const DUCK_FADE = 0.06;
const DUCK_HOLD = 0.3;
const DUCK_RESTORE = 0.4;

function targetGain(): number {
  return useSettingsStore.getState().musicVolume * BASE_GAIN;
}

/** Baja momentáneamente la música para que el efecto se oiga con claridad. */
export function duckMusic(): void {
  if (!ctx || !duck || !started) return;
  const now = ctx.currentTime;
  duck.gain.cancelScheduledValues(now);
  duck.gain.setValueAtTime(duck.gain.value, now);
  duck.gain.linearRampToValueAtTime(DUCK_LEVEL, now + DUCK_FADE);
  if (duckTimer !== null) window.clearTimeout(duckTimer);
  duckTimer = window.setTimeout(() => {
    if (!ctx || !duck) return;
    const t = ctx.currentTime;
    duck.gain.cancelScheduledValues(t);
    duck.gain.setValueAtTime(duck.gain.value, t);
    duck.gain.linearRampToValueAtTime(1, t + DUCK_RESTORE);
  }, DUCK_HOLD * 1000);
}

function ensureContext(): AudioContext {
  if (!ctx) {
    const Ctor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    duck = ctx.createGain();
    duck.gain.value = 1;
    duck.connect(master);
  }
  return ctx;
}

async function loadBuffer(context: AudioContext): Promise<AudioBuffer> {
  if (buffer) return buffer;
  if (!loading) {
    loading = fetch(TRACK_URL)
      .then((res) => res.arrayBuffer())
      .then((data) => context.decodeAudioData(data));
  }
  buffer = await loading;
  return buffer;
}

/** Arranca la música de fondo. Idempotente; seguro de llamar en cada gesto. */
export async function startMusic(): Promise<void> {
  const context = ensureContext();
  if (context.state === 'suspended') {
    try {
      await context.resume();
    } catch {
      /* el navegador aún no permite reproducir hasta un gesto válido */
    }
  }
  if (started || source) return;

  const target = targetGain();
  if (target <= 0) return;

  let loaded: AudioBuffer;
  try {
    loaded = await loadBuffer(context);
  } catch {
    return;
  }
  if (started || source) return;

  source = context.createBufferSource();
  source.buffer = loaded;
  source.loop = true;
  source.connect(duck!);
  source.start();

  const now = context.currentTime;
  master!.gain.cancelScheduledValues(now);
  master!.gain.setValueAtTime(0, now);
  master!.gain.linearRampToValueAtTime(target, now + FADE);
  started = true;
}

function applyVolume(v: number): void {
  if (!ctx || !master || !started) return;
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  master.gain.setValueAtTime(master.gain.value, now);
  master.gain.linearRampToValueAtTime(v * BASE_GAIN, now + 0.15);
}

/**
 * Prepara la música de fondo: arranca en el primer gesto (política de autoplay),
 * sigue el volumen de ajustes y se pausa cuando la pestaña/app pasa a segundo plano.
 */
export function initMusic(): () => void {
  const start = (): void => {
    void startMusic();
  };
  window.addEventListener('pointerdown', start, { once: true });
  window.addEventListener('keydown', start, { once: true });

  const onVisibility = (): void => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else void ctx.resume();
  };
  document.addEventListener('visibilitychange', onVisibility);

  const unsubscribe = useSettingsStore.subscribe((state, prev) => {
    if (state.musicVolume === prev.musicVolume) return;
    if (state.musicVolume > 0 && !started) {
      void startMusic();
      return;
    }
    applyVolume(state.musicVolume);
  });

  return () => {
    window.removeEventListener('pointerdown', start);
    window.removeEventListener('keydown', start);
    document.removeEventListener('visibilitychange', onVisibility);
    unsubscribe();
  };
}
