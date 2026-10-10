import type React from 'react';
import type { PokerState } from '../../../game/poker';
import type { PotAwardData } from '../../../components/PotAward';
import type { GameView } from '../gameView';
import type { HumanSeatProps } from '../components/HumanSeat';
import type { ActionButtonsProps } from '../components/ActionButtons';

/** Props compartidas por los layouts móvil y desktop de la mesa. */
export interface GameLayoutProps {
  state: PokerState;
  view: GameView;
  /** Turno en curso de un rival (IA en local, jugador remoto en online) para la barra de tiempo. */
  rivalTurn: { playerIndex: number; duration: number } | null;
  humanCards: React.ReactNode;
  humanSeatProps: HumanSeatProps;
  actionButtonProps: ActionButtonsProps;
  isShort: boolean;
  isTablet: boolean;
  isTutorial: boolean;
  gameSpeed: number;
  settingsOpen: boolean;
  turnDurationMs: number;
  raise: {
    show: boolean;
    amount: number;
    minRaise: number;
    maxRaise: number;
    potSize: number;
    playerChips: number;
    callAmount: number;
    confirmDisabled: boolean;
    hideAllIn: boolean;
    onChange: (v: number) => void;
    onRaise: () => void;
    onClose: () => void;
  };
  onOpenSettings: () => void;
  gameOverModal: boolean;
  onRestart: () => void;
  onSelectDifficulty?: () => void;
  onHome: () => void;
  gameOverRestartLabel?: string;
  gameOverRestartDisabled?: boolean;
  gameOverWaitingLabel?: string;
  potAward: PotAwardData | null;
  onPotAwardLanded: (id: number, value: number) => void;
  onPotAwardDone: () => void;
  overlays: React.ReactNode;
  tutorial: {
    run: number;
    onFinish: () => void;
    onRestart: () => void;
    onResume: () => void;
    onRaisePanel: (open: boolean) => void;
    onExpectedAction: (a: 'call' | 'check' | 'raise' | null) => void;
    onPause: (paused: boolean) => void;
  };
}
