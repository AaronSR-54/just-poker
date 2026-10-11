import type { PokerState } from '../../../game/poker';
import type { GameView } from '../gameView';
import type { HumanSeatProps } from '../components/HumanSeat';
import type { ActionButtonsProps } from '../components/ActionButtons';
import type { GameLayoutProps } from './types';

/** Props del asiento humano a partir de la vista, compartidas por local y online. */
export function buildHumanSeatProps({
  view,
  isMobile,
}: {
  view: GameView;
  isMobile: boolean;
}): HumanSeatProps {
  const { human, handOver } = view;
  return {
    name: human.name,
    isMobile,
    role: view.humanRole,
    isWinner: view.humanIsWinner,
    folded: human.folded,
    allIn: view.humanAllIn,
    chips: view.displayedChips(0, human.chips),
    net: view.humanNet,
    bet: human.bet,
    handOver,
  };
}

/** Partes de los botones de acción que dependen de la partida (local u online). */
export interface ActionButtonInput {
  isTutorial: boolean;
  expectedAction: ActionButtonsProps['expectedAction'];
  raiseTouched: boolean;
  onToggleRaise: () => void;
  onAction: (action: 'fold' | 'check' | 'call' | 'raise') => void;
  onNewHand: () => void;
  newHandEnabled?: boolean;
}

export function buildActionButtonProps({
  state,
  view,
  raise,
  action,
}: {
  state: PokerState;
  view: GameView;
  raise: GameLayoutProps['raise'];
  action: ActionButtonInput;
}): ActionButtonsProps {
  const { human, handOver } = view;
  return {
    size: 'sm',
    handOver,
    gameOver: state.gameOver,
    activePlayer: view.activePlayer,
    streetPending: view.streetPending,
    canCheck: view.canCheck,
    canRaise: view.canRaise,
    callAmount: view.callAmount,
    playerChips: human.chips,
    minRaise: state.minRaise,
    maxRaise: view.maxRaise,
    pot: view.pot,
    isTutorial: action.isTutorial,
    expectedAction: action.expectedAction,
    showRaise: raise.show,
    raiseAmount: raise.amount,
    raiseTouched: action.raiseTouched,
    onToggleRaise: action.onToggleRaise,
    onRaiseChange: raise.onChange,
    onRaise: raise.onRaise,
    onAction: action.onAction,
    onNewHand: action.onNewHand,
    newHandEnabled: action.newHandEnabled,
  };
}

/** Campos comunes de la mesa (local u online). El resto los aporta cada pantalla. */
export type GameLayoutCommonProps = Pick<
  GameLayoutProps,
  | 'isShort'
  | 'isTablet'
  | 'gameSpeed'
  | 'settingsOpen'
  | 'turnDurationMs'
  | 'turnRemainingMs'
  | 'rivalTurn'
  | 'humanCards'
  | 'raise'
  | 'onOpenSettings'
  | 'gameOverModal'
  | 'onRestart'
  | 'onHome'
  | 'gameOverRestartLabel'
  | 'gameOverRestartDisabled'
  | 'gameOverWaitingLabel'
  | 'potAward'
  | 'onPotAwardLanded'
  | 'onPotAwardDone'
  | 'overlays'
  | 'tutorial'
  | 'onSelectDifficulty'
>;

/** Ensambla las props de los layouts a partir del estado, la vista y los campos de cada pantalla. */
export function buildGameLayoutProps({
  state,
  view,
  isMobile,
  action,
  common,
}: {
  state: PokerState;
  view: GameView;
  isMobile: boolean;
  action: ActionButtonInput;
  common: GameLayoutCommonProps;
}): GameLayoutProps {
  return {
    state,
    view,
    ...common,
    humanSeatProps: buildHumanSeatProps({ view, isMobile }),
    actionButtonProps: buildActionButtonProps({ state, view, raise: common.raise, action }),
    isTutorial: action.isTutorial,
  };
}
