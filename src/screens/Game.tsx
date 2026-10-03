import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import Badge from '../components/Badge';
import PokerCard from '../components/PokerCard';
import type { GamePhase, CardRank, Suit } from '../types';
import { PokerGame, type PokerState } from '../game/poker';
import { PHASE_LABELS } from '../game/gameState';
import { evaluateHand, getRelevantCards } from '../game/hands';
import { calculateEquity } from '../game/equity';
import { PERSONALITIES } from '../ai/personalities';
import { createAIPlayer, getAIAction, type AIPlayer } from '../ai/aiPlayer';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useUserStore } from '../store/userStore';
import { saveGame, loadSavedGame, clearSavedGame } from '../game/saveGame';

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
      <button
        className="fixed right-4 top-4 z-100 flex size-9 cursor-pointer items-center justify-center rounded-full border border-bone/[0.18] bg-bone/[0.06] text-fs-400 text-bone transition-[transform,background-color] duration-[240ms] ease-brand hover:-translate-y-0.5 hover:bg-bone/12 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone"
        aria-label="Menú de partida"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        ⋮
      </button>
      {open && (
        <div className="fixed right-4 top-14 z-101 min-w-40 rounded-xl border border-bone/[0.18] bg-ink p-2 shadow-[0_0.5rem_2rem_rgba(0,0,0,0.4)]">
          <button
            className="block w-full cursor-pointer rounded-lg px-[0.875rem] py-[0.625rem] text-left font-display font-bold text-fs-100 tracking-[0.1em] uppercase text-bone transition-colors duration-[160ms] ease-brand hover:bg-bone/[0.08]"
            onClick={onLeave}
          >
            Salir de la partida
          </button>
        </div>
      )}
    </div>
  );
};

