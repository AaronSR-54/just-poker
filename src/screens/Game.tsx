import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import RankBadge from '../components/RankBadge';
import Button from '../components/Button';
import PokerCard from '../components/PokerCard';
import type { GamePhase, CardRank, Suit } from '../types';
import { PokerGame, type PokerState } from '../game/poker';
import { PHASE_LABELS } from '../game/gameState';
import { evaluateHand, getRelevantCards } from '../game/hands';
import { calculateEquity } from '../game/equity';
import { PERSONALITIES } from '../ai/personalities';
import { createAIPlayer, getAIAction, type AIPlayer } from '../ai/aiPlayer';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useUserStore, POINTS_BY_PLACE } from '../store/userStore';
import { useOnlineGame } from '../net/useOnlineGame';

const TURN_DURATION = 30;

type Difficulty = 'easy' | 'medium' | 'hard';

function getDifficulty(gameId: string): Difficulty {
  if (gameId.includes('medium')) return 'medium';
  if (gameId.includes('hard')) return 'hard';
  return 'easy';
}

// ---------- Componentes pequeños ----------

const FloatingMenu: React.FC<{ onLeave: () => void }> = ({ onLeave }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref}>
      <button className="jp-menu-btn" onClick={() => setOpen(!open)}>⋮</button>
      {open && (
        <div className="jp-menu-popover">
          <button onClick={onLeave}>Salir de la partida</button>
        </div>
      )}
    </div>
  );
};

const TimerBar: React.FC<{ seconds: number; max: number }> = ({ seconds, max }) => {
  const pct = (seconds / max) * 100;
  return (
    <div className="jp-timer-bar">
      <div className="fill" style={{ width: `${pct}%` }} />
    </div>
  );
};

const BlindDot: React.FC<{ role: 'dealer' | 'sb' | 'bb' }> = ({ role }) => (
  <span className={`jp-blind-dot ${role}`}>{role === 'dealer' ? 'D' : role.toUpperCase()}</span>
);

const StatusBadge: React.FC<{
  isActive?: boolean;
  isWinner?: boolean;
  lastAction?: string;
  folded?: boolean;
  handOver?: boolean;
  bet?: number;
}> = ({ isActive, isWinner, lastAction, folded, handOver, bet = 0 }) => {
  if (folded) return null;
  if (isWinner) return <span className="jp-badge neutral">Ganador</span>;
  if (isActive && !handOver) return <span className="jp-badge turn">Turno</span>;
  if (bet > 0) return <span className="jp-badge info">Apuesta: <strong>{bet}</strong></span>;
  if (lastAction && lastAction !== '—' && lastAction !== 'Se retiró' && lastAction !== 'Eliminado') {
    return <span className="jp-badge neutral" style={{ opacity: 0.7 }}>{lastAction}</span>;
  }
  return null;
};

// ---------- Slot de rival ----------

interface RivalSlotProps {
  name: string;
  rankPoints: number;
  cards?: { rank: CardRank; suit: Suit }[];
  folded?: boolean;
  eliminated?: boolean;
  isActive?: boolean;
  isWinner?: boolean;
  lastAction?: string;
  showdown?: boolean;
  chips?: number;
  bet?: number;
  isAllIn?: boolean;
  handOver?: boolean;
  winAmount?: number;
  blindRole?: 'dealer' | 'sb' | 'bb' | null;
  compact?: boolean;
  /** Barra de “pensando” de la IA (animación CSS, no el timer humano). */
  thinking?: boolean;
  isDimmed?: (card: { rank: CardRank; suit: Suit }) => boolean;
}

