import React, { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { TURN_DURATION, GAME_OVER_DELAY } from './gameConfig';
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
import { usePotAward } from './hooks/usePotAward';
import { useTurnCountdown } from './hooks/useTurnCountdown';
import { useGameSounds } from '../../hooks/useGameSounds';

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
  const [gameOverModal, setGameOverModal] = useState(false);
  const gameOverTimerRef = useRef<number | null>(null);

  const turnDurationMs = TURN_DURATION * 1000;
  const isHost = online.session?.isHost ?? false;

  useGameSounds(state);

  const {
    potAward,
    awardProgress,
    potRemaining,
    setPotRemaining,
    handlePotAwardLanded,
    finishPotAward,
    resetPotAward,
  } = usePotAward(state);

  useEffect(() => {
    if (state && raiseAmount < state.minRaise) setRaiseAmount(state.minRaise);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.minRaise]);

  const leave = () => {
    online.leave();
    // `replace` para no dejar la URL muerta de la partida en el historial:
    // al volver atrás se regresa a la sala, no a un juego sin sesión.
    navigate('/', { replace: true });
  };

  const startNewHand = () => {
    resetPotAward();
    online.startNewHand();
  };

  const restartGame = () => {
    resetPotAward();
    setPotRemaining(null);
    online.restartGame();
  };

  // Auto check/fold si el turno propio expira (el anfitrión además resuelve a los rivales).
  const isMyTurn = Boolean(state && state.currentPlayer === 0 && !state.handOver && !state.streetPending);
  useTurnCountdown({
    active: isMyTurn,
    settingsOpen,
    turnDurationMs,
    initialSeconds: TURN_DURATION,
    turnKey: `${state?.handNumber ?? 0}-${state?.phase ?? ''}`,
    onExpire: () => {
      if (!state) return;
      const maxBet = Math.max(0, ...state.players.map((p) => p.bet));
      if (state.players[0].bet >= maxBet) online.handleAction('check');
      else online.handleAction('fold');
      setShowRaise(false);
    },
  });

  // Fin de partida: deja ver el showdown antes de abrir el overlay. Si aún
  // queda partida, ocúltalo de inmediato.
  const gameOverForHuman = Boolean(
    state &&
    (state.gameOver ||
      (state.handOver && (state.players[0].chips <= 0 || state.players[0].eliminated)))
  );

  useEffect(() => {
    if (!gameOverForHuman || settingsOpen) {
      setGameOverModal(false);
      if (gameOverTimerRef.current) {
        window.clearTimeout(gameOverTimerRef.current);
        gameOverTimerRef.current = null;
      }
      return;
    }
    if (gameOverTimerRef.current) return;
    gameOverTimerRef.current = window.setTimeout(() => {
      gameOverTimerRef.current = null;
      setGameOverModal(true);
    }, GAME_OVER_DELAY);
    return () => {
      if (gameOverTimerRef.current) {
        window.clearTimeout(gameOverTimerRef.current);
        gameOverTimerRef.current = null;
      }
    };
  }, [gameOverForHuman, settingsOpen]);

  if (online.loading) {
    return <ScreenMessage title={t('online.connectingTable')} />;
  }

  // Sin sesión (p. ej. al volver atrás o recargar tras salir): vuelve a la sala
  // para poder reincorporarse en lugar de dejar una pantalla sin salida.
  if (!online.session) {
    return <Navigate to="/online" replace />;
  }

  // Ya unido a la sala pero sin el primer estado del anfitrión: mantén
  // "conectando" en vez de mostrar un error inexistente (parpadeo en móvil).
  if (!state && !online.error) {
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
    potRemaining,
    awardProgress,
    gameId: 'online',
    isTutorial: false,
    t,
  });
  const { human, handOver } = view;

  // Barra de tiempo del rival activo (turno remoto gestionado por el anfitrión).
  const rivalTurn = !handOver && !view.streetPending && !state.gameOver && view.activePlayer !== 0
    ? { playerIndex: view.activePlayer, duration: turnDurationMs }
    : null;

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
    chips: view.displayedChips(0, human.chips),
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
    onNewHand: startNewHand,
    newHandEnabled: isHost,
  };

  const noop = () => {};

  const layoutProps: GameLayoutProps = {
    state,
    view,
    rivalTurn,
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
    gameOverModal,
    onRestart: restartGame,
    onSelectDifficulty: undefined,
    onHome: leave,
    gameOverRestartLabel: t('game.rematch'),
    gameOverRestartDisabled: !isHost,
    gameOverWaitingLabel: t('game.waitingHost'),
    potAward,
    onPotAwardLanded: handlePotAwardLanded,
    onPotAwardDone: finishPotAward,
    overlays: (
      <GameOverlays
        context="online"
        settingsOpen={settingsOpen}
        onCloseSettings={() => setSettingsOpen(false)}
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