const TimerBar: React.FC<{ seconds: number; max: number }> = ({ seconds, max }) => {
  const pct = (seconds / max) * 100;
  return (
    <div className="absolute -bottom-2 left-0 right-0 h-[3px] overflow-hidden rounded-sm bg-bone/10">
      <div
        className="h-full rounded-sm bg-bone transition-[width] duration-1000 ease-linear"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

const BlindDot: React.FC<{ role: 'dealer' | 'sb' | 'bb' }> = ({ role }) => (
  <span
    className={`inline-flex size-[1.125rem] shrink-0 items-center justify-center rounded-full font-display font-bold text-fs-100 tracking-[0.04em] max-md:size-3.5 ${
      role === 'dealer'
        ? 'bg-bone text-ink'
        : role === 'sb'
          ? 'bg-info/20 text-info'
          : 'bg-danger/20 text-danger'
    }`}
  >
    {role === 'dealer' ? 'D' : role.toUpperCase()}
  </span>
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
  if (isWinner) return <Badge variant="neutral">Ganador</Badge>;
  if (isActive && !handOver) return <Badge variant="turn">Turno</Badge>;
  if (bet > 0) return <Badge variant="info">Apuesta: <strong>{bet}</strong></Badge>;
  if (lastAction && lastAction !== '—' && lastAction !== 'Se retiró' && lastAction !== 'Eliminado') {
    return <Badge variant="neutral" className="opacity-70">{lastAction}</Badge>;
  }
  return null;
};

// ---------- Slot de rival ----------

interface RivalSlotProps {
  name: string;
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
      <div
        className={`relative flex flex-col items-center gap-2.5 rounded-slot border border-bone/[0.18] bg-transparent px-5 py-[1.125rem] opacity-25 ${
          compact ? 'min-w-[90px]' : 'min-w-[130px]'
        }`}
      >
        <span className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase">{name}</span>
        <span className="font-body tracking-[0.04em] opacity-70 text-fs-100">Eliminado</span>
      </div>
    );
  }

  const cardSize = compact ? 'xs' : 'sm';
  return (
    <div
      className={[
        'relative flex flex-col items-center rounded-slot border bg-transparent',
        compact ? 'min-w-[90px] gap-1 rounded-[10px] px-2.5 py-2' : 'min-w-[130px] gap-2.5 px-5 py-[1.125rem]',
        isActive ? 'border-bone shadow-[0_0_0_0.375rem_rgba(205,197,183,0.1)]' : 'border-bone/[0.18]',
        folded ? 'opacity-[0.32]' : '',
        isWinner ? 'border-bone bg-bone/[0.06]' : '',
      ].join(' ')}
    >
      {isActive && !handOver && thinking && (
        <div className="absolute -bottom-2 left-0 right-0 h-[3px] overflow-hidden rounded-sm bg-bone/10" key={`think-${name}-${bet}-${lastAction}`}>
          <div className="h-full w-full bg-bone animate-timer-drain" />
        </div>
      )}

      <div className="flex items-center gap-1">
        {blindRole && <BlindDot role={blindRole} />}
        <span className={compact ? 'font-display font-bold text-fs-100 tracking-normal normal-case' : 'font-display font-bold leading-none text-fs-200'}>{name}</span>
      </div>

      <div className="flex items-center gap-0.5">
        <span className="text-fs-200 opacity-50 max-md:text-fs-100">🪙</span>
        <span className={`font-display font-bold text-fs-300 max-md:text-fs-100 ${chips < 100 ? 'text-danger' : ''}`}>{chips}</span>
        <AnimatePresence>
          {winAmount > 0 && (
            <motion.span
              key={`win-${winAmount}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="ml-1 font-display font-bold text-fs-200 text-success"
            >
              +{winAmount}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {isAllIn && <Badge variant="warning">ALL-IN</Badge>}

      <div className={`flex ${compact ? 'gap-0' : 'gap-1'}`}>
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
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="inline-flex rounded-pill border border-bone/[0.18] px-[0.875rem] py-1 font-display font-bold text-fs-100 tracking-[0.14em] uppercase max-md:px-2.5 max-md:py-0.5">
          {PHASE_LABELS[phase] || phase}
        </span>
        <span className="font-body tracking-[0.04em] opacity-70 text-fs-100">Mano #{handNumber}</span>
      </div>

      <div className={`flex justify-center ${cardSize === 'xxl' ? 'gap-3' : 'gap-2'}`}>
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
          return <div key={i} className="rounded-[0.625rem] border-[1.5px] border-dashed border-bone/[0.14]" style={{ width: slotW, height: slotH }} />;
        })}
      </div>

      <motion.div
        className="flex items-center gap-2 rounded-pill bg-bone/[0.06] px-4 py-1.5 font-display font-bold text-fs-200 tracking-[0.06em]"
        key={pot}
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.25 }}
      >
        <span className="opacity-50">Bote</span>
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
    <div className="flex min-h-5 flex-col items-center gap-0.5">
      {recent.map((a, i) => {
        const p = state.players[a.playerIndex];
        return (
          <div
            key={`${a.timestamp}-${i}`}
            className="font-body text-fs-100 text-bone"
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
    <div className="absolute bottom-[calc(100%+0.5rem)] right-0 z-50 flex min-w-[12.5rem] flex-col gap-2.5 rounded-xl border border-bone/[0.18] bg-ink p-4 shadow-[0_0.5rem_2rem_rgba(0,0,0,0.4)]">
      <div className="flex flex-wrap justify-center gap-1">
        {quickAmounts.map((qa) => {
          const val = Math.min(qa.value, maxRaise);
          return (
            <button
              key={qa.label}
              onClick={() => onRaiseChange(val)}
              className={`cursor-pointer rounded-lg border bg-transparent px-2.5 py-1 font-display font-bold text-fs-200 text-bone transition-[transform,border-color,background-color] duration-[160ms] ease-brand hover:-translate-y-0.5 hover:border-bone active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone ${
                raiseAmount === val ? 'border-bone bg-bone/12' : 'border-bone/[0.18]'
              }`}
            >
              {qa.label}
            </button>
          );
        })}
      </div>

      <div className="flex w-full max-w-60 items-center gap-2">
        <span className="font-body tracking-[0.04em] opacity-70 min-w-6 text-fs-100">{minRaise}</span>
        <input
          type="range"
          min={minRaise}
          max={maxRaise}
          value={raiseAmount}
          onChange={(e) => onRaiseChange(Number(e.target.value))}
          className="flex-1 cursor-pointer"
        />
        <span className="min-w-[1.875rem] text-center font-display font-bold text-fs-300">{raiseAmount}</span>
      </div>

      <Button variant="primary" size="sm" onClick={onRaise}>
        {raiseAmount >= allInAmount ? `All-in ${playerChips}` : `Subir ${raiseAmount}`}
      </Button>
    </div>
  );
};

const RaiseSheet: React.FC<RaisePanelProps & { onClose: () => void }> = (props) => {
  return (
    <div className="fixed inset-0 z-200 flex items-end justify-center bg-black/60" onClick={props.onClose}>
      <div
        className="flex w-full max-w-[25rem] flex-col gap-4 rounded-t-[1.25rem] border border-b-[0] border-bone/[0.18] bg-ink px-5 pb-8 pt-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-9 self-center rounded-sm bg-bone/20" />
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
      className="fixed inset-0 z-300 flex items-center justify-center bg-ink-900/85 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="flex w-[calc(100%-3rem)] max-w-[26.25rem] flex-col items-center gap-5 rounded-md border border-bone/[0.18] bg-ink px-10 py-9 text-center"
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
      >
        <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">Fin de la partida · {state.handNumber} manos</div>
        <div className="font-display font-bold leading-none tracking-[-0.01em] text-fs-700">
          {humanWon ? '¡Has ganado la mesa!' : `${standings[0].name} gana la mesa`}
        </div>

        <div className="flex w-full flex-col gap-2">
          {standings.map((p, i) => (
            <div
              key={p.id}
              className={`flex w-full items-center justify-between rounded-[0.625rem] border border-bone/[0.18] px-[0.875rem] py-[0.625rem] ${
                i === 0 ? 'border-bone bg-bone text-ink' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase">{i + 1}.º</span>
                <span className="font-body leading-[1.45] text-fs-300">{p.name}{p.id === 0 ? ' (tú)' : ''}</span>
              </div>
              <span className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase">🪙 {p.chips}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
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
  const [searchParams] = useSearchParams();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const user = useUserStore(s => s.user);

  const gameRef = useRef<PokerGame | null>(null);
  const [gameState, setGameState] = useState<PokerState | null>(null);
  const [aiPlayers, setAiPlayers] = useState<AIPlayer[]>([]);
  const [raiseAmount, setRaiseAmount] = useState(20);
  const [showRaise, setShowRaise] = useState(false);
  const [showEquity, setShowEquity] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(TURN_DURATION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isLocal = !!gameId && gameId.startsWith('local-');

  // ---- Inicialización (nueva partida o reanudar) ----
  useEffect(() => {
    if (!isLocal || !gameId) return;

    const shouldResume = searchParams.get('continue') === '1';
    const saved = shouldResume ? loadSavedGame() : null;

    if (saved && saved.gameId === gameId) {
      try {
        const g = PokerGame.deserialize(saved.state);
        const personalities = PERSONALITIES[saved.difficulty] ?? PERSONALITIES[getDifficulty(gameId)];
        const ais = personalities.map((p, i) => createAIPlayer(i + 1, p));
        gameRef.current = g;
        setAiPlayers(ais);
        const resumed = g.getState();
        setRaiseAmount(resumed.minRaise);
        setGameState(resumed);
        return;
      } catch {
        clearSavedGame();
      }
    }

    const diff = getDifficulty(gameId);
    const personalities = PERSONALITIES[diff];
    const names = [user.username, ...personalities.map(p => p.name)];
    const g = new PokerGame(4, 10, 20, names);
    const ais = personalities.map((p, i) => createAIPlayer(i + 1, p));

    gameRef.current = g;
    setAiPlayers(ais);

    g.startHand();
    clearSavedGame();
    const initial = g.getState();
    setRaiseAmount(initial.minRaise);
    setGameState(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, isLocal]);

  // ---- Persistir la partida en curso ----
  useEffect(() => {
    if (!isLocal || !gameId || !gameState || !gameRef.current) return;
    if (gameState.gameOver) {
      clearSavedGame();
      return;
    }
    saveGame({
      gameId,
      difficulty: getDifficulty(gameId),
      state: gameRef.current.serialize(),
    });
  }, [gameState, isLocal, gameId]);

  // Mantén la cantidad de subida dentro de [minRaise, maxRaise]
  useEffect(() => {
    if (!gameState || gameState.handOver) return;
    const humanPlayer = gameState.players[0];
    const tableMaxBet = Math.max(0, ...gameState.players.map(p => p.bet));
    const toCall = Math.max(0, tableMaxBet - humanPlayer.bet);
    const maxR = Math.max(0, humanPlayer.chips - toCall);
    setRaiseAmount(prev => {
      const lower = Math.max(prev, gameState.minRaise);
      return maxR >= gameState.minRaise ? Math.min(lower, maxR) : gameState.minRaise;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

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
    g.reset();
    g.startHand();
    updateState();
  };

  // ---- Equity del jugador humano (opcional) ----
  const humanEquity = useMemo(() => {
    if (!showEquity || !gameState || gameState.handOver) return null;
    const human = gameState.players[0];
    if (human.cards.length < 2 || human.folded) return null;
    const opponents = gameState.players.filter((p, i) => i !== 0 && !p.folded && !p.eliminated).length;
    if (opponents === 0) return null;
    const sims = gameState.community.length >= 4 ? 300 : 400;
    return calculateEquity(human.cards, gameState.community, Math.max(1, opponents), sims);
  }, [showEquity, gameState]);

  // ---- Guards de render ----

  if (!isLocal) {
    return (
      <div className="relative flex h-screen w-full flex-col overflow-hidden bg-ink font-body text-fs-300 leading-[1.25] text-bone">
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="font-display font-bold leading-none tracking-[-0.01em] text-fs-700">Juego no disponible</div>
          <div className="font-body leading-[1.45] text-fs-300 opacity-40">
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
      <div className="relative flex h-screen w-full flex-col overflow-hidden bg-ink font-body text-fs-300 leading-[1.25] text-bone">
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="font-display font-bold leading-none tracking-[-0.01em] text-fs-700">Cargando partida...</div>
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
        className="flex flex-wrap items-center justify-center gap-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <span className="font-display font-bold leading-none text-fs-400 text-bone">
          <strong>{winnerData.label}</strong>
        </span>
      </motion.div>
    );
  };

  const humanInfo = (
    <div className={`flex flex-col items-center gap-1 ${isMobile ? '' : 'min-w-[140px]'}`}>
      <div className="flex items-center gap-1">
        {blindRoleFor(0) && <BlindDot role={blindRoleFor(0)!} />}
        <span className={isMobile ? 'font-display font-bold text-fs-100 tracking-normal normal-case' : 'font-display font-bold leading-none text-fs-400'}>{human.name}</span>
      </div>
      <div className="flex items-center gap-0.5">
        <span className="text-fs-200 opacity-50 max-md:text-fs-100">🪙</span>
        <span className={`font-display font-bold text-fs-300 max-md:text-fs-100 ${human.chips < 100 ? 'text-danger' : ''}`}>{human.chips}</span>
        <AnimatePresence>
          {!handOver && human.bet > 0 && (
            <motion.span
              key={`spent-${human.bet}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="ml-1 font-display font-bold text-fs-200 text-danger opacity-90"
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
              className="ml-1 font-display font-bold text-fs-200 text-success"
            >
              +{state.winAmounts[0]}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {human.isAllIn && <Badge variant="warning">ALL-IN</Badge>}
    </div>
  );

  const humanCards = (
    <div className="flex flex-col items-center gap-1">
      {humanHandName && !handOver && (
        <Badge variant="neutral">{humanHandName}</Badge>
      )}
      <div className="flex gap-2">
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
        <div className="flex flex-col gap-1 rounded-[0.625rem] border border-bone/[0.18] bg-bone/[0.04] px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="font-display font-bold text-fs-100 text-bone opacity-80">{humanEquity.winPct}%</span>
            <div className="h-1 flex-1 overflow-hidden rounded-sm bg-bone/10">
              <div className="h-full rounded-sm bg-bone transition-[width] duration-300 ease-brand" style={{ width: `${humanEquity.winPct}%` }} />
            </div>
          </div>
          <span className="font-body text-fs-100 tracking-[0.04em] opacity-70">prob. de ganar{humanEquity.tiePct > 0 ? ` · empate ${humanEquity.tiePct}%` : ''}</span>
        </div>
      )}
    </div>
  );

  const actionButtons = handOver ? (
    <div className="flex flex-col items-center gap-2">
      <WinnerMessage />
      {!state.gameOver && (
        <Button variant="primary" size="sm" onClick={startNewHand}>
          Nueva Mano
        </Button>
      )}
    </div>
  ) : (
    <div className="flex justify-center gap-2">
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
      className={`fixed right-[3.875rem] top-4 z-100 flex size-9 cursor-pointer items-center justify-center rounded-full border font-display font-bold text-fs-200 text-bone transition-[transform,background-color,border-color] duration-[240ms] ease-brand hover:-translate-y-0.5 hover:bg-bone/12 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone ${
        showEquity ? 'border-bone bg-bone/16' : 'border-bone/[0.18] bg-bone/[0.06]'
      }`}
      onClick={() => setShowEquity(v => !v)}
      title="Mostrar probabilidad de ganar"
      aria-label="Mostrar probabilidad de ganar"
      aria-pressed={showEquity}
    >
      %
    </button>
  );

  // ---------- MÓVIL ----------

  if (isMobile) {
    return (
      <div className="relative flex h-screen w-full flex-col overflow-hidden bg-ink font-body text-fs-300 leading-[1.25] text-bone">
        <FloatingMenu onLeave={() => navigate('/')} />
        {equityToggle}

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-[0.875rem] py-3">
          <div className="flex flex-wrap justify-center gap-2">
            {rivals.map((r) => (
              <RivalSlot
                key={r.id}
                compact
                name={r.name}
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

          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-3">
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

          <div className="flex flex-col items-center gap-3">
            {humanCards}
            {humanInfo}

            {activePlayer === 0 && !handOver && (
              <div className="w-4/5">
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
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-ink font-body text-fs-300 leading-[1.25] text-bone">
      <FloatingMenu onLeave={() => navigate('/')} />
      {equityToggle}

      <div className="flex flex-1 flex-col px-12 pb-6 pt-4">
        <div className="flex justify-center gap-4">
          {rivals.map((r) => (
            <RivalSlot
              key={r.id}
              name={r.name}
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

        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-6">
          <CommunityRow
            phase={phase}
            community={state.community}
            pot={pot}
            handNumber={state.handNumber}
            isDimmed={isDimmed}
          />
          <ActionLog state={state} />
        </div>

        <div className="relative flex items-end justify-between pb-5">
          {activePlayer === 0 && !handOver && <TimerBar seconds={timerSeconds} max={TURN_DURATION} />}

          {humanInfo}

          <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
            {humanCards}
          </div>

          <div className="flex min-w-[200px] flex-col items-center gap-2">
            {handOver ? (
              actionButtons
            ) : (
              <div className="flex gap-2">
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
                <div className="relative">
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

// ---------- Router ----------

const Game: React.FC = () => {
  return <LocalGame />;
};

export default Game;
