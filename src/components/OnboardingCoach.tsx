import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import Button from './Button';
import { renderRich } from './RichText';
import { useUserStore } from '../store/userStore';
import { useOnboardingStore } from '../store/onboardingStore';
import { t as motionT } from '../animations/motion';
import { useI18n } from '../i18n';

/* ------------------------------------------------------------------ *
 * Tour de bienvenida
 *
 * Guía al usuario que entra por primera vez: explica cómo crear una partida
 * desde el menú, presenta los niveles de dificultad y le hace elegir «Fácil».
 * Al pulsar «Jugar» (interceptado en la pantalla de mesas) arranca la mano
 * guiada de `/game/guide`.
 * ------------------------------------------------------------------ */

interface OnboardingStep {
  id: string;
  /** Ruta en la que se muestra el paso. */
  path: '/' | '/local';
  kind: 'info' | 'act';
  /** Valor del atributo `data-tour` que hay que iluminar. */
  target?: string;
}

/** El texto de cada paso vive en `onboarding.steps.<índice>` de los diccionarios. */
const STEPS: OnboardingStep[] = [
  { id: 'welcome', path: '/', kind: 'info' },
  { id: 'new-game', path: '/', kind: 'act', target: 'play-local' },
  { id: 'difficulty', path: '/local', kind: 'info', target: 'difficulty-list' },
  { id: 'choose-easy', path: '/local', kind: 'act', target: 'difficulty-easy' },
  { id: 'start', path: '/local', kind: 'act', target: 'start-game' },
];

const NEW_GAME_INDEX = STEPS.findIndex(s => s.id === 'new-game');
const FIRST_LOCAL_INDEX = STEPS.findIndex(s => s.path === '/local');
const EDGE = 12;
const GAP = 12;

const OnboardingCoach: React.FC = () => {
  const location = useLocation();
  const completed = useUserStore(s => s.onboardingCompleted);
  const completeOnboarding = useUserStore(s => s.completeOnboarding);
  const difficulty = useOnboardingStore(s => s.difficulty);
  const { t } = useI18n();

  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [panelSize, setPanelSize] = useState({ width: 0, height: 0 });
  const [panelNode, setPanelNode] = useState<HTMLDivElement | null>(null);
  const panelRef = useCallback((node: HTMLDivElement | null) => setPanelNode(node), []);

  const path = location.pathname;
  const visible = !completed && (path === '/' || path === '/local');
  const stepIdx = Math.min(index, STEPS.length - 1);
  const step = STEPS[stepIdx];

  // Avanza según la pantalla y las acciones del usuario, y recoloca el tour al cambiar de ruta.
  useEffect(() => {
    setIndex(i => {
      if (path === '/local' && i < FIRST_LOCAL_INDEX) return FIRST_LOCAL_INDEX;
      if (path === '/' && i > NEW_GAME_INDEX) return 0;
      const st = STEPS[i];
      if (st && st.kind === 'act') {
        const done =
          st.id === 'new-game'
            ? path === '/local'
            : st.id === 'choose-easy'
              ? difficulty === 'easy'
              : st.id === 'start'
                ? path.startsWith('/game')
                : false;
        if (done) return Math.min(i + 1, STEPS.length - 1);
      }
      return i;
    });
  }, [path, difficulty]);

  // Mide el elemento señalado (con seguimiento de animaciones de entrada).
  useLayoutEffect(() => {
    if (!visible) return;
    const target = step.target;
    if (!target) {
      setRect(null);
      return;
    }
    const measure = () => {
      const el = document.querySelector(`[data-tour="${target}"]`);
      const next = el ? el.getBoundingClientRect() : null;
      setRect(prev => {
        if (!next) return prev;
        if (
          prev &&
          Math.abs(prev.top - next.top) < 0.5 &&
          Math.abs(prev.left - next.left) < 0.5 &&
          Math.abs(prev.width - next.width) < 0.5 &&
          Math.abs(prev.height - next.height) < 0.5
        ) {
          return prev;
        }
        return next;
      });
    };
    measure();
    window.addEventListener('resize', measure);
    let raf = 0;
    const start = performance.now();
    const loop = () => {
      measure();
      if (performance.now() - start < 700) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const interval = window.setInterval(measure, 300);
    return () => {
      window.removeEventListener('resize', measure);
      cancelAnimationFrame(raf);
      clearInterval(interval);
    };
  }, [step.id, step.target, visible]);

  useLayoutEffect(() => {
    if (!panelNode) return;
    const update = () => setPanelSize({ width: panelNode.offsetWidth, height: panelNode.offsetHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(panelNode);
    return () => observer.disconnect();
  }, [panelNode]);

  if (!visible) return null;

  const panelPosition = (() => {
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
  })();

  const placeBelow = panelPosition?.placeBelow ?? (rect ? rect.top + rect.height / 2 < window.innerHeight / 2 : false);
  const isInfo = step.kind === 'info';

  return (
    <>
      {/* Bloquea la interacción mientras solo se explica. */}
      {isInfo && <div className={`fixed inset-0 z-[400] ${!rect ? 'bg-ink-900/85' : ''}`} aria-hidden="true" />}

      {/* Foco sobre el elemento señalado. */}
      <AnimatePresence>
        {rect && (
          <motion.div
            key="spotlight"
            aria-hidden="true"
            className="pointer-events-none fixed z-[401] rounded-[14px]"
            initial={false}
            animate={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={motionT(0.3)}
            style={{ boxShadow: '0 0 0 9999px rgba(13,12,12,0.82), inset 0 0 0 2px rgba(205,197,183,0.85)' }}
          />
        )}
      </AnimatePresence>

      {/* Tarjeta de explicación. */}
      <AnimatePresence mode="wait">
        <motion.div
          ref={panelRef}
          key={step.id}
          initial={{ opacity: 0, y: placeBelow ? -8 : 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, transition: motionT(0.14) }}
          transition={motionT(0.26)}
          role="dialog"
          aria-live="polite"
          style={panelPosition ? { top: panelPosition.top, left: panelPosition.left } : { top: EDGE, left: EDGE }}
          className="fixed z-[402] max-h-[calc(100dvh-1.5rem)] w-[calc(100%-2rem)] max-w-[26rem] overflow-y-auto rounded-[14px] border border-bone/[0.18] bg-ink px-5 py-4 shadow-[0_0.5rem_1.5rem_rgba(0,0,0,0.3)]"
        >
          <div className="font-display font-bold leading-none text-fs-500">{t(`onboarding.steps.${stepIdx}.title`)}</div>
          <p className="mt-2 font-body text-fs-200 leading-[1.45] opacity-80">{renderRich(t(`onboarding.steps.${stepIdx}.body`))}</p>
          <div className="mt-3 flex items-center justify-between gap-3">
            {step.kind === 'act' ? (
              <p className="font-display font-bold text-fs-100 tracking-[0.12em] uppercase text-bone/70">
                {t('common.pressHighlighted')}
              </p>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={completeOnboarding}
                className="cursor-pointer font-display font-bold text-fs-100 uppercase tracking-[0.12em] text-bone/60 underline underline-offset-2 transition-colors duration-[160ms] ease-brand hover:text-bone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bone"
              >
                {t('common.skip')}
              </button>
              {step.kind !== 'act' && (
                <Button size="sm" variant="primary" onClick={() => setIndex(i => i + 1)}>
                  {t('common.next')}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default OnboardingCoach;
