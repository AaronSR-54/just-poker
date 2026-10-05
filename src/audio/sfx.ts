import { useSettingsStore } from '../store/settingsStore';
import { duckMusic } from './music';

export type SfxName =
  | 'card_deal'
  | 'card_flip'
  | 'check'
  | 'chips_bet'
  | 'chips_raise'
  | 'chips_stack'
  | 'fold'
  | 'timer_tick'
  | 'time_expire'
  | 'turn_tick'
  | 'ui_click';

/** Cada efecto puede tener varias tomas; se elige una al azar en cada reproducción. */
const SOURCES: Record<SfxName, string[]> = {
  card_deal: ['/sounds/card_deal.webm'],
  card_flip: ['/sounds/card_flip.webm'],
  check: ['/sounds/check.webm'],
  chips_bet: ['/sounds/chips_bet.webm', '/sounds/chips_bet_2.webm', '/sounds/chips_bet_3.webm'],
  chips_raise: ['/sounds/chips_raise.webm', '/sounds/chips_raise_2.webm'],
  chips_stack: ['/sounds/chips_stack.webm'],
  fold: ['/sounds/fold.webm'],
  timer_tick: ['/sounds/timer_tick.webm'],
  time_expire: ['/sounds/time_expire.webm'],
  turn_tick: ['/sounds/turn_tick.webm'],
  ui_click: ['/sounds/ui_click.webm'],
};

/** Ganancia relativa de cada efecto para equilibrar unos con otros. */
const GAIN: Record<SfxName, number> = {
  card_deal: 0.5,
  card_flip: 0.55,
  check: 0.6,
  chips_bet: 0.6,
  chips_raise: 0.65,
  chips_stack: 0.8,
  fold: 0.4,
  timer_tick: 0.45,
  time_expire: 0.5,
  turn_tick: 0.5,
  ui_click: 1,
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function pickSource(name: SfxName): string {
  const list = SOURCES[name];
  return list.length === 1 ? list[0] : list[Math.floor(Math.random() * list.length)];
}

export function preloadSounds(): void {
  const warmed = new Set<string>();
  (Object.keys(SOURCES) as SfxName[]).forEach((name) => {
    SOURCES[name].forEach((src) => {
      if (warmed.has(src)) return;
      warmed.add(src);
      const audio = new Audio(src);
      audio.preload = 'auto';
    });
  });
}

export interface PlaySfxOptions {
  /** Retardo en segundos antes de sonar. */
  delay?: number;
  /** Multiplicador extra sobre la ganancia base. */
  gain?: number;
}

/** Efectos tan frecuentes o sutiles que no ahogan la música (no hacen ducking). */
const NO_DUCK: ReadonlySet<SfxName> = new Set(['ui_click', 'timer_tick', 'turn_tick']);

function fire(name: SfxName, gain: number): void {
  const { sfxVolume } = useSettingsStore.getState();
  if (sfxVolume <= 0) return;
  if (!NO_DUCK.has(name)) duckMusic();
  const node = new Audio(pickSource(name));
  node.volume = clamp01(sfxVolume * GAIN[name] * gain);
  void node.play().catch(() => {});
}

export function playSfx(name: SfxName, options: PlaySfxOptions = {}): void {
  if (useSettingsStore.getState().sfxVolume <= 0) return;
  const { delay = 0, gain = 1 } = options;
  if (delay > 0) {
    window.setTimeout(() => fire(name, gain), delay * 1000);
    return;
  }
  fire(name, gain);
}

export function playSfxSequence(
  name: SfxName,
  count: number,
  stepMs = 90,
  options: PlaySfxOptions = {}
): void {
  const start = options.delay ?? 0;
  for (let i = 0; i < count; i++) {
    playSfx(name, { ...options, delay: start + (i * stepMs) / 1000 });
  }
}
