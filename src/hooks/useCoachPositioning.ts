import { useCallback, useLayoutEffect, useMemo, useState } from 'react';

const EDGE = 12;
const GAP = 12;
/** Ventana durante la que se sigue midiendo el ancla mientras termina su animación de entrada. */
const MEASURE_WINDOW_MS = 700;
const MEASURE_INTERVAL_MS = 300;

function sameRect(a: DOMRect, b: DOMRect): boolean {
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

/**
 * Mide el elemento ancla (`data-tour`) y el panel, y calcula dónde colocar este
 * último junto al ancla sin salirse de la pantalla. Compartido por los coaches
 * de onboarding y tutorial.
 */
export function useCoachPositioning({
  stepKey,
  target,
  active = true,
}: {
  /** Cambia al pasar de paso para volver a medir. */
  stepKey: string;
  /** Valor de `data-tour` del elemento a iluminar. */
  target?: string;
  /** Si el coach no está visible, no mide. */
  active?: boolean;
}) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [panelSize, setPanelSize] = useState({ width: 0, height: 0 });
  const [panelNode, setPanelNode] = useState<HTMLDivElement | null>(null);
  const panelRef = useCallback((node: HTMLDivElement | null) => setPanelNode(node), []);

  useLayoutEffect(() => {
    if (!active) return;
    if (!target) {
      setRect(null);
      return;
    }
    const measure = () => {
      const el = document.querySelector(`[data-tour="${target}"]`);
      const next = el ? el.getBoundingClientRect() : null;
      setRect((prev) => {
        if (!next) return prev;
        if (prev && sameRect(prev, next)) return prev;
        return next;
      });
    };
    measure();
    window.addEventListener('resize', measure);
    let raf = 0;
    const start = performance.now();
    const loop = () => {
      measure();
      if (performance.now() - start < MEASURE_WINDOW_MS) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const interval = window.setInterval(measure, MEASURE_INTERVAL_MS);
    return () => {
      window.removeEventListener('resize', measure);
      cancelAnimationFrame(raf);
      clearInterval(interval);
    };
  }, [stepKey, target, active]);

  useLayoutEffect(() => {
    if (!panelNode) return;
    const update = () => setPanelSize({ width: panelNode.offsetWidth, height: panelNode.offsetHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(panelNode);
    return () => observer.disconnect();
  }, [panelNode]);

  const panelPosition = useMemo(() => {
    if (panelSize.width === 0) return null;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (!rect) {
      return {
        top: Math.max(EDGE, (vh - panelSize.height) / 2),
        left: Math.max(EDGE, (vw - panelSize.width) / 2),
        placeBelow: false,
      };
    }
    const spaceBelow = vh - rect.bottom - GAP - EDGE;
    const spaceAbove = rect.top - GAP - EDGE;
    const placeBelow = spaceBelow >= panelSize.height || spaceBelow >= spaceAbove;
    const top = Math.max(
      EDGE,
      Math.min(placeBelow ? rect.bottom + GAP : rect.top - GAP - panelSize.height, vh - panelSize.height - EDGE),
    );
    const left = Math.max(EDGE, Math.min(rect.left + rect.width / 2 - panelSize.width / 2, vw - panelSize.width - EDGE));
    return { top, left, placeBelow };
  }, [rect, panelSize]);

  const placeBelow = panelPosition?.placeBelow ?? (rect ? rect.top + rect.height / 2 < window.innerHeight / 2 : false);

  return { rect, panelRef, panelPosition, placeBelow, edge: EDGE };
}
