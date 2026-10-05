import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from './Button';
import type { PokerState } from '../game/poker';
import { evaluateHand } from '../game/hands';
import { t } from '../animations/motion';
import { renderRich } from './RichText';

/* ------------------------------------------------------------------ *
 * Guion de la mano guiada
 *
 * La secuencia alterna pasos informativos (el usuario pulsa «Siguiente»),
 * puertas invisibles (`gate`) que esperan a que la partida avance y pasos de
 * acción (`act`) que avanzan cuando el jugador pulsa un botón real de la mesa.
 * ------------------------------------------------------------------ */

interface CoachStep {
  id: string;
  kind: 'info' | 'act' | 'gate' | 'watch' | 'finish';
  /** Valor del atributo `data-tour` que hay que iluminar. */
  target?: string;
  title?: string;
  body?: string;
  when?: (s: PokerState) => boolean;
  /** Duración (ms) de una pausa de observación (`watch`). */
  duration?: number;
  /** Paso de acción que se supera al abrirse el panel de subida. */
  waitsForRaise?: boolean;
}

const STEP_SEQUENCE: CoachStep[] = [
  { id: 'rules-welcome', kind: 'info', title: 'Cómo se juega', body: 'Estás en una mesa de **Texas Hold’em** contra otros tres rivales y vamos a jugar tu primera mano juntos, paso a paso. En resumen: el bote de cada mano se lo lleva la **mejor combinación** y gana quien termina con todas las fichas.' },
  { id: 'welcome', kind: 'info', target: 'human-seat', title: 'Tu asiento', body: 'Tú te sientas abajo: aquí ves tus **fichas** y tus **cartas**. Los otros tres asientos son rivales controlados por la IA.' },
  { id: 'cards', kind: 'info', target: 'human-cards', title: 'Tus cartas', body: 'Solo tú ves estas dos **cartas**. Con ellas y las cinco comunitarias formarás tu mejor mano de cinco cartas.' },
  { id: 'actions', kind: 'info', target: 'actions', title: 'Tus acciones', body: 'Estos son los cuatro botones del turno: **«Pasar»** (seguir sin apostar), **«Igualar»** (poner lo mismo que la apuesta mayor), **«Subir»** (apostar más) y **«Retirarse»** (abandonar la mano). Te iré diciendo cuál pulsar.' },
  { id: 'board', kind: 'info', target: 'board', title: 'El centro de la mesa', body: 'Aquí aparecerán las cinco **cartas comunitarias**. El número del centro es el **bote**: todas las fichas apostadas en la mano.' },
  { id: 'rivals', kind: 'info', target: 'rivals', title: 'Tres rivales', body: 'Cada rival empieza con 1.000 fichas y juega a su manera. En esta mesa son **Mia, Dan y Sam**.' },
  { id: 'dealer', kind: 'info', target: 'dealer', title: 'La ficha de dealer', body: 'La ficha «D» marca quién reparte y dónde empiezan las posiciones. Rota una casilla en cada mano; esta primera mano **repartes tú**.' },
  { id: 'small-blind', kind: 'info', target: 'small-blind', title: 'La ciega pequeña (SB)', body: 'Antes de repartir, el jugador a la izquierda del dealer pone la **ciega pequeña**: 10 fichas obligatorias. Aquí las pone Mia.' },
  { id: 'big-blind', kind: 'info', target: 'big-blind', title: 'La ciega grande (BB)', body: 'El siguiente jugador pone la **ciega grande**: 20 fichas. Las dos ciegas ya están en el bote (30) y abren la ronda de apuestas.' },
  { id: 'info-preflop', kind: 'info', target: 'phase', title: 'El preflop', body: 'Es la primera ronda de apuestas: cada jugador decide con solo sus dos **cartas privadas**, antes de que aparezca ninguna comunitaria. Las ciegas ya dejaron 30 fichas en el bote.' },
  { id: 'gate-preflop', kind: 'gate', when: s => s.phase === 'pre-flop' && s.currentPlayer === 0 && !s.handOver },
  { id: 'sam-called', kind: 'info', target: 'rival-3', title: 'Sam ha igualado', body: 'Sam, el primero en hablar, ha puesto las mismas 20 fichas que la ciega grande para seguir en la mano. Eso es **«igualar»**. Ahora te toca a ti.' },
  { id: 'act-preflop', kind: 'act', target: 'btn-call', title: 'Tu turno (preflop)', body: 'Tienes 20 fichas por igualar para ver el flop. Pulsa **«Igualar 20»**.' },
  { id: 'gate-flop', kind: 'gate', when: s => s.phase === 'flop' && !s.handOver },
  { id: 'info-flop', kind: 'info', target: 'phase', title: 'El flop', body: 'Se destapan tres **cartas comunitarias** y empieza otra ronda de apuestas.' },
  { id: 'watch-flop', kind: 'watch', duration: 1600 },
  { id: 'gate-flop-turn', kind: 'gate', when: s => s.phase === 'flop' && s.currentPlayer === 0 && !s.handOver },
  { id: 'act-flop', kind: 'act', target: 'btn-pass', title: 'Habla el flop', body: 'Nadie ha apostado todavía: pasa gratis con **«Pasar»**.' },
  { id: 'gate-turn', kind: 'gate', when: s => s.phase === 'turn' && !s.handOver },
  { id: 'info-turn', kind: 'info', target: 'phase', title: 'El turn', body: 'Llega la **cuarta carta comunitaria**. Otra ronda de apuestas.' },
  { id: 'watch-turn', kind: 'watch', duration: 1600 },
  { id: 'gate-turn-turn', kind: 'gate', when: s => s.phase === 'turn' && s.currentPlayer === 0 && !s.handOver },
  { id: 'act-raise', kind: 'act', target: 'btn-raise', waitsForRaise: true, title: 'Tu turno (turn)', body: 'Es tu turno y tienes el **trío de ases**. Pulsa **«Subir»** para abrir las opciones de apuesta.' },
  { id: 'raise-panel', kind: 'info', target: 'raise-panel', title: 'Atajos y deslizador', body: 'Los **atajos** fijan la apuesta de un toque: **Min** (el mínimo), **½** (medio bote), **Bote** y **All-in**. Con el **deslizador** la ajustas con precisión entre el mínimo y el máximo.' },
  { id: 'raise-choice', kind: 'act', target: 'raise-panel', title: 'Elige y sube', body: 'Pulsa un **atajo** o mueve el **deslizador**, y luego pulsa el botón **«Subir»** para confirmar la apuesta.' },
  { id: 'gate-river', kind: 'gate', when: s => s.phase === 'river' && !s.handOver },
  { id: 'info-river', kind: 'info', target: 'phase', title: 'El river', body: 'La **quinta y última carta comunitaria**. Después de esta ronda ya no quedan más cartas.' },
  { id: 'watch-river', kind: 'watch', duration: 1600 },
  { id: 'gate-river-turn', kind: 'gate', when: s => s.phase === 'river' && s.currentPlayer === 0 && !s.handOver },
  { id: 'act-river', kind: 'act', target: 'btn-pass', title: 'Habla el river', body: 'Pasa una vez más y llegamos al **final de la mano**.' },
  { id: 'gate-showdown', kind: 'gate', when: s => s.handOver },
  { id: 'watch-showdown', kind: 'watch', duration: 1800 },
  { id: 'info-showdown', kind: 'info', target: 'phase', title: 'El showdown', body: 'Se comparan las manos. Quien forme la **mejor combinación de cinco cartas** se lleva el bote. Puedes repasar todas las combinaciones en la **guía de manos**, disponible en el menú del juego.' },
  { id: 'info-winner', kind: 'info', target: 'human-seat', title: 'Resultado' },
  { id: 'finish', kind: 'finish' },
];

