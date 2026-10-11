import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Button from './Button';
import type { PokerState } from '../game/poker';
import { evaluateHand } from '../game/hands';
import { motionT } from '../animations/motion';
import { useI18n, type I18n } from '../i18n';
import { renderRich } from './RichText';
import CoachCard from './CoachCard';
import CoachSpotlight from './CoachSpotlight';
import { useCoachPositioning } from '../hooks/useCoachPositioning';

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
  when?: (s: PokerState) => boolean;
  /** Duración (ms) de una pausa de observación (`watch`). */
  duration?: number;
  /** Paso de acción que se supera al abrirse el panel de subida. */
  waitsForRaise?: boolean;
}

/** El texto de cada paso vive en `tutorial.step.<id>` de los diccionarios. */
const STEP_SEQUENCE: CoachStep[] = [
  { id: 'rules-welcome', kind: 'info' },
  { id: 'welcome', kind: 'info', target: 'human-seat' },
  { id: 'cards', kind: 'info', target: 'human-cards' },
  { id: 'actions', kind: 'info', target: 'actions' },
  { id: 'board', kind: 'info', target: 'board' },
  { id: 'rivals', kind: 'info', target: 'rivals' },
  { id: 'dealer', kind: 'info', target: 'dealer' },
  { id: 'small-blind', kind: 'info', target: 'small-blind' },
  { id: 'big-blind', kind: 'info', target: 'big-blind' },
  { id: 'info-preflop', kind: 'info', target: 'phase' },
  { id: 'gate-preflop', kind: 'gate', when: s => s.phase === 'pre-flop' && s.currentPlayer === 0 && !s.handOver },
  { id: 'sam-called', kind: 'info', target: 'rival-3' },
  { id: 'act-preflop', kind: 'act', target: 'btn-call' },
  { id: 'gate-flop', kind: 'gate', when: s => s.phase === 'flop' && !s.handOver },
  { id: 'info-flop', kind: 'info', target: 'phase' },
  { id: 'watch-flop', kind: 'watch', duration: 1600 },
  { id: 'gate-flop-turn', kind: 'gate', when: s => s.phase === 'flop' && s.currentPlayer === 0 && !s.handOver },
  { id: 'act-flop', kind: 'act', target: 'btn-pass' },
  { id: 'gate-turn', kind: 'gate', when: s => s.phase === 'turn' && !s.handOver },
  { id: 'info-turn', kind: 'info', target: 'phase' },
  { id: 'watch-turn', kind: 'watch', duration: 1600 },
  { id: 'gate-turn-turn', kind: 'gate', when: s => s.phase === 'turn' && s.currentPlayer === 0 && !s.handOver },
  { id: 'act-raise', kind: 'act', target: 'btn-raise', waitsForRaise: true },
  { id: 'raise-panel', kind: 'info', target: 'raise-panel' },
  { id: 'raise-choice', kind: 'act', target: 'raise-panel' },
  { id: 'gate-river', kind: 'gate', when: s => s.phase === 'river' && !s.handOver },
  { id: 'info-river', kind: 'info', target: 'phase' },
  { id: 'watch-river', kind: 'watch', duration: 1600 },
  { id: 'gate-river-turn', kind: 'gate', when: s => s.phase === 'river' && s.currentPlayer === 0 && !s.handOver },
  { id: 'act-river', kind: 'act', target: 'btn-pass' },
  { id: 'gate-showdown', kind: 'gate', when: s => s.handOver },
  { id: 'watch-showdown', kind: 'watch', duration: 1800 },
  { id: 'info-showdown', kind: 'info', target: 'phase' },
  { id: 'info-winner', kind: 'info', target: 'human-seat' },
  { id: 'finish', kind: 'finish' },
];

const SHOWDOWN_INDEX = STEP_SEQUENCE.findIndex(s => s.id === 'gate-showdown');

/** Paso en el que la partida se reanuda para que Sam hable e iguale. */
const RESUME_STEP_ID = 'gate-preflop';

/** Pasos en los que el panel de subida debe estar abierto para explicarlo. */
const RAISE_STEP_IDS = new Set(['raise-panel', 'raise-choice']);

/** Frase que describe el desenlace de la mano. */
function resultSentence(state: PokerState, t: I18n['t']): string {
  const winners = state.winner ?? [];
  if (winners.length === 0) return t('tutorial.resultEmpty');
  const winner = state.players[winners[0]];
  const humanWon = winners.includes(0);
  const hand = winner.cards.length >= 2 ? t(`handName.${evaluateHand(winner.cards, state.community).rank}`) : '';
  if (humanWon) {
    return t('tutorial.resultWon', { hand });
  }
  const name = winner.id === 0 ? t('common.you') : winner.name;
  return hand ? t('tutorial.resultOtherWith', { name, hand }) : t('tutorial.resultOther', { name });
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
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
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

  const { rect, panelRef, panelPosition, placeBelow, edge } = useCoachPositioning({
    stepKey: step.id,
    target: step.target,
  });

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

  const isInfo = step.kind === 'info';
  const hideForRaise = step.kind === 'act' && !!step.waitsForRaise && !!raiseOpen;
  const stepText = (field: 'title' | 'body') => t(`tutorial.step.${step.id}.${field}`);
  const body = step.id === 'info-winner' ? resultSentence(state, t) : stepText('body');
  const showCard = (step.kind === 'info' || step.kind === 'act') && !hideForRaise;

  return (
    <>
      {/* Bloquea la interacción mientras solo se explica o mientras la mesa avanza en una puerta. */}
      {(isInfo || step.kind === 'gate' || step.kind === 'watch') && !hideForRaise && (
        <div className={`fixed inset-0 z-[400] ${isInfo && !rect ? 'bg-ink-900/85' : ''}`} aria-hidden="true" />
      )}

      <CoachSpotlight
        rect={rect}
        hidden={step.kind === 'gate' || step.kind === 'watch' || step.kind === 'finish' || hideForRaise}
      />

      {/* Aviso mientras hablan los rivales. */}
      {(step.kind === 'gate' || step.kind === 'watch') && (
        <div className="pointer-events-none fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-[400] -translate-x-1/2 rounded-pill border border-bone/[0.18] bg-ink-900/85 px-4 py-1.5 font-display font-bold text-fs-100 tracking-[0.14em] uppercase text-bone">
          {t('tutorial.watch')}
        </div>
      )}

      <CoachCard
        visible={showCard}
        stepKey={step.id}
        panelRef={panelRef}
        position={panelPosition}
        placeBelow={placeBelow}
        edge={edge}
        title={stepText('title')}
        body={renderRich(body)}
        act={step.kind === 'act'}
        pressLabel={t('common.pressHighlighted')}
        skipLabel={t('common.skip')}
        onSkip={onFinish}
        primary={
          step.kind !== 'act'
            ? {
                label: step.id === 'info-winner' ? t('common.finish') : t('common.next'),
                onClick: () => setIndex(i => i + 1),
              }
            : undefined
        }
      />

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
              transition={motionT(0.36)}
            >
              <div className="font-display font-bold leading-[0.98] text-fs-600">{t('tutorial.finishTitle')}</div>
              <p className="font-body text-fs-200 leading-[1.5] opacity-75">{renderRich(resultSentence(state, t))}</p>
              <div className="flex w-full flex-col gap-2 pt-1">
                <Button variant="primary" block onClick={onFinish}>{t('tutorial.chooseTable')}</Button>
                <Button variant="outline" block onClick={onRestart}>{t('tutorial.replay')}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TutorialCoach;
