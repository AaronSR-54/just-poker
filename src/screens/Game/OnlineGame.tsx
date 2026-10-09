import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { TURN_DURATION } from './gameConfig';
import { buildGameView } from './gameView';
import HumanCards from './components/HumanCards';
import ScreenMessage from './components/ScreenMessage';
import GameOverlays from './components/GameOverlays';
import MobileGameLayout from './layout/MobileGameLayout';
import DesktopGameLayout from './layout/DesktopGameLayout';
import type { GameLayoutProps } from './layout/types';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useI18n } from '../../i18n';
import { useOnlineGame } from '../../net/useOnlineGame';

/** Mesa online host-autoritativa: el anfitrión ejecuta el motor y reparte el estado. */
const OnlineGame: React.FC<{ roomId: string }> = ({ roomId }) => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isShort = useMediaQuery('(max-height: 720px)');
  const { t } = useI18n();

  const online = useOnlineGame(roomId);
  const state = online.state;

  const [raiseAmount, setRaiseAmount] = useState(20);
  const [showRaise, setShowRaise] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const turnDurationMs = TURN_DURATION * 1000;

  useEffect(() => {
    if (state && raiseAmount < state.minRaise) setRaiseAmount(state.minRaise);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.minRaise]);

  const leave = () => {
    online.leave();
    navigate('/');
  };

  // Auto check/fold si el turno propio expira (el anfitrión además resuelve a los rivales).
  const isMyTurn = Boolean(state && state.currentPlayer === 0 && !state.handOver && !state.streetPending);
  useEffect(() => {
    if (!isMyTurn || settingsOpen || !state) return;
    const id = window.setTimeout(() => {
      const maxBet = Math.max(0, ...state.players.map((p) => p.bet));
      if (state.players[0].bet >= maxBet) online.handleAction('check');
      else online.handleAction('fold');
      setShowRaise(false);
    }, turnDurationMs);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMyTurn, settingsOpen, state?.handNumber, state?.phase]);

  if (online.loading) {
    return <ScreenMessage title={t('online.connectingTable')} />;
  }

  if (online.error || !state) {
    return (
      <ScreenMessage
        title={t('online.loadError')}
        body={online.error ?? t('online.unavailable')}
        action={<Button variant="outline" onClick={leave}>{t('online.back')}</Button>}
      />
    );
  }

  const view = buildGameView(state, {
    potRemaining: null,
    awardProgress: {},
    gameId: 'online',
    isTutorial: false,
    t,
  });
  const { human, handOver } = view;

  const humanCards = (
    <HumanCards
      cards={human.cards}
      handName={view.humanHandName}
      isWinner={view.humanIsWinner}
      dimmed={view.humanCardsDimmed}
      size={isMobile || isShort ? 'md' : 'lg'}
      isDimmed={view.isDimmed}
      handNumber={state.handNumber}
    />
  );

  const humanSeatProps = {
    name: human.name,
    isMobile,
    role: view.humanRole,
    isWinner: view.humanIsWinner,
    folded: human.folded,
    allIn: view.humanAllIn,
    chips: human.chips,
    net: view.humanNet,
    bet: human.bet,
    handOver,
  };

  const actionButtonProps = {
    size: 'sm' as const,
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
    isTutorial: false,
    expectedAction: null,
    showRaise,
    raiseAmount,
    raiseTouched: true,
    onToggleRaise: () => setShowRaise(!showRaise),
    onRaiseChange: setRaiseAmount,
    onRaise: () => {
      online.handleAction('raise', raiseAmount);
      setShowRaise(false);
    },
    onAction: (action: 'fold' | 'check' | 'call' | 'raise') => {
      if (action === 'raise') online.handleAction('raise', raiseAmount);
      else online.handleAction(action);
      setShowRaise(false);
    },
    onNewHand: online.startNewHand,
    newHandEnabled: online.session?.isHost ?? false,
  };

  const noop = () => {};

  const layoutProps: GameLayoutProps = {
    state,
    view,
    aiTurn: null,
    humanCards,
    humanSeatProps,
    actionButtonProps,
    isShort,
    isTablet,
    isTutorial: false,
    gameSpeed: 1,
    settingsOpen,
    turnDurationMs,
    raise: {
      show: showRaise,
      amount: raiseAmount,
      minRaise: state.minRaise,
      maxRaise: view.maxRaise,
      potSize: view.pot,
      playerChips: human.chips,
      callAmount: view.callAmount,
      confirmDisabled: false,
      hideAllIn: false,
      onChange: setRaiseAmount,
      onRaise: () => {
        online.handleAction('raise', raiseAmount);
        setShowRaise(false);
      },
      onClose: () => setShowRaise(false),
    },
    onOpenSettings: () => setSettingsOpen(true),
    gameOverModal: false,
    onRestart: online.restartGame,
    onSelectDifficulty: leave,
    onHome: leave,
    potAward: null,
    onPotAwardLanded: noop,
    onPotAwardDone: noop,
    overlays: (
      <GameOverlays
        context="online"
        settingsOpen={settingsOpen}
        onCloseSettings={() => setSettingsOpen(false)}
        onTutorial={noop}
        onHandsGuide={noop}
        onLeave={leave}
      />
    ),
    tutorial: {
      run: 0,
      onFinish: noop,
      onRestart: noop,
      onResume: noop,
      onRaisePanel: noop,
      onExpectedAction: noop,
      onPause: noop,
    },
  };

  return isMobile ? <MobileGameLayout {...layoutProps} /> : <DesktopGameLayout {...layoutProps} />;
};

export default OnlineGame;