const RivalSlot: React.FC<RivalSlotProps> = ({
  name,
  rankPoints,
  cards,
  folded = false,
  eliminated = false,
  isActive = false,
  isWinner = false,
  lastAction,
  showdown = false,
  chips = 0,
  bet = 0,
  isAllIn = false,
  handOver = false,
  winAmount = 0,
  blindRole = null,
  compact = false,
  thinking = true,
  isDimmed,
}) => {
  if (eliminated) {
    return (
      <div className="jp-slot" style={{ minWidth: compact ? 90 : 130, opacity: 0.25 }}>
        <span className="jp-label" style={{ fontSize: compact ? 10 : 11 }}>{name}</span>
        <span className="jp-caption">Eliminado</span>
      </div>
    );
  }

  const cardSize = compact ? 'xs' : 'sm';
  return (
    <div
      className={`jp-slot${isActive ? ' active' : ''}${folded ? ' folded' : ''}${isWinner ? ' winner' : ''}`}
      style={compact ? { minWidth: 90, padding: '8px 10px', gap: 4, borderRadius: 10 } : { minWidth: 130 }}
    >
      {isActive && !handOver && thinking && (
        <div className="jp-timer-bar ai" key={`think-${name}-${bet}-${lastAction}`}>
          <div className="fill" />
        </div>
      )}

      <div className="row gap-1" style={{ alignItems: 'center' }}>
        {blindRole && <BlindDot role={blindRole} />}
        <span className={compact ? 'jp-label' : 'jp-h3'} style={compact ? { fontSize: 10, letterSpacing: 0, textTransform: 'none' } : { fontSize: 13 }}>{name}</span>
        <RankBadge points={rankPoints} compact />
      </div>

      <div className={`jp-chip-stack${chips < 100 ? ' low' : ''}`}>
        <span className="icon">🪙</span>
        <span className="amt">{chips}</span>
        <AnimatePresence>
          {winAmount > 0 && (
            <motion.span
              key={`win-${winAmount}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="jp-win-chips"
            >
              +{winAmount}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {isAllIn && <span className="jp-badge warning">ALL-IN</span>}

      <div className={`row ${compact ? 'gap-0' : 'gap-1'}`}>
        {folded || !cards || cards.length === 0 ? (
          <>
            <PokerCard size={cardSize} back />
            <PokerCard size={cardSize} back />
          </>
        ) : (
          cards.map((c, i) => (
            <PokerCard key={i} size={cardSize} rank={c.rank} suit={c.suit} back={!showdown} dimmed={isDimmed?.(c)} />
          ))
        )}
      </div>

      <StatusBadge
        isActive={isActive}
        isWinner={isWinner}
        lastAction={lastAction}
        folded={folded}
        handOver={handOver}
        bet={bet}
      />
    </div>
  );
};
// ---------- Zona comunitaria ----------

const CommunityRow: React.FC<{
  phase: GamePhase;
  community: { rank: CardRank; suit: Suit }[];
  pot: number;
  handNumber: number;
  cardSize?: 'md' | 'xxl';
  isDimmed?: (card: { rank: CardRank; suit: Suit }) => boolean;
}> = ({ phase, community, pot, handNumber, cardSize = 'xxl', isDimmed }) => {
  const visibleCount = phase === 'pre-flop' ? 0 : phase === 'flop' ? 3 : phase === 'turn' ? 4 : 5;
  const slotW = cardSize === 'xxl' ? 130 : 64;
  const slotH = cardSize === 'xxl' ? 182 : 90;

  return (
    <div className="jp-table-felt">
      <div className="row gap-2" style={{ alignItems: 'center' }}>
        <span className="jp-phase-label">{PHASE_LABELS[phase] || phase}</span>
        <span className="jp-caption">Mano #{handNumber}</span>
      </div>

      <div className={`row ${cardSize === 'xxl' ? 'gap-3' : 'gap-2'}`} style={{ justifyContent: 'center' }}>
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < visibleCount && community[i]) {
            const card = community[i];
            return (
              <motion.div
                key={`${card.rank}${card.suit}`}
                initial={{ opacity: 0, scale: 0.85, rotateY: 60 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                <PokerCard
                  size={cardSize}
                  rank={card.rank}
                  suit={card.suit}
                  dimmed={isDimmed?.(card)}
                />
              </motion.div>
            );
          }
          return <div key={i} className="jp-card-slot-empty" style={{ width: slotW, height: slotH }} />;
        })}
      </div>

      <motion.div
        className="jp-pot"
        key={pot}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.25 }}
      >
        <span className="label">Bote</span>
        <span>{pot}</span>
      </motion.div>
    </div>
  );
};

// ---------- Log de acciones ----------

const ACTION_VERBS: Record<string, string> = {
  fold: 'se retiró',
  check: 'pasó',
  call: 'igualó',
  raise: 'subió',
  blind: 'ciega',
};

const ActionLog: React.FC<{ state: PokerState }> = ({ state }) => {
  const recent = state.actions.slice(-4);
  if (recent.length === 0) return null;
  return (
    <div className="jp-action-log">
      {recent.map((a, i) => {
        const p = state.players[a.playerIndex];
        return (
          <div
            key={`${a.timestamp}-${i}`}
            className="entry"
            style={{ opacity: 0.35 + (0.65 * (i + 1)) / recent.length }}
          >
            <strong>{p?.name ?? '?'}</strong> {ACTION_VERBS[a.type] ?? a.type}
            {a.amount ? ` ${a.amount}` : ''}
          </div>
        );
      })}
    </div>
  );
};

// ---------- Panel de subida ----------

interface RaisePanelProps {
  raiseAmount: number;
  onRaiseChange: (v: number) => void;
  onRaise: () => void;
  minRaise: number;
  maxRaise: number;
  potSize: number;
  playerChips: number;
  callAmount: number;
}

const RaisePanel: React.FC<RaisePanelProps> = ({
  raiseAmount, onRaiseChange, onRaise, minRaise, maxRaise, potSize, playerChips, callAmount,
}) => {
  const halfPot = Math.floor(potSize / 2);
  const allInAmount = Math.max(minRaise, playerChips - callAmount);
  const quickAmounts = [
    { label: 'Min', value: minRaise },
    { label: '½', value: Math.max(minRaise, halfPot) },
    { label: 'Bote', value: Math.max(minRaise, potSize) },
    { label: 'All-in', value: allInAmount },
  ];

  return (
    <div className="jp-raise-panel">
      <div className="row gap-1" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
        {quickAmounts.map((qa) => {
          const val = Math.min(qa.value, maxRaise);
          return (
            <button
              key={qa.label}
              onClick={() => onRaiseChange(val)}
              className={`jp-quick-raise${raiseAmount === val ? ' active' : ''}`}
            >
              {qa.label}
            </button>
          );
        })}
      </div>

      <div className="jp-raise-slider" style={{ width: '100%' }}>
        <span className="jp-caption" style={{ minWidth: 24 }}>{minRaise}</span>
        <input
          type="range"
          min={minRaise}
          max={maxRaise}
          value={raiseAmount}
          onChange={(e) => onRaiseChange(Number(e.target.value))}
        />
        <span className="value">{raiseAmount}</span>
      </div>

      <Button variant="primary" size="sm" onClick={onRaise}>
        {raiseAmount >= allInAmount ? `All-in ${playerChips}` : `Subir ${raiseAmount}`}
      </Button>
    </div>
  );
};

const RaiseSheet: React.FC<RaisePanelProps & { onClose: () => void }> = (props) => {
  return (
    <div className="jp-raise-overlay" onClick={props.onClose}>
      <div className="jp-raise-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="jp-raise-handle" />
        <RaisePanel {...props} />
      </div>
    </div>
  );
};
// ---------- Overlay de fin de partida ----------

const GameOverOverlay: React.FC<{
  state: PokerState;
  onRestart: () => void;
  onLeave: () => void;
}> = ({ state, onRestart, onLeave }) => {
  const standings = [...state.players]
    .sort((a, b) => {
      if (a.id === state.gameWinner) return -1;
      if (b.id === state.gameWinner) return 1;
      return b.chips - a.chips;
    });
  const humanWon = state.gameWinner === 0;

  return (
    <motion.div
      className="jp-gameover-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="jp-gameover-card"
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
      >
        <div className="jp-eyebrow">Fin de la partida · {state.handNumber} manos</div>
        <div className="jp-h2" style={{ fontSize: 32 }}>
          {humanWon ? '¡Has ganado la mesa!' : `${standings[0].name} gana la mesa`}
        </div>

        <div className="col gap-2" style={{ width: '100%' }}>
          {standings.map((p, i) => (
            <div
              key={p.id}
              className="row between jp-standing-row"
              style={i === 0 ? { background: 'var(--bone)', color: 'var(--ink)' } : undefined}
            >
              <div className="row gap-2">
                <span className="jp-label">{i + 1}.º</span>
                <span className="jp-body">{p.name}{p.id === 0 ? ' (tú)' : ''}</span>
              </div>
              <span className="jp-label">🪙 {p.chips}</span>
            </div>
          ))}
        </div>

        <div className="row gap-3">
          <Button variant="outline" onClick={onLeave}>Salir</Button>
          <Button variant="primary" glow onClick={onRestart}>Jugar otra vez</Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ---------- Pantalla principal (local) ----------

const LocalGame: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const user = useUserStore(s => s.user);
  const recordHand = useUserStore(s => s.recordHand);
  const recordGame = useUserStore(s => s.recordGame);

  const gameRef = useRef<PokerGame | null>(null);
  const [gameState, setGameState] = useState<PokerState | null>(null);
  const [aiPlayers, setAiPlayers] = useState<AIPlayer[]>([]);
  const [raiseAmount, setRaiseAmount] = useState(20);
  const [showRaise, setShowRaise] = useState(false);
  const [showEquity, setShowEquity] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(TURN_DURATION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedHandRef = useRef(0);
  const recordedGameRef = useRef(false);

  const isLocal = !!gameId && gameId.startsWith('local-');

  // ---- Inicialización ----
  useEffect(() => {
    if (!isLocal || !gameId) return;

    const diff = getDifficulty(gameId);
    const personalities = PERSONALITIES[diff];
    const names = [user.username, ...personalities.map(p => p.name)];
    const g = new PokerGame(4, 10, 20, names);
    const ais = personalities.map((p, i) => createAIPlayer(i + 1, p));

    gameRef.current = g;
    setAiPlayers(ais);
    recordedHandRef.current = 0;
    recordedGameRef.current = false;

    g.startHand();
    const initial = g.getState();
    setRaiseAmount(initial.minRaise);
    setGameState(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, isLocal]);

  // Clamp de la cantidad de subida cuando cambia el mínimo
  useEffect(() => {
    if (!gameState) return;
    if (raiseAmount < gameState.minRaise) setRaiseAmount(gameState.minRaise);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.minRaise]);

  // ---- Registrar mano terminada en stats ----
  useEffect(() => {
    if (!gameState || !gameState.handOver || gameState.gameOver) return;
    if (recordedHandRef.current === gameState.handNumber) return;
    recordedHandRef.current = gameState.handNumber;
    recordHand(gameState.winner?.includes(0) ?? false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.handOver, gameState?.handNumber]);

  // ---- Registrar partida terminada ----
  useEffect(() => {
    if (!gameState?.gameOver || recordedGameRef.current) return;
    recordedGameRef.current = true;
    recordHand(gameState.gameWinner === 0);
    const standings = [...gameState.players].sort((a, b) => {
      if (a.id === gameState.gameWinner) return -1;
      if (b.id === gameState.gameWinner) return 1;
      return b.chips - a.chips;
    });
    const place = (standings.findIndex(p => p.id === 0) + 1) as 1 | 2 | 3 | 4;
    recordGame({
      place,
      pts: POINTS_BY_PLACE[place] ?? 0,
      rivals: standings.filter(p => p.id !== 0).map(p => p.name),
      mode: 'local',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.gameOver]);

  // ---- Temporizador de turno ----
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setTimerSeconds(TURN_DURATION);
    timerRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          stopTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  const currentPlayerIdx = gameState?.currentPlayer;
  const isHandOver = gameState?.handOver;
  useEffect(() => {
    if (currentPlayerIdx === undefined || isHandOver === undefined) return;
    if (currentPlayerIdx === 0 && !isHandOver) {
      startTimer();
    } else {
      stopTimer();
    }
    return stopTimer;
  }, [currentPlayerIdx, isHandOver, startTimer, stopTimer]);

  // Auto check/fold al agotarse el tiempo
  useEffect(() => {
    if (timerSeconds > 0 || !gameState) return;
    if (gameState.currentPlayer !== 0 || gameState.handOver) return;

    const g = gameRef.current;
    if (!g) return;

    if (g.canCheck(0)) g.check(0);
    else g.fold(0);
    setGameState(g.getState());
    setShowRaise(false);
  }, [timerSeconds, gameState]);

  // ---- Turnos de la IA ----
  useEffect(() => {
    const g = gameRef.current;
    if (!g || !gameState) return;

    const current = gameState.currentPlayer;
    if (current === 0 || gameState.handOver) return;

    const ai = aiPlayers.find(a => a.playerIndex === current);
    if (!ai) return;

    let cancelled = false;
    getAIAction(ai, gameState).then((action) => {
      if (cancelled || !gameRef.current) return;
      const currentState = gameRef.current.getState();
      if (currentState.currentPlayer !== current || currentState.handOver) return;

      if (action.type === 'fold') gameRef.current.fold(current);
      else if (action.type === 'check') gameRef.current.check(current);
      else if (action.type === 'call') gameRef.current.call(current);
      else if (action.type === 'raise') gameRef.current.raise(current, action.amount || currentState.minRaise);

      setGameState(gameRef.current.getState());
    });

    return () => { cancelled = true; };
  }, [gameState, aiPlayers]);

  const updateState = () => {
    const g = gameRef.current;
    if (!g) return;
    setGameState(g.getState());
    setShowRaise(false);
  };

  const handleAction = (action: 'fold' | 'check' | 'call' | 'raise') => {
    const g = gameRef.current;
    if (!g || !gameState || gameState.currentPlayer !== 0) return;

    if (action === 'fold') g.fold(0);
    else if (action === 'check') g.check(0);
    else if (action === 'call') g.call(0);
    else if (action === 'raise') g.raise(0, raiseAmount);

    updateState();
  };

  const startNewHand = () => {
    const g = gameRef.current;
    if (!g) return;
    g.startHand();
    updateState();
  };

  const restartGame = () => {
    const g = gameRef.current;
    if (!g) return;
    recordedGameRef.current = false;
    recordedHandRef.current = 0;
    g.reset();
    g.startHand();
    updateState();
  };

  // ---- Equity del jugador humano (opcional) ----
  const humanEquity = (() => {
    if (!showEquity || !gameState || gameState.handOver) return null;
    const human = gameState.players[0];
    if (human.cards.length < 2 || human.folded) return null;
    const opponents = gameState.players.filter((p, i) => i !== 0 && !p.folded && !p.eliminated).length;
    if (opponents === 0) return null;
    const sims = gameState.community.length >= 4 ? 300 : 400;
    return calculateEquity(human.cards, gameState.community, Math.max(1, opponents), sims);
  })();

  // ---- Guards de render ----

  if (!isLocal) {
    return (
      <div className="jp-screen">
        <div className="col center grow gap-4">
          <div className="jp-h2">Juego no disponible</div>
          <div className="jp-body faint">
            Esta sala aún no está lista. Vuelve al lobby.
          </div>
          <Button variant="outline" onClick={() => navigate('/')}>
            ← Volver al menú
          </Button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="jp-screen">
        <div className="col center grow">
          <div className="jp-h2">Cargando partida...</div>
        </div>
      </div>
    );
  }

  const state = gameState;
  const phase = state.phase;
  const pot = state.pot;
  const activePlayer = state.currentPlayer;
  const winner = state.winner;
  const showdown = state.showdown;
  const handOver = state.handOver;
  const human = state.players[0];
  const rivals = state.players.slice(1);

  const maxBet = Math.max(0, ...state.players.map(p => p.bet));
  const canCheck = human.bet >= maxBet;
  const callAmount = Math.max(0, maxBet - human.bet);
  const canRaise = human.chips > callAmount;
  const maxRaise = Math.max(0, human.chips - callAmount);

  // Roles de ciegas (con eliminaciones los índices vivos varían; los derivamos del dealer)
  const blindRoleFor = (playerId: number): 'dealer' | 'sb' | 'bb' | null => {
    if (playerId === state.dealer) return 'dealer';
    const alive = state.players.filter(p => !p.eliminated).map(p => p.id);
    if (alive.length < 2) return null;
    const pos = alive.indexOf(state.dealer);
    const sb = alive.length === 2 ? alive[pos] : alive[(pos + 1) % alive.length];
    const bb = alive.length === 2 ? alive[(pos + 1) % alive.length] : alive[(pos + 2) % alive.length];
    if (playerId === sb) return 'sb';
    if (playerId === bb) return 'bb';
    return null;
  };

  const humanHandName = (() => {
    if (human.cards.length < 2) return '';
    if (state.community.length >= 3) return evaluateHand(human.cards, state.community).name;
    // Preflop: describir las cartas
    const [a, b] = human.cards;
    if (a.rank === b.rank) return `Pareja de ${a.rank}`;
    return a.suit === b.suit ? `${a.rank} ${b.rank} del mismo palo` : '';
  })();

  const winningHandName = winner && winner.length > 0 && state.players[winner[0]].cards.length >= 2 && state.community.length >= 3
    ? evaluateHand(state.players[winner[0]].cards, state.community).name
    : '';

  const winnerData = (() => {
    if (!winner || winner.length === 0) return null;
    const names = winner.map(w => state.players[w].name).join(' y ');
    const totalWon = winner.reduce((acc, w) => acc + (state.winAmounts[w] || 0), 0);
    const handName = winner.includes(0) ? humanHandName : winningHandName;
    const handSuffix = handName ? ` con ${handName}` : '';
    if (winner.includes(0)) {
      return winner.length > 1
        ? { label: `Empate — ganaste ${state.winAmounts[0] ?? 0}${handSuffix}` }
        : { label: `Ganaste ${totalWon}${handSuffix}` };
    }
    return winner.length > 1
      ? { label: `${names} ganaron ${totalWon}${handSuffix}` }
      : { label: `${names} ganó ${totalWon}${handSuffix}` };
  })();

  const winningCards = (() => {
    if (!winner || winner.length === 0 || state.phase !== 'showdown' || state.community.length < 3) return new Set<string>();
    const winnerHand = evaluateHand(state.players[winner[0]].cards, state.community);
    const relevant = getRelevantCards(winnerHand);
    return new Set(relevant.map(c => `${c.rank}${c.suit}`));
  })();

  const isDimmed = (card: { rank: string; suit: string }): boolean =>
    winningCards.size > 0 && !winningCards.has(`${card.rank}${card.suit}`);

  const WinnerMessage: React.FC = () => {
    if (!winnerData) return null;
    return (
      <motion.div
        className="row gap-2"
        style={{ alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <span className="jp-h3" style={{ color: 'var(--bone)', fontSize: 16 }}>
          <strong>{winnerData.label}</strong>
        </span>
      </motion.div>
    );
  };

  const humanInfo = (
    <div className="col gap-1" style={{ alignItems: 'center', minWidth: isMobile ? undefined : 140 }}>
      <div className="row gap-1" style={{ alignItems: 'center' }}>
        {blindRoleFor(0) && <BlindDot role={blindRoleFor(0)!} />}
        <span className={isMobile ? 'jp-label' : 'jp-h3'} style={{ fontSize: isMobile ? 11 : 16, letterSpacing: isMobile ? 0 : undefined, textTransform: isMobile ? 'none' : undefined }}>{human.name}</span>
        <RankBadge points={user.points} compact />
      </div>
      <div className={`jp-chip-stack${human.chips < 100 ? ' low' : ''}`}>
        <span className="icon">🪙</span>
        <span className="amt">{human.chips}</span>
        <AnimatePresence>
          {!handOver && human.bet > 0 && (
            <motion.span
              key={`spent-${human.bet}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="jp-round-spent"
            >
              −{human.bet}
            </motion.span>
          )}
          {handOver && state.winAmounts[0] > 0 && (
            <motion.span
              key={`hwin-${state.handNumber}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="jp-win-chips"
            >
              +{state.winAmounts[0]}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {human.isAllIn && <span className="jp-badge warning">ALL-IN</span>}
    </div>
  );

  const humanCards = (
    <div className="col gap-1" style={{ alignItems: 'center' }}>
      {humanHandName && !handOver && (
        <span className="jp-badge neutral">{humanHandName}</span>
      )}
      <div className="row gap-2">
        {human.cards.length > 0 ? (
          human.cards.map((c, i) => (
            <PokerCard key={i} size="lg" rank={c.rank} suit={c.suit} dimmed={isDimmed({ rank: c.rank, suit: c.suit })} />
          ))
        ) : (
          <>
            <PokerCard size="lg" back />
            <PokerCard size="lg" back />
          </>
        )}
      </div>
      {showEquity && humanEquity && (
        <div className="jp-hand-info">
          <div className="equity">
            <span className="equity-pct">{humanEquity.winPct}%</span>
            <div className="jp-equity-bar">
              <div className="fill" style={{ width: `${humanEquity.winPct}%` }} />
            </div>
          </div>
          <span className="jp-caption" style={{ fontSize: 10 }}>prob. de ganar{humanEquity.tiePct > 0 ? ` · empate ${humanEquity.tiePct}%` : ''}</span>
        </div>
      )}
    </div>
  );

  const actionButtons = handOver ? (
    <div className="col gap-2" style={{ alignItems: 'center' }}>
      <WinnerMessage />
      {!state.gameOver && (
        <Button variant="primary" size="sm" onClick={startNewHand}>
          Nueva Mano
        </Button>
      )}
    </div>
  ) : (
    <div className="row gap-2" style={{ justifyContent: 'center' }}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction(canCheck ? 'check' : 'fold')}
        disabled={activePlayer !== 0}
      >
        {canCheck ? 'Pasar' : 'Retirarse'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => handleAction('call')}
        disabled={activePlayer !== 0 || callAmount === 0}
      >
        {callAmount > 0
          ? callAmount >= human.chips
            ? `All-in ${human.chips}`
            : `Igualar ${callAmount}`
          : 'Igualar'}
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={() => setShowRaise(!showRaise)}
        disabled={activePlayer !== 0 || !canRaise}
      >
        Subir
      </Button>
    </div>
  );

  const equityToggle = (
    <button
      className={`jp-equity-toggle${showEquity ? ' on' : ''}`}
      onClick={() => setShowEquity(v => !v)}
      title="Mostrar probabilidad de ganar"
    >
      %
    </button>
  );

  // ---------- MÓVIL ----------

  if (isMobile) {
    return (
      <div className="jp-screen">
        <FloatingMenu onLeave={() => navigate('/')} />
        {equityToggle}

        <div className="col" style={{ flex: 1, padding: '12px 14px' }}>
          <div className="row gap-2" style={{ justifyContent: 'center' }}>
            {rivals.map((r) => (
              <RivalSlot
                key={r.id}
                compact
                name={r.name}
                rankPoints={aiPlayers.find(a => a.playerIndex === r.id)?.personality.points ?? 100}
                cards={r.cards.length > 0 ? r.cards : undefined}
                folded={r.folded}
                eliminated={r.eliminated}
                isActive={activePlayer === r.id}
                isWinner={winner !== null && winner.includes(r.id)}
                lastAction={r.lastAction !== '—' ? r.lastAction : undefined}
                showdown={showdown}
                chips={r.chips}
                bet={r.bet}
                isAllIn={r.isAllIn}
                handOver={handOver}
                winAmount={handOver ? state.winAmounts[r.id] : 0}
                blindRole={blindRoleFor(r.id)}
                isDimmed={isDimmed}
              />
            ))}
          </div>

          <div className="jp-table" style={{ padding: '12px 0' }}>
            <CommunityRow
              phase={phase}
              community={state.community}
              pot={pot}
              handNumber={state.handNumber}
              cardSize="md"
              isDimmed={isDimmed}
            />
            <ActionLog state={state} />
          </div>

          <div className="col gap-3" style={{ alignItems: 'center' }}>
            {humanCards}
            {humanInfo}

            {activePlayer === 0 && !handOver && (
              <div style={{ width: '80%' }}>
                <TimerBar seconds={timerSeconds} max={TURN_DURATION} />
              </div>
            )}

            {actionButtons}
          </div>
        </div>

        {showRaise && activePlayer === 0 && !handOver && (
          <RaiseSheet
            raiseAmount={raiseAmount}
            onRaiseChange={setRaiseAmount}
            onRaise={() => handleAction('raise')}
            onClose={() => setShowRaise(false)}
            minRaise={state.minRaise}
            maxRaise={Math.max(state.minRaise, maxRaise)}
            potSize={pot}
            playerChips={human.chips}
            callAmount={callAmount}
          />
        )}

        <AnimatePresence>
          {state.gameOver && (
            <GameOverOverlay state={state} onRestart={restartGame} onLeave={() => navigate('/')} />
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ---------- DESKTOP ----------

  return (
    <div className="jp-screen">
      <FloatingMenu onLeave={() => navigate('/')} />
      {equityToggle}

      <div className="col" style={{ flex: 1, padding: '16px 48px 24px' }}>
        <div className="row gap-4" style={{ justifyContent: 'center' }}>
          {rivals.map((r) => (
            <RivalSlot
              key={r.id}
              name={r.name}
              rankPoints={aiPlayers.find(a => a.playerIndex === r.id)?.personality.points ?? 100}
              cards={r.cards.length > 0 ? r.cards : undefined}
              folded={r.folded}
              eliminated={r.eliminated}
              isActive={activePlayer === r.id}
              isWinner={winner !== null && winner.includes(r.id)}
              lastAction={r.lastAction !== '—' ? r.lastAction : undefined}
              showdown={showdown}
              chips={r.chips}
              bet={r.bet}
              isAllIn={r.isAllIn}
              handOver={handOver}
              winAmount={handOver ? state.winAmounts[r.id] : 0}
              blindRole={blindRoleFor(r.id)}
              isDimmed={isDimmed}
            />
          ))}
        </div>

        <div className="jp-table">
          <CommunityRow
            phase={phase}
            community={state.community}
            pot={pot}
            handNumber={state.handNumber}
            isDimmed={isDimmed}
          />
          <ActionLog state={state} />
        </div>

        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', paddingBottom: 20 }}>
          {activePlayer === 0 && !handOver && <TimerBar seconds={timerSeconds} max={TURN_DURATION} />}

          {humanInfo}

          <div className="col gap-1" style={{ alignItems: 'center', position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 0 }}>
            {humanCards}
          </div>

          <div className="col gap-2" style={{ alignItems: 'center', minWidth: 200 }}>
            {handOver ? (
              actionButtons
            ) : (
              <div className="row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction(canCheck ? 'check' : 'fold')}
                  disabled={activePlayer !== 0}
                >
                  {canCheck ? 'Pasar' : 'Retirarse'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction('call')}
                  disabled={activePlayer !== 0 || callAmount === 0}
                >
                  {callAmount > 0
                    ? callAmount >= human.chips
                      ? `All-in ${human.chips}`
                      : `Igualar ${callAmount}`
                    : 'Igualar'}
                </Button>
                <div className="jp-raise-dropdown">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowRaise(!showRaise)}
                    disabled={activePlayer !== 0 || !canRaise}
                  >
                    Subir
                  </Button>
                  {showRaise && activePlayer === 0 && (
                    <RaisePanel
                      raiseAmount={raiseAmount}
                      onRaiseChange={setRaiseAmount}
                      onRaise={() => handleAction('raise')}
                      minRaise={state.minRaise}
                      maxRaise={Math.max(state.minRaise, maxRaise)}
                      potSize={pot}
                      playerChips={human.chips}
                      callAmount={callAmount}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {state.gameOver && (
          <GameOverOverlay state={state} onRestart={restartGame} onLeave={() => navigate('/')} />
        )}
      </AnimatePresence>
    </div>
  );
};

// ---------- Pantalla online ----------

const OnlineGame: React.FC<{ roomId: string }> = ({ roomId }) => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const user = useUserStore(s => s.user);
  const online = useOnlineGame(roomId);

  const [raiseAmount, setRaiseAmount] = useState(20);
  const [showRaise, setShowRaise] = useState(false);
  const [showEquity, setShowEquity] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(TURN_DURATION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const gameState = online.state;

  useEffect(() => {
    if (gameState && raiseAmount < gameState.minRaise) setRaiseAmount(gameState.minRaise);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.minRaise]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    setTimerSeconds(TURN_DURATION);
    timerRef.current = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          stopTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [stopTimer]);

  const currentPlayerIdx = gameState?.currentPlayer;
  const isHandOver = gameState?.handOver;
  useEffect(() => {
    if (currentPlayerIdx === undefined || isHandOver === undefined) return;
    if (currentPlayerIdx === 0 && !isHandOver) startTimer();
    else stopTimer();
    return stopTimer;
  }, [currentPlayerIdx, isHandOver, startTimer, stopTimer]);

  useEffect(() => {
    if (timerSeconds > 0 || !gameState) return;
    if (gameState.currentPlayer !== 0 || gameState.handOver) return;
    if (gameState.players[0].bet >= Math.max(...gameState.players.map(p => p.bet))) {
      online.handleAction('check');
    } else {
      online.handleAction('fold');
    }
    setShowRaise(false);
  }, [timerSeconds, gameState, online]);

  const leave = () => {
    online.leave();
    navigate('/online');
  };

  if (online.loading) {
    return (
      <div className="jp-screen">
        <div className="col center grow">
          <div className="jp-h2">Conectando a la mesa…</div>
        </div>
      </div>
    );
  }

  if (online.error || !gameState) {
    return (
      <div className="jp-screen">
        <div className="col center grow gap-4">
          <div className="jp-h2">No se pudo cargar la partida</div>
          <div className="jp-body faint">{online.error ?? 'Estado no disponible'}</div>
          <Button variant="outline" onClick={leave}>← Volver</Button>
        </div>
      </div>
    );
  }

  const state = gameState;
  const phase = state.phase;
  const pot = state.pot;
  const activePlayer = state.currentPlayer;
  const winner = state.winner;
  const showdown = state.showdown;
  const handOver = state.handOver;
  const human = state.players[0];
  const rivals = state.players.slice(1);
  const maxBet = Math.max(0, ...state.players.map(p => p.bet));
  const canCheck = human.bet >= maxBet;
  const callAmount = Math.max(0, maxBet - human.bet);
  const canRaise = human.chips > callAmount;
  const maxRaise = Math.max(0, human.chips - callAmount);

  const blindRoleFor = (playerId: number): 'dealer' | 'sb' | 'bb' | null => {
    if (playerId === state.dealer) return 'dealer';
    const alive = state.players.filter(p => !p.eliminated).map(p => p.id);
    if (alive.length < 2) return null;
    const pos = alive.indexOf(state.dealer);
    const sb = alive.length === 2 ? alive[pos] : alive[(pos + 1) % alive.length];
    const bb = alive.length === 2 ? alive[(pos + 1) % alive.length] : alive[(pos + 2) % alive.length];
    if (playerId === sb) return 'sb';
    if (playerId === bb) return 'bb';
    return null;
  };

  const humanHandName = (() => {
    if (human.cards.length < 2) return '';
    if (state.community.length >= 3) return evaluateHand(human.cards, state.community).name;
    const [a, b] = human.cards;
    if (a.rank === b.rank) return `Pareja de ${a.rank}`;
    return a.suit === b.suit ? `${a.rank} ${b.rank} del mismo palo` : '';
  })();

  const winningHandName = winner && winner.length > 0 && state.players[winner[0]].cards.length >= 2 && state.community.length >= 3
    ? evaluateHand(state.players[winner[0]].cards, state.community).name
    : '';

  const winnerData = (() => {
    if (!winner || winner.length === 0) return null;
    const names = winner.map(w => state.players[w].name).join(' y ');
    const totalWon = winner.reduce((acc, w) => acc + (state.winAmounts[w] || 0), 0);
    const handName = winner.includes(0) ? humanHandName : winningHandName;
    const handSuffix = handName ? ` con ${handName}` : '';
    if (winner.includes(0)) {
      return winner.length > 1
        ? { label: `Empate — ganaste ${state.winAmounts[0] ?? 0}${handSuffix}` }
        : { label: `Ganaste ${totalWon}${handSuffix}` };
    }
    return winner.length > 1
      ? { label: `${names} ganaron ${totalWon}${handSuffix}` }
      : { label: `${names} ganó ${totalWon}${handSuffix}` };
  })();

  const winningCards = (() => {
    if (!winner || winner.length === 0 || state.phase !== 'showdown' || state.community.length < 3) return new Set<string>();
    const winnerHand = evaluateHand(state.players[winner[0]].cards, state.community);
    return new Set(getRelevantCards(winnerHand).map(c => `${c.rank}${c.suit}`));
  })();

  const isDimmed = (card: { rank: string; suit: string }) =>
    winningCards.size > 0 && !winningCards.has(`${card.rank}${card.suit}`);

  const handleAction = (action: 'fold' | 'check' | 'call' | 'raise') => {
    if (action === 'raise') online.handleAction('raise', raiseAmount);
    else online.handleAction(action);
    setShowRaise(false);
  };

  const WinnerMessage = () => {
    if (!winnerData) return null;
    return (
      <motion.div
        className="row gap-2"
        style={{ alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <span className="jp-h3" style={{ color: 'var(--bone)', fontSize: 16 }}>
          <strong>{winnerData.label}</strong>
        </span>
      </motion.div>
    );
  };

  const actionButtons = handOver ? (
    <div className="col gap-2" style={{ alignItems: 'center' }}>
      <WinnerMessage />
      {!state.gameOver && online.session?.isHost && (
        <Button variant="primary" size="sm" onClick={online.startNewHand}>Nueva Mano</Button>
      )}
      {!state.gameOver && !online.session?.isHost && (
        <span className="jp-caption">Esperando al anfitrión…</span>
      )}
    </div>
  ) : (
    <div className="row gap-2" style={{ justifyContent: 'center' }}>
      <Button variant="outline" size="sm" onClick={() => handleAction(canCheck ? 'check' : 'fold')} disabled={activePlayer !== 0}>
        {canCheck ? 'Pasar' : 'Retirarse'}
      </Button>
      <Button variant="outline" size="sm" onClick={() => handleAction('call')} disabled={activePlayer !== 0 || callAmount === 0}>
        {callAmount > 0 ? (callAmount >= human.chips ? `All-in ${human.chips}` : `Igualar ${callAmount}`) : 'Igualar'}
      </Button>
      <Button variant="primary" size="sm" onClick={() => setShowRaise(!showRaise)} disabled={activePlayer !== 0 || !canRaise}>
        Subir
      </Button>
    </div>
  );

  const humanCards = (
    <div className="col gap-1" style={{ alignItems: 'center' }}>
      {humanHandName && !handOver && <span className="jp-badge neutral">{humanHandName}</span>}
      <div className="row gap-2">
        {human.cards.length > 0
          ? human.cards.map((c, i) => (
              <PokerCard key={i} size="lg" rank={c.rank} suit={c.suit} dimmed={isDimmed(c)} />
            ))
          : <><PokerCard size="lg" back /><PokerCard size="lg" back /></>}
      </div>
    </div>
  );

  const humanInfo = (
    <div className="col gap-1" style={{ alignItems: 'center', minWidth: isMobile ? undefined : 140 }}>
      <div className="row gap-1" style={{ alignItems: 'center' }}>
        {blindRoleFor(0) && <BlindDot role={blindRoleFor(0)!} />}
        <span className={isMobile ? 'jp-label' : 'jp-h3'} style={{ fontSize: isMobile ? 11 : 16 }}>{human.name}</span>
        <RankBadge points={user.points} compact />
      </div>
      <div className={`jp-chip-stack${human.chips < 100 ? ' low' : ''}`}>
        <span className="icon">🪙</span>
        <span className="amt">{human.chips}</span>
        <AnimatePresence>
          {!handOver && human.bet > 0 && (
            <motion.span
              key={`spent-${human.bet}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="jp-round-spent"
            >
              −{human.bet}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {human.isAllIn && <span className="jp-badge warning">ALL-IN</span>}
    </div>
  );

  const rivalsRow = (
    <div className="row gap-2" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
      {rivals.map(r => (
        <RivalSlot
          key={r.id}
          compact={isMobile}
          name={r.name}
          rankPoints={online.rivalPoints(r.id)}
          cards={r.cards.length > 0 ? r.cards : undefined}
          folded={r.folded}
          eliminated={r.eliminated}
          isActive={activePlayer === r.id}
          isWinner={winner !== null && winner.includes(r.id)}
          lastAction={r.lastAction !== '—' ? r.lastAction : undefined}
          showdown={showdown}
          chips={r.chips}
          bet={r.bet}
          isAllIn={r.isAllIn}
          handOver={handOver}
          winAmount={handOver ? state.winAmounts[r.id] : 0}
          blindRole={blindRoleFor(r.id)}
          isDimmed={isDimmed}
        />
      ))}
    </div>
  );

  return (
    <div className="jp-screen">
      <FloatingMenu onLeave={leave} />
      <button
        className={`jp-equity-toggle${showEquity ? ' on' : ''}`}
        onClick={() => setShowEquity(v => !v)}
      >%</button>

      <div className="col" style={{ flex: 1, padding: isMobile ? '12px 14px' : '16px 48px 24px' }}>
        {rivalsRow}
        <div className="jp-table" style={isMobile ? { padding: '12px 0' } : undefined}>
          <CommunityRow
            phase={phase}
            community={state.community}
            pot={pot}
            handNumber={state.handNumber}
            cardSize={isMobile ? 'md' : 'xxl'}
            isDimmed={isDimmed}
          />
          <ActionLog state={state} />
        </div>

        <div className={isMobile ? 'col gap-3' : 'row'} style={isMobile ? { alignItems: 'center' } : { justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', paddingBottom: 20 }}>
          {activePlayer === 0 && !handOver && !isMobile && <TimerBar seconds={timerSeconds} max={TURN_DURATION} />}
          {!isMobile && humanInfo}
          <div className="col gap-1" style={isMobile ? { alignItems: 'center' } : { alignItems: 'center', position: 'absolute', left: '50%', transform: 'translateX(-50%)', bottom: 0 }}>
            {humanCards}
          </div>
          {isMobile && humanInfo}
          {isMobile && activePlayer === 0 && !handOver && (
            <div style={{ width: '80%' }}><TimerBar seconds={timerSeconds} max={TURN_DURATION} /></div>
          )}
          <div className="col gap-2" style={{ alignItems: 'center', minWidth: isMobile ? undefined : 200 }}>
            {actionButtons}
            {!isMobile && showRaise && activePlayer === 0 && !handOver && (
              <div className="jp-raise-dropdown">
                <RaisePanel
                  raiseAmount={raiseAmount}
                  onRaiseChange={setRaiseAmount}
                  onRaise={() => handleAction('raise')}
                  minRaise={state.minRaise}
                  maxRaise={Math.max(state.minRaise, maxRaise)}
                  potSize={pot}
                  playerChips={human.chips}
                  callAmount={callAmount}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {isMobile && showRaise && activePlayer === 0 && !handOver && (
        <RaiseSheet
          raiseAmount={raiseAmount}
          onRaiseChange={setRaiseAmount}
          onRaise={() => handleAction('raise')}
          onClose={() => setShowRaise(false)}
          minRaise={state.minRaise}
          maxRaise={Math.max(state.minRaise, maxRaise)}
          potSize={pot}
          playerChips={human.chips}
          callAmount={callAmount}
        />
      )}

      <AnimatePresence>
        {state.gameOver && (
          <GameOverOverlay
            state={state}
            onRestart={() => online.session?.isHost && online.restartGame()}
            onLeave={leave}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ---------- Router ----------

const Game: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  if (gameId?.startsWith('online-')) {
    return <OnlineGame roomId={gameId.slice('online-'.length)} />;
  }
  return <LocalGame />;
};

export default Game;
