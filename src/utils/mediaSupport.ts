import { Capacitor } from '@capacitor/core';

/** Formato de audio que empaqueta la app: Opus dentro de un contenedor WebM. */
const WEBM_OPUS = 'audio/webm; codecs="opus"';

/**
 * true si la plataforma puede reproducir el audio empaquetado por la misma vía
 * que usan los efectos de sonido (`<audio>`). En iOS Safari móvil el contenedor
 * WebM no está soportado, así que devuelve false.
 */
export function detectSfxSupport(): boolean {
  if (typeof Audio === 'undefined') return false;
  try {
    return new Audio().canPlayType(WEBM_OPUS) !== '';
  } catch {
    return false;
  }
}

/**
 * true si el dispositivo puede vibrar. La app nativa siempre puede; en web se
 * exige la Vibration API y una señal de dispositivo móvil/táctil, porque algunos
 * navegadores de escritorio definen `navigator.vibrate` aunque no tengan hardware.
 */
export function detectHapticsSupport(): boolean {
  if (Capacitor.isNativePlatform()) return true;
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return false;
  const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData;
  if (uaData) return uaData.mobile === true;
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(pointer: coarse)').matches;
  }
  return false;
}
