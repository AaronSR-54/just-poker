import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { TURN_DURATION, SHOWDOWN_HOLD_MS } from './gameConfig';
import { buildGameView, isHumanEliminated } from './gameView';
import HumanCards from './components/HumanCards';
import ScreenMessage from './components/ScreenMessage';
import GameOverlays from './components/GameOverlays';
import MobileGameLayout from './layout/MobileGameLayout';
import DesktopGameLayout from './layout/DesktopGameLayout';
import type { GameLayoutProps } from './layout/types';
import { buildGameLayoutProps } from './layout/buildGameLayoutProps';
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
  const isShort = useMediaQuery('(max-height: 860px)');
  const { t } = useI18n();

  const online = useOnlineGame(roomId);
  const state = online.state;

  const [finalDurationMs, setFinalDurationMs] = useState(0);
  const [raiseAmount, setRaiseAmount] = useState(20);
  const [showRaise, setShowRaise] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gameOverModal, setGameOverModal] = useState(false);
  const [eliminationModal, setEliminationModal] = useState(false);
  /** Hay un aviso de eliminación pendiente de mostrar. */
  const [eliminationPending, setEliminationPending] = useState(false);
  /** El eliminado ya eligió quedarse: el aviso no vuelve a abrirse. */
  const [staySpectating, setStaySpectating] = useState(false);
  const gameOverTimerRef = useRef<number | null>(null);
  const eliminationTimerRef = useRef<number | null>(null);
  const autoDealTimerRef = useRef<number | null>(null);
  const autoDealHandRef = useRef<number | null>(null);

  const turnDurationMs = TURN_DURATION * 1000;
  const isHost = online.session?.isHost ?? false;
  const { startNewHand: dealNextHand } = online;

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

  const startNewHand = useCallback(() => {
    resetPotAward();
    dealNextHand();
  }, [resetPotAward, dealNextHand]);

  const restartGame = () => {
    resetPotAward();
    setPotRemaining(null);
    autoDealHandRef.current = null;
    online.restartGame();
  };

  // Auto check/fold si el turno propio expira (el anfitrión además resuelve a los rivales).
  const isMyTurn = Boolean(state && state.currentPlayer === 0 && !state.handOver && !state.streetPending);
  const { remainingMs: turnRemainingMs } = useTurnCountdown({
    active: isMyTurn,
    settingsOpen,
    turnDurationMs,
    turnKey: `${state?.handNumber ?? 0}-${state?.phase ?? ''}`,
    onExpire: () => {
      if (!state) return;
      const maxBet = Math.max(0, ...state.players.map((p) => p.bet));
      if (state.players[0].bet >= maxBet) online.handleAction('check');
      else online.handleAction('fold');
      setShowRaise(false);
    },
  });

  // Barra de tiempo del rival activo (turno remoto gestionado por el anfitrión).
  const rivalActive = Boolean(state && !state.handOver && !state.streetPending && !state.gameOver && state.currentPlayer !== 0);
  const { remainingMs: rivalRemainingMs } = useTurnCountdown({
    active: rivalActive,
    settingsOpen,
    turnDurationMs,
    turnKey: `${state?.handNumber ?? 0}-${state?.phase ?? ''}-${state?.currentPlayer ?? 0}`,
    onExpire: () => {},
  });

  // Fin real de la partida (solo queda uno con fichas) frente a la eliminación
  // del humano mientras los demás siguen jugando.
  const gameOverForAll = Boolean(state?.gameOver);
  const eliminatedForHuman = Boolean(
    state && !state.gameOver && state.handOver && isHumanEliminated(state),
  );
  const spectating = Boolean(state && !state.gameOver && isHumanEliminated(state));

  // Eliminación: el aviso queda pendiente desde que el humano se queda sin
  // fichas y sobrevive al reparto de la siguiente mano (el humano sigue fuera).
  // Se reinicia si vuelve a jugar (revancha).
  useEffect(() => {
    if (!spectating) {
      setEliminationPending(false);
      setEliminationModal(false);
      setStaySpectating(false);
      return;
    }
    if (eliminatedForHuman) setEliminationPending(true);
  }, [spectating, eliminatedForHuman]);

  useEffect(() => {
    if (!eliminationPending || staySpectating || settingsOpen) return;
    if (eliminationTimerRef.current !== null) return;
    eliminationTimerRef.current = window.setTimeout(() => {
      eliminationTimerRef.current = null;
      setEliminationModal(true);
    }, SHOWDOWN_HOLD_MS);
    return () => {
      if (eliminationTimerRef.current !== null) {
        window.clearTimeout(eliminationTimerRef.current);
        eliminationTimerRef.current = null;
      }
    };
  }, [eliminationPending, staySpectating, settingsOpen]);

  // Fin de partida: espera a que se vea el showdown y el reparto del bote antes
  // de abrir el modal. Se cancela si aún queda partida o si Ajustes está abierto.
  useEffect(() => {
    if (!gameOverForAll || settingsOpen) {
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
      setEliminationModal(false);
      setGameOverModal(true);
    }, SHOWDOWN_HOLD_MS);
    return () => {
      if (gameOverTimerRef.current) {
        window.clearTimeout(gameOverTimerRef.current);
        gameOverTimerRef.current = null;
      }
    };
  }, [gameOverForAll, settingsOpen]);

  // Anfitrión eliminado: reparte la siguiente mano tras el showdown para que los
  // amigos no esperen a que pulse «Nueva mano».
  useEffect(() => {
    if (!isHost || !spectating || !state?.handOver || gameOverForAll) return;
    const hand = state.handNumber;
    if (autoDealHandRef.current === hand) return;
    if (autoDealTimerRef.current !== null) return;
    autoDealTimerRef.current = window.setTimeout(() => {
      autoDealTimerRef.current = null;
      autoDealHandRef.current = hand;
      startNewHand();
    }, SHOWDOWN_HOLD_MS);
    return () => {
      if (autoDealTimerRef.current !== null) {
        window.clearTimeout(autoDealTimerRef.current);
        autoDealTimerRef.current = null;
      }
    };
  }, [isHost, spectating, state?.handOver, state?.handNumber, gameOverForAll, startNewHand]);

  // Congela la duración compartida al terminar la partida, antes de abrir el modal.
  useEffect(() => {
    if (!gameOverForAll) return;
    const startedAt = online.gameStartedAt;
    setFinalDurationMs(startedAt != null ? Date.now() - startedAt : 0);
  }, [gameOverForAll, online.gameStartedAt]);

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
  const { human } = view;

  // Barra de tiempo del rival activo (turno remoto gestionado por el anfitrión).
  const rivalTurn = rivalActive
    ? { playerIndex: state.currentPlayer, duration: turnDurationMs, remainingMs: rivalRemainingMs }
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

  const noop = () => {};

  const raise = {
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
  };

  const layoutProps: GameLayoutProps = buildGameLayoutProps({
    state,
    view,
    isMobile,
    action: {
      isTutorial: false,
      expectedAction: null,
      raiseTouched: true,
      onToggleRaise: () => setShowRaise(!showRaise),
      onAction: (action) => {
        if (action === 'raise') online.handleAction('raise', raiseAmount);
        else online.handleAction(action);
        setShowRaise(false);
      },
      onNewHand: startNewHand,
      newHandEnabled: isHost,
      spectating,
    },
    common: {
      isShort,
      isTablet,
      gameSpeed: 1,
      settingsOpen,
      turnDurationMs,
      turnRemainingMs,
      rivalTurn,
      humanCards,
      raise,
      onOpenSettings: () => setSettingsOpen(true),
      gameOverModal,
      gameOverDurationMs: finalDurationMs,
      onRestart: restartGame,
      onSelectDifficulty: undefined,
      onHome: leave,
      gameOverRestartLabel: t('game.rematch'),
      gameOverRestartDisabled: !isHost,
      gameOverWaitingLabel: t('game.waitingHost'),
      potAward,
      onPotAwardLanded: handlePotAwardLanded,
      onPotAwardDone: finishPotAward,
      elimination: {
        open: eliminationModal,
        onStay: () => {
          setStaySpectating(true);
          setEliminationModal(false);
        },
        onLeave: leave,
      },
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
    },
  });

  return isMobile ? <MobileGameLayout {...layoutProps} /> : <DesktopGameLayout {...layoutProps} />;
};

export default OnlineGame;