const SHOWDOWN_INDEX = STEP_SEQUENCE.findIndex(s => s.id === 'gate-showdown');

/** Paso en el que la partida se reanuda para que Sam hable e iguale. */
const RESUME_STEP_ID = 'gate-preflop';

/** Pasos en los que el panel de subida debe estar abierto para explicarlo. */
const RAISE_STEP_IDS = new Set(['raise-panel', 'raise-choice']);

/** Frase que describe el desenlace de la mano. */
function resultSentence(state: PokerState): string {
  const winners = state.winner ?? [];
  if (winners.length === 0) return 'La mano ha terminado.';
  const winner = state.players[winners[0]];
  const humanWon = winners.includes(0);
  const hand = winner.cards.length >= 2 ? evaluateHand(winner.cards, state.community).name : '';
  if (humanWon) {
    return `¡Has ganado el bote con **${hand}**! Tus dos ases más el as del flop forman un trío: fíjate cómo se iluminan las cartas ganadoras.`;
  }
  return `${winner.name} se lleva el bote${hand ? ` con **${hand}**` : ''}. La próxima será tuya.`;
}

interface TutorialCoachProps {
  state: PokerState;
  onFinish: () => void;
  onRestart: () => void;
  /** Avisa a la mesa de que puede reanudar la partida (cuando toca explicar la igualada de Sam). */
  onResume?: () => void;
  /** Abre o cierra el panel de subida para explicarlo. */
  onRaisePanel?: (open: boolean) => void;
  /** Indica qué botón debe usar el jugador en el paso actual (o null). */
  onExpectedAction?: (action: 'call' | 'check' | 'raise' | null) => void;
  /** Si el panel de subida está abierto (oculta la tarjeta mientras el jugador lo usa). */
  raiseOpen?: boolean;
  /** Avisa de si la mesa debe quedar en pausa (mientras se muestra una tarjeta explicativa). */
  onPause?: (paused: boolean) => void;
}

