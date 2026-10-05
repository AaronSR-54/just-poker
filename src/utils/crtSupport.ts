/**
 * El CRT se implementa con un `filter: url(#jp-crt)` SVG aplicado a todo el
 * árbol y un overlay animado. Firefox y Safari no lo renderizan de forma fiable
 * (Firefox incluso se cae en ciertas combinaciones), así que la función solo se
 * ofrece en motores Chromium.
 */
const CHROMIUM_BRANDS = /Chromium|Google Chrome|Microsoft Edge|Brave|Opera|Vivaldi|Samsung Internet/i;

function detectCrtSupport(): boolean {
  if (typeof navigator === 'undefined') return false;
  const uaData = (
    navigator as Navigator & {
      userAgentData?: { brands?: ReadonlyArray<{ brand: string }> };
    }
  ).userAgentData;
  if (uaData?.brands?.length) {
    return uaData.brands.some((b) => CHROMIUM_BRANDS.test(b.brand));
  }
  return /Chrome|Chromium|CriOS|Edg\/|OPR\//i.test(navigator.userAgent);
}

/** true si el navegador actual renderiza el efecto CRT correctamente. */
export const crtSupported: boolean = detectCrtSupport();
