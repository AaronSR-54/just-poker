import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../../components/Button';
import { TURN_DURATION, GAME_OVER_DELAY } from './gameConfig';
import { useLocalGameInit } from './hooks/useLocalGameInit';
import { useCommitState } from './hooks/useCommitState';
import { useTurnTimer } from './hooks/useTurnTimer';
import { useAiTurns } from './hooks/useAiTurns';
import { usePotAward } from './hooks/usePotAward';
import { useTutorialRun } from './hooks/useTutorialRun';
import { buildGameView, maxRaiseFor } from './gameView';
import HumanCards from './components/HumanCards';
import ScreenMessage from './components/ScreenMessage';
import GameOverlays from './components/GameOverlays';
import MobileGameLayout from './layout/MobileGameLayout';
import DesktopGameLayout from './layout/DesktopGameLayout';
import type { GameLayoutProps } from './layout/types';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useUserStore } from '../../store/userStore';
import { useSettingsStore, speedFactor } from '../../store/settingsStore';
import { setMotionScale } from '../../animations/motion';
import { useI18n } from '../../i18n';
import { useGameSounds } from '../../hooks/useGameSounds';

// ---------- Pantalla principal (local) ----------

const LocalGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  /** Pantallas bajas (tablet apaisada o ventanas compactas): comprime la mesa para que quepa de alto. */
  const isShort = useMediaQuery('(max-height: 720px)');
  const user = useUserStore(s => s.user);
  const completeOnboarding = useUserStore(s => s.completeOnboarding);
  const { t } = useI18n();

  const [raiseAmount, setRaiseAmount] = useState(20);
  const [showRaise, setShowRaise] = useState(false);
  const [expectedAction, setExpectedAction] = useState<'call' | 'check' | 'raise' | null>(null);
  const [raiseTouched, setRaiseTouched] = useState(false);
  const [gameOverModal, setGameOverModal] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const gameOverTimerRef = useRef<number | null>(null);
  const gameSpeed = useSettingsStore((s) => s.gameSpeed);
  const speed = speedFactor(gameSpeed);
  /** Duración real (ms) del turno humano, escalada por la velocidad de juego. */
  const turnDurationMs = TURN_DURATION * 1000 * speed;

  const { gameRef, gameState, setGameState, aiPlayers, isTutorial, isLocal } = useLocalGameInit({
    gameId,
    username: user.username,
    setRaiseAmount,
  });

  useGameSounds(gameState);

  // Aplica la velocidad de juego a las animaciones (framer-motion).
  useEffect(() => {
    setMotionScale(speed);
    return () => setMotionScale(1);
  }, [speed]);

  const { commitState, streetTimerRef } = useCommitState({ gameRef, setGameState });

  const {
    potAward,
    awardProgress,
    potRemaining,
    setPotRemaining,
    handlePotAwardLanded,
    finishPotAward,
    resetPotAward,
  } = usePotAward(gameState);

  const updateState = () => {
    if (!gameRef.current) return;
    setShowRaise(false);
    commitState();
  };

  const startNewHand = () => {
    const g = gameRef.current;
    if (!g) return;
    resetPotAward();
    g.startHand();
    updateState();
  };

  const restartGame = () => {
    const g = gameRef.current;
    if (!g) return;
    resetPotAward();
    setPotRemaining(null);
    g.reset();
    g.startHand();
    updateState();
  };

  const {
    tutorialRun,
    tutorialReady,
    setTutorialReady,
    coachPaused,
    setCoachPaused,
    finishTutorial,
    restartTutorial,
  } = useTutorialRun({
    restartGame,
    onFinish: () => {
      completeOnboarding();
      navigate('/local');
    },
  });

  // Mantén la cantidad de subida dentro de [minRaise, maxRaise]
  useEffect(() => {
    if (!gameState || gameState.handOver) return;
    const humanPlayer = gameState.players[0];
    const tableMaxBet = Math.max(0, ...gameState.players.map(p => p.bet));
    const toCall = Math.max(0, tableMaxBet - humanPlayer.bet);
    const maxR = maxRaiseFor({ isTutorial, chips: humanPlayer.chips, callAmount: toCall, minRaise: gameState.minRaise });
    setRaiseAmount(prev => {
      const lower = Math.max(prev, gameState.minRaise);
      return maxR >= gameState.minRaise ? Math.min(lower, maxR) : gameState.minRaise;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  useTurnTimer({
    gameRef,
    commitState,
    setShowRaise,
    isTutorial,
    settingsOpen,
    currentPlayerIdx: gameState?.currentPlayer,
    isHandOver: gameState?.handOver,
    currentPhase: gameState?.phase,
    isStreetPending: gameState?.streetPending,
    turnDurationMs,
    initialSeconds: TURN_DURATION,
  });

  const { aiTurn } = useAiTurns({
    gameRef,
    gameState,
    aiPlayers,
    isTutorial,
    commitState,
    settingsOpen,
    speed,
    turnDurationMs,
    tutorialReady,
    coachPaused,
  });

  // Fin de partida: deja ver el showdown (mano ganadora y fichas) antes de
  // abrir el overlay. Si aún queda partida, ocúltalo de inmediato.
  const gameOverForHuman = Boolean(
    gameState &&
    (gameState.gameOver ||
      (gameState.handOver && (gameState.players[0].chips <= 0 || gameState.players[0].eliminated)))
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
    }, GAME_OVER_DELAY * speed);
    return () => {
      if (gameOverTimerRef.current) {
        window.clearTimeout(gameOverTimerRef.current);
        gameOverTimerRef.current = null;
      }
    };
  }, [gameOverForHuman, settingsOpen, speed]);

  // Al reanudar la partida, reactiva la pausa de calle que quedó pendiente.
  useEffect(() => {
    if (settingsOpen) {
      if (streetTimerRef.current) {
        window.clearTimeout(streetTimerRef.current);
        streetTimerRef.current = null;
      }
      return;
    }
    if (gameState?.streetPending && !streetTimerRef.current) {
      commitState();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsOpen, gameState?.streetPending, commitState]);

  const handleAction = (action: 'fold' | 'check' | 'call' | 'raise') => {
    const g = gameRef.current;
    if (!g || !gameState || gameState.currentPlayer !== 0 || gameState.streetPending) return;

    if (action === 'fold') g.fold(0);
    else if (action === 'check') g.check(0);
    else if (action === 'call') g.call(0);
    else if (action === 'raise') g.raise(0, raiseAmount);

    updateState();
  };

  const handleRaiseChange = (value: number) => {
    setRaiseAmount(value);
    setRaiseTouched(true);
  };

  // Reinicia la marca interactiva cada vez que se abre o cierra el panel de subida.
  useEffect(() => {
    setRaiseTouched(false);
  }, [showRaise]);

  const openSettings = () => setSettingsOpen(true);

  // Vuelve al menú sin borrar el guardado: la partida queda disponible para reanudar.
  const leaveGame = () => {
    navigate('/');
  };

  const overlays = (
    <GameOverlays
      settingsOpen={settingsOpen}
      onCloseSettings={() => setSettingsOpen(false)}
      onTutorial={() => navigate('/game/guide')}
      onHandsGuide={() => navigate('/hands', { state: { from: gameId } })}
      onLeave={leaveGame}
    />
  );

  // ---- Guards de render ----

  if (!isLocal) {
    return (
      <ScreenMessage
        title={t('game.unavailableTitle')}
        body={t('game.unavailableBody')}
        action={(
          <Button variant="outline" className="rounded-[0.875rem]!" onClick={() => navigate('/')}>
            ← {t('common.backToMenu')}
          </Button>
        )}
      />
    );
  }

  if (!gameState) {
    return <ScreenMessage title={t('game.loading')} />;
  }

  const state = gameState;
  const view = buildGameView(state, { potRemaining, awardProgress, gameId, isTutorial, t });
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
    isTutorial,
    expectedAction,
    showRaise,
    raiseAmount,
    raiseTouched,
    onToggleRaise: () => setShowRaise(!showRaise),
    onRaiseChange: handleRaiseChange,
    onRaise: () => handleAction('raise'),
    onAction: handleAction,
    onNewHand: startNewHand,
  };

  const layoutProps: GameLayoutProps = {
    state,
    view,
    aiTurn,
    humanCards,
    humanSeatProps,
    actionButtonProps,
    isShort,
    isTablet,
    isTutorial,
    gameSpeed,
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
      confirmDisabled: isTutorial && !raiseTouched,
      hideAllIn: isTutorial,
      onChange: handleRaiseChange,
      onRaise: () => handleAction('raise'),
      onClose: () => setShowRaise(false),
    },
    onOpenSettings: openSettings,
    gameOverModal,
    onRestart: restartGame,
    onSelectDifficulty: () => navigate('/local'),
    onHome: () => navigate('/'),
    potAward,
    onPotAwardLanded: handlePotAwardLanded,
    onPotAwardDone: finishPotAward,
    overlays,
    tutorial: {
      run: tutorialRun,
      onFinish: finishTutorial,
      onRestart: restartTutorial,
      onResume: () => setTutorialReady(true),
      onRaisePanel: (open) => setShowRaise(open),
      onExpectedAction: setExpectedAction,
      onPause: setCoachPaused,
    },
  };

  return isMobile ? <MobileGameLayout {...layoutProps} /> : <DesktopGameLayout {...layoutProps} />;
};

// ---------- Router ----------

const Game: React.FC = () => {
  return <LocalGame />;
};

export default Game;