const TutorialCoach: React.FC<TutorialCoachProps> = ({ state, onFinish, onRestart, onResume, onRaisePanel, onExpectedAction, raiseOpen, onPause }) => {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [panelSize, setPanelSize] = useState({ width: 0, height: 0 });
  const [panelNode, setPanelNode] = useState<HTMLDivElement | null>(null);
  const panelRef = useCallback((node: HTMLDivElement | null) => setPanelNode(node), []);
  const step = STEP_SEQUENCE[index];

  // Resuelve puertas consecutivas cuando la partida cumple su condición.
  useEffect(() => {
    let i = index;
    while (i < STEP_SEQUENCE.length && STEP_SEQUENCE[i].kind === 'gate' && STEP_SEQUENCE[i].when?.(state)) i++;
    if (i !== index) setIndex(i);
  }, [state, index]);

  // Si la mano acaba antes de tiempo, salta directamente al showdown.
  useEffect(() => {
    if (!state.handOver) return;
    setIndex(i => (i < SHOWDOWN_INDEX ? SHOWDOWN_INDEX : i));
  }, [state.handOver]);

  // Los pasos de acción se superan cuando el jugador actúa de verdad.
  useEffect(() => {
    if (step.kind !== 'act') return;
    const done = step.waitsForRaise ? !!raiseOpen : state.currentPlayer !== 0 || state.handOver;
    if (done) setIndex(i => i + 1);
  }, [state.currentPlayer, state.handOver, step.kind, step.waitsForRaise, raiseOpen]);

  // Las pausas de observación avanzan solas tras unos instantes.
  useEffect(() => {
    if (step.kind !== 'watch') return;
    const timer = window.setTimeout(() => setIndex(i => i + 1), step.duration ?? 1500);
    return () => window.clearTimeout(timer);
  }, [step.kind, step.id, step.duration]);

  // DEBUG temporal: navega entre pasos con Ctrl + ←/→.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setIndex(i => Math.min(i + 1, STEP_SEQUENCE.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIndex(i => Math.max(i - 1, 0));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Mide el elemento señalado para dibujar el foco.
  useLayoutEffect(() => {
    const target = step.target;
    if (!target) {
      setRect(null);
      return;
    }
    const measure = () => {
      const el = document.querySelector(`[data-tour="${target}"]`);
      const next = el ? el.getBoundingClientRect() : null;
      setRect(prev => {
        // Ignora lecturas nulas transitorias (evita saltar al centro).
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
    // Sigue la animación de entrada del objetivo (p. ej. el panel de subida recién abierto).
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
  }, [step.id, step.target]);

  // La partida permanece en pausa hasta el paso en el que Sam debe igualar.
  useEffect(() => {
    if (step.id === RESUME_STEP_ID) onResume?.();
  }, [step.id, onResume]);

  // Abre el panel de subida solo mientras se explican sus controles.
  useEffect(() => {
    onRaisePanel?.(RAISE_STEP_IDS.has(step.id));
  }, [step.id, onRaisePanel]);

  // Congela la mesa mientras se lee una tarjeta, para que la acción no adelante a la explicación.
  useEffect(() => {
    onPause?.(step.kind === 'info');
  }, [step.kind, onPause]);

  // Comunica qué botón debe pulsar el jugador en los pasos de acción.
  useEffect(() => {
    if (!onExpectedAction) return;
    const map: Record<string, 'call' | 'check' | 'raise'> = {
      'btn-call': 'call',
      'btn-pass': 'check',
      'btn-raise': 'raise',
    };
    onExpectedAction(step.kind === 'act' ? map[step.target ?? ''] ?? null : null);
  }, [step.kind, step.target, onExpectedAction]);

  // Mide el panel para colocarlo junto al elemento señalado sin salirse de pantalla.
  useLayoutEffect(() => {
    if (!panelNode) return;
    const update = () => setPanelSize({ width: panelNode.offsetWidth, height: panelNode.offsetHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(panelNode);
    return () => observer.disconnect();
  }, [panelNode]);

  const EDGE = 12;
  const GAP = 12;

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
  const hideForRaise = step.kind === 'act' && !!step.waitsForRaise && !!raiseOpen;
  const body = step.id === 'info-winner' ? resultSentence(state) : (step.body ?? '');

  return (
    <>
      {/* Bloquea la interacción mientras solo se explica o mientras la mesa avanza en una puerta. */}
      {(isInfo || step.kind === 'gate' || step.kind === 'watch') && !hideForRaise && (
        <div className={`fixed inset-0 z-[400] ${isInfo && !rect ? 'bg-ink-900/85' : ''}`} aria-hidden="true" />
      )}

      {/* Foco sobre el elemento señalado. */}
      <AnimatePresence>
        {rect && step.kind !== 'gate' && step.kind !== 'watch' && step.kind !== 'finish' && !hideForRaise && (
          <motion.div
            key="spotlight"
            aria-hidden="true"
            className="pointer-events-none fixed z-[401] rounded-[14px]"
            initial={false}
            animate={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={t(0.3)}
            style={{
              boxShadow: '0 0 0 9999px rgba(13,12,12,0.82), inset 0 0 0 2px rgba(205,197,183,0.85)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Aviso mientras hablan los rivales. */}
      {(step.kind === 'gate' || step.kind === 'watch') && (
        <div className="pointer-events-none fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-[400] -translate-x-1/2 rounded-pill border border-bone/[0.18] bg-ink-900/85 px-4 py-1.5 font-display font-bold text-fs-100 tracking-[0.14em] uppercase text-bone">
          Observa la mesa…
        </div>
      )}

      {/* Tarjeta de explicación. */}
      <AnimatePresence mode="wait">
        {(step.kind === 'info' || step.kind === 'act') && !hideForRaise && (
          <motion.div
            ref={panelRef}
            key={step.id}
            initial={{ opacity: 0, y: placeBelow ? -8 : 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, transition: t(0.14) }}
            transition={t(0.26)}
            role="dialog"
            aria-live="polite"
            style={panelPosition ? { top: panelPosition.top, left: panelPosition.left } : { top: EDGE, left: EDGE }}
            className="fixed z-[402] max-h-[calc(100dvh-1.5rem)] w-[calc(100%-2rem)] max-w-[26rem] overflow-y-auto rounded-[14px] border border-bone/[0.18] bg-ink px-5 py-4 shadow-[0_0.5rem_1.5rem_rgba(0,0,0,0.3)]"
          >
            <div className="font-display font-bold leading-none text-fs-500">{step.title}</div>
            <p className="mt-2 font-body text-fs-200 leading-[1.45] opacity-80">{renderRich(body)}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              {step.kind === 'act' ? (
                <p className="font-display font-bold text-fs-100 tracking-[0.12em] uppercase text-bone/70">
                  Pulsa el botón iluminado.
                </p>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={onFinish}
                  className="cursor-pointer font-display font-bold text-fs-100 uppercase tracking-[0.12em] text-bone/60 underline underline-offset-2 transition-colors duration-[160ms] ease-brand hover:text-bone focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bone"
                >
                  Omitir
                </button>
                {step.kind !== 'act' && (
                  <Button size="sm" variant="primary" onClick={() => setIndex(i => i + 1)}>
                    {step.id === 'info-winner' ? 'Terminar' : 'Siguiente'}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cierre del tutorial. */}
      <AnimatePresence>
        {step.kind === 'finish' && (
          <motion.div
            className="fixed inset-0 z-[410] flex items-center justify-center bg-ink-900/85 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="flex w-full max-w-[26rem] flex-col items-center gap-4 rounded-[14px] border border-bone/[0.18] bg-ink px-8 py-8 text-center"
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              transition={t(0.36)}
            >
              <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">Mano guiada completada</div>
              <div className="font-display font-bold leading-[0.98] text-fs-600">Ya sabes jugar una mano</div>
              <p className="font-body text-fs-200 leading-[1.5] opacity-75">{renderRich(resultSentence(state))}</p>
              <div className="flex w-full flex-col gap-2 pt-1">
                <Button variant="primary" block onClick={onFinish}>Elegir mesa y jugar</Button>
                <Button variant="outline" block onClick={onRestart}>Repetir la mano</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TutorialCoach;
