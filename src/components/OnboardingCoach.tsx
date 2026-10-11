import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { renderRich } from './RichText';
import CoachCard from './CoachCard';
import CoachSpotlight from './CoachSpotlight';
import { useUserStore } from '../store/userStore';
import { useOnboardingStore } from '../store/onboardingStore';
import { useCoachPositioning } from '../hooks/useCoachPositioning';
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

const OnboardingCoach: React.FC = () => {
  const location = useLocation();
  const completed = useUserStore(s => s.onboardingCompleted);
  const completeOnboarding = useUserStore(s => s.completeOnboarding);
  const difficulty = useOnboardingStore(s => s.difficulty);
  const { t } = useI18n();

  const [index, setIndex] = useState(0);

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

  const { rect, panelRef, panelPosition, placeBelow, edge } = useCoachPositioning({
    stepKey: step.id,
    target: step.target,
    active: visible,
  });

  if (!visible) return null;

  const isInfo = step.kind === 'info';

  return (
    <>
      {/* Bloquea la interacción mientras solo se explica. */}
      {isInfo && <div className={`fixed inset-0 z-[400] ${!rect ? 'bg-ink-900/85' : ''}`} aria-hidden="true" />}

      <CoachSpotlight rect={rect} />

      <CoachCard
        visible
        stepKey={step.id}
        panelRef={panelRef}
        position={panelPosition}
        placeBelow={placeBelow}
        edge={edge}
        title={t(`onboarding.steps.${stepIdx}.title`)}
        body={renderRich(t(`onboarding.steps.${stepIdx}.body`))}
        act={step.kind === 'act'}
        pressLabel={t('common.pressHighlighted')}
        skipLabel={t('common.skip')}
        onSkip={completeOnboarding}
        primary={step.kind !== 'act' ? { label: t('common.next'), onClick: () => setIndex(i => i + 1) } : undefined}
      />
    </>
  );
};

export default OnboardingCoach;
