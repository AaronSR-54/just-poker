import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import PokerCard from '../components/PokerCard';
import type { GamePhase, CardRank, Suit, ButtonSize } from '../types';
import { PokerGame, type PokerState } from '../game/poker';
import { PHASE_LABEL_KEYS } from '../game/gameState';
import { evaluateHand, getRelevantCards, HAND_RANKS } from '../game/hands';
import { PERSONALITIES, getActionDelay } from '../ai/personalities';
import { createAIPlayer, getAIAction, type AIPlayer } from '../ai/aiPlayer';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useUserStore } from '../store/userStore';
import { saveGame, loadSavedGame, clearSavedGame } from '../game/saveGame';
import { rivalAvatar, rivalAliasKey, DIFFICULTY_AVATAR_TONE } from '../game/rivals';
import ChipIcon from '../components/ChipIcon';
import PotAward, { type PotAwardData } from '../components/PotAward';
import PositionChip from '../components/PositionChip';
import TutorialCoach from '../components/TutorialCoach';
import { buildTutorialDeck, tutorialAIAction } from '../game/tutorial';
import GameSettings from '../components/GameSettings';
import ConfirmDialog from '../components/ConfirmDialog';
import SettingsButton from '../components/SettingsButton';
import { useSettingsStore, speedFactor } from '../store/settingsStore';
import { container, fadeUp, popIn, t as motionT, setMotionScale } from '../animations/motion';
import { useI18n } from '../i18n';
import { playSfx } from '../audio/sfx';
import { useGameSounds } from '../hooks/useGameSounds';

const TURN_DURATION = 30;
/** Pausa entre rondas de apuestas antes de repartir la siguiente calle. */
const STREET_DELAY = 900;

/** Pausa tras el showdown antes de abrir el overlay de fin de partida. */
const GAME_OVER_DELAY = 2200;

type Difficulty = 'easy' | 'medium' | 'hard';

function getDifficulty(gameId: string): Difficulty {
  if (gameId.includes('medium')) return 'medium';
  if (gameId.includes('hard')) return 'hard';
  return 'easy';
}

/** Anillo del avatar de los rivales según la dificultad, para darle más presencia. */
const DIFFICULTY_AVATAR_RING: Record<Difficulty, string> = {
  easy: 'ring-success/45',
  medium: 'ring-bone/35',
  hard: 'ring-danger/50',
};

// ---------- Componentes pequeños ----------

const TimerBar: React.FC<{ duration: number; className?: string; paused?: boolean }> = ({ duration, className = '', paused = false }) => (
  <div className={`h-[3px] overflow-hidden rounded-pill bg-bone/10 ${className}`}>
    <div
      className="h-full w-full animate-timer-drain rounded-pill bg-bone"
      style={{ animationDuration: `${duration}ms`, animationPlayState: paused ? 'paused' : 'running' }}
    />
  </div>
);

// ---------- Slot de rival ----------

/** Delta de fichas ganadas/gastadas en la mano, mostrado bajo el total del jugador. */
const DeltaLine: React.FC<{ amount: number; filled?: boolean; className?: string }> = ({ amount, filled = false, className = '' }) => {
  const color = amount > 0
    ? (filled ? 'text-success-bone' : 'text-success')
    : (filled ? 'text-danger-bone' : 'text-danger');
  return (
    <div className={`flex items-center justify-center leading-none ${className}`}>
      {amount !== 0 && (
        <motion.span
          key={amount}
          initial={{ opacity: 0, y: amount > 0 ? 6 : -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={motionT(0.24)}
          className={`font-display font-bold text-fs-100 ${color}`}
        >
          {amount > 0 ? `+${amount}` : `−${Math.abs(amount)}`}
        </motion.span>
      )}
    </div>
  );
};

interface RivalSlotProps {
  name: string;
  folded?: boolean;
  eliminated?: boolean;
  isActive?: boolean;
  isWinner?: boolean;
  chips?: number;
  /** Fichas ganadas (+) o gastadas (−) en la mano. */
  delta?: number;
  isAllIn?: boolean;
  handOver?: boolean;
  blindRole?: 'dealer' | 'sb' | 'bb' | null;
  compact?: boolean;
  /** Tinte del avatar según la dificultad (mismo que en la pantalla local). */
  avatarTone?: string;
  avatarImgClassName?: string;
  /** Anillo del avatar según la dificultad. */
  avatarRing?: string;
  /** Duración (ms) del turno activo; si se define, se muestra la barra. */
  timerDuration?: number;
  /** Cambia por turno para reiniciar la animación de la barra. */
  timerKey?: string;
  /** Retardo de entrada para escalonar los slots de la mesa. */
  enterDelay?: number;
  /** Valor de `data-tour` para que el coach del tutorial pueda señalar el asiento. */
  dataTour?: string;
}

/**
 * Tarjeta de jugador con altura fija: todos los elementos ocupan su lugar
 * siempre, y los estados se expresan con color/opacidad, nunca apareciendo
 * o desapareciendo elementos que muevan el layout.
 */
const RivalSlot: React.FC<RivalSlotProps> = ({
  name,
  folded = false,
  eliminated = false,
  isActive = false,
  isWinner = false,
  chips = 0,
  delta = 0,
  isAllIn = false,
  handOver = false,
  blindRole = null,
  compact = false,
  avatarTone,
  avatarImgClassName,
  avatarRing,
  timerDuration,
  timerKey,
  enterDelay = 0,
  dataTour,
}) => {
  const { t } = useI18n();
  const aliasKey = rivalAliasKey(name);
  const filled = isWinner;
  const dimmed = eliminated || folded;
  // En all-in se muestra la etiqueta en lugar del total, que quedaría a 0.
  const showAllIn = isAllIn && !handOver;

  return (
    <motion.div
      data-tour={dataTour}
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={{ opacity: dimmed ? 0.32 : 1, y: 0, scale: isWinner ? 1.03 : 1 }}
      transition={motionT(0.35, enterDelay)}
      className={[
        'relative flex flex-col items-center rounded-slot border text-center',
        compact ? 'w-[min(104px,28vw)] gap-2 rounded-[10px] px-3 py-3' : 'w-[150px] gap-3.5 px-6 py-5',
        filled
          ? 'border-bone bg-bone text-ink'
          : isActive && !handOver
            ? 'border-bone bg-ink animate-turn-pulse'
            : 'border-bone/[0.18] bg-ink',
      ].join(' ')}
    >
      {isActive && !handOver && timerDuration !== undefined && (
        <TimerBar key={timerKey} duration={timerDuration} className="absolute -bottom-2 inset-x-4" />
      )}

      <span className={`inline-flex shrink-0 rounded-full ring-1 ${avatarRing ?? 'ring-bone/20'}`}>
        <Avatar name={name} src={rivalAvatar(name)} size={compact ? 48 : 64} tone={avatarTone} imgClassName={avatarImgClassName} />
      </span>

      <div className="flex w-full flex-col items-center gap-1">
        <div className="flex w-full min-w-0 items-center justify-center gap-1.5">
          <div className="min-w-0 truncate font-display font-bold leading-none text-fs-200">{name}</div>
          {blindRole && (
            <span
              className="shrink-0"
              data-tour={blindRole === 'sb' ? 'small-blind' : blindRole === 'bb' ? 'big-blind' : undefined}
            >
              <PositionChip role={blindRole} filled={filled} />
            </span>
          )}
        </div>
        <div className="max-w-full truncate font-body text-fs-100 italic opacity-70">{aliasKey ? `“${t(aliasKey)}”` : ''}</div>
      </div>

      <div className="relative flex w-full items-center justify-center gap-0.5 pb-2">
        <span data-chips className="inline-flex">
          <ChipIcon className={`size-5 ${filled ? 'text-ink' : 'text-bone'}`} />
        </span>
        <div className="relative flex flex-col items-center">
          {showAllIn ? (
            <span className={`flex h-5 items-center font-display font-bold text-fs-200 ${filled ? 'text-danger-bone' : 'text-danger'}`}>ALL-IN</span>
          ) : (
            <span className={`flex items-center whitespace-nowrap font-display font-bold leading-none tabular-nums text-fs-200 ${chips < 100 && !filled ? 'text-danger' : ''}`}>{chips}</span>
          )}
          <div className="absolute left-1/2 top-full -translate-x-1/2">
            <DeltaLine amount={showAllIn ? 0 : delta} filled={filled} className="whitespace-nowrap" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/** Cartas boca arriba de un rival, mostradas debajo de su tarjeta en el showdown. */
const ShowdownCards: React.FC<{
  cards: { rank: CardRank; suit: Suit }[];
  size: 'xs' | 'sm' | 'md';
  isDimmed?: (card: { rank: CardRank; suit: Suit }) => boolean;
}> = ({ cards, size, isDimmed }) => (
  <motion.div
    className="flex justify-center gap-1"
    variants={container(0.07)}
    initial="hidden"
    animate="visible"
  >
    {cards.map((c, i) => (
      <motion.div key={i} variants={popIn}>
        <PokerCard
          size={size}
          rank={c.rank}
          suit={c.suit}
          dimmed={isDimmed?.(c)}
        />
      </motion.div>
    ))}
  </motion.div>
);

/** Nombre de la jugada (p. ej. "Color"). Resalta cuando es la mano ganadora. */
const HandLabel: React.FC<{ name: string; winner?: boolean; className?: string }> = ({ name, winner = false, className = '' }) => {
  if (!name) return null;
  if (winner) {
    return (
      <span className={`whitespace-nowrap font-display font-bold text-fs-100 uppercase tracking-[0.04em] text-bone ${className}`}>
        {name}
      </span>
    );
  }
  return (
    <span className={`whitespace-nowrap font-display text-fs-100 uppercase tracking-[0.04em] opacity-70 ${className}`}>{name}</span>
  );
};

// ---------- Zona comunitaria ----------

const COMMUNITY_SLOT: Record<'md' | 'xxl', { w: string; h: string; gap: string }> = {
  md: { w: 'w-[min(4rem,16vw)]', h: 'h-[min(5.625rem,22.4vw)]', gap: 'gap-1.5' },
  xxl: { w: 'w-[min(8.125rem,15vw)]', h: 'h-[min(11.375rem,21vw)]', gap: 'gap-3' },
};

const CommunityRow: React.FC<{
  phase: GamePhase;
  community: { rank: CardRank; suit: Suit }[];
  pot: number;
  /** El bote se ha agotado (0): se desvanece tras terminar de repartirse. */
  potAwarded?: boolean;
  /** La mano ha terminado: el bote se resta sin rebotar en cada tick. */
  potLocked?: boolean;
  cardSize?: 'md' | 'xxl';
  isDimmed?: (card: { rank: CardRank; suit: Suit }) => boolean;
}> = ({ phase, community, pot, potAwarded = false, potLocked = false, cardSize = 'xxl', isDimmed }) => {
  const { t } = useI18n();
  const visibleCount = phase === 'pre-flop' ? 0 : phase === 'flop' ? 3 : phase === 'turn' ? 4 : 5;
  const slot = COMMUNITY_SLOT[cardSize];
  // Índice de la primera carta de la calle actual: el escalonado solo reparte
  // retardo entre las cartas recién descubiertas (las 3 del flop).
  const streetStart = phase === 'flop' ? 0 : phase === 'turn' ? 3 : 4;

  return (
    <div data-tour="board" className="flex flex-col items-center gap-3">
      <div data-tour="phase" className="flex h-7 items-center gap-2">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={phase}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={motionT(0.24)}
            className="inline-flex rounded-pill border border-bone/[0.18] bg-ink px-[0.875rem] py-1 font-display font-bold text-fs-100 tracking-[0.14em] uppercase max-md:px-2.5 max-md:py-0.5"
          >
            {t(PHASE_LABEL_KEYS[phase]) || phase}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className={`flex justify-center ${slot.gap}`}>
        {Array.from({ length: 5 }).map((_, i) => {
          if (i < visibleCount && community[i]) {
            const card = community[i];
            return (
              <motion.div
                key={`${card.rank}${card.suit}`}
                initial={{ opacity: 0, scale: 0.85, rotateY: 60 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                transition={motionT(0.35, (i - streetStart) * 0.1)}
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
          return <div key={i} className={`rounded-[0.625rem] border-[1.5px] border-dashed border-bone/[0.14] bg-ink/40 ${slot.w} ${slot.h}`} />;
        })}
      </div>

      <motion.div
        data-tour="pot"
        className="flex items-center gap-1.5 font-display font-bold text-fs-200 tracking-[0.06em]"
        key={potLocked ? 'pot' : pot}
        initial={{ scale: 1.1 }}
        animate={{ scale: potAwarded ? 0.9 : 1, opacity: potAwarded ? 0 : 1 }}
        transition={motionT(0.3)}
      >
        <span className="opacity-50">{t('game.pot')}</span>
        <span data-chips className="inline-flex">
          <ChipIcon className="size-5 text-bone" />
        </span>
        <span>{pot}</span>
      </motion.div>
    </div>
  );
};

// ---------- Log de acciones ----------

const ACTION_VERB_KEYS: Record<string, { third: string; second: string }> = {
  fold: { third: 'game.log.foldThird', second: 'game.log.foldSecond' },
  check: { third: 'game.log.checkThird', second: 'game.log.checkSecond' },
  call: { third: 'game.log.callThird', second: 'game.log.callSecond' },
  raise: { third: 'game.log.raiseThird', second: 'game.log.raiseSecond' },
  blind: { third: 'game.log.blindThird', second: 'game.log.blindSecond' },
};

const ActionLog: React.FC<{ state: PokerState; winnerName?: string; winnerHand?: string; winnerIsHuman?: boolean; compact?: boolean }> = ({
  state,
  winnerName = '',
  winnerHand = '',
  winnerIsHuman = false,
  compact = false,
}) => {
  const { t } = useI18n();
  const entries = state.actions.slice(-4).map(a => {
    const p = state.players[a.playerIndex];
    const verb = ACTION_VERB_KEYS[a.type];
    const isHuman = a.playerIndex === 0;
    const text = `${verb ? t(isHuman ? verb.second : verb.third) : a.type}${a.amount ? ` ${a.amount}` : ''}`;
    return { name: isHuman ? t('common.you') : p?.name ?? '?', text };
  });
  if (winnerName) {
    if (winnerIsHuman) {
      entries.push({ name: t('common.you'), text: winnerHand ? t('game.log.wonYouWith', { hand: winnerHand }) : t('game.log.wonYou') });
    } else {
      entries.push({ name: winnerName, text: winnerHand ? t('game.log.wonWith', { hand: winnerHand }) : t('game.log.won') });
    }
  }

  // En móvil solo se muestra la última entrada, pero el alto queda reservado
  // siempre (fila fija) para que la mesa no se desplace al aparecer/desaparecer.
  if (compact) {
    const line = entries[entries.length - 1];
    return (
      <div className="flex flex-col items-start gap-0.5 text-left">
        <div className="font-body text-fs-100 tracking-[0.04em] opacity-50">{t('game.handNumber', { n: state.handNumber })}</div>
        <div className="flex h-4 w-full items-center">
          <AnimatePresence mode="wait">
            {line && (
              <motion.span
                key={`${line.name}-${line.text}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={motionT(0.2)}
                className="min-w-0 truncate whitespace-nowrap font-body text-fs-100 text-bone"
              >
                {line.name ? <><strong>{line.name}</strong> {line.text}</> : line.text}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  if (entries.length === 0) return null;
  const lines = entries.slice(-4);
  return (
    <div className="flex flex-col items-start gap-0.5 text-left">
      <div className="mb-0.5 font-body text-fs-100 tracking-[0.04em] opacity-50">{t('game.handNumber', { n: state.handNumber })}</div>
      {lines.map((line, i) => (
        <motion.div
          key={`${line.name}-${line.text}-${i}`}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 0.35 + (0.65 * (i + 1)) / lines.length, x: 0 }}
          transition={motionT(0.24)}
          className="font-body text-fs-100 text-bone"
        >
          {line.name ? <><strong>{line.name}</strong> {line.text}</> : line.text}
        </motion.div>
      ))}
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
  /** Bloquea el botón de confirmar (usado en la guía hasta elegir importe). */
  confirmDisabled?: boolean;
  /** En móvil los atajos ocupan todo el ancho y son más altos. */
  fill?: boolean;
}

const RaiseControls: React.FC<RaisePanelProps> = ({
  raiseAmount, onRaiseChange, onRaise, minRaise, maxRaise, potSize, playerChips, callAmount, confirmDisabled, fill = false,
}) => {
  const { t } = useI18n();
  const halfPot = Math.floor(potSize / 2);
  const allInAmount = Math.max(minRaise, playerChips - callAmount);
  const quickAmounts = [
    { label: t('game.quickMin'), value: minRaise },
    { label: t('game.quickHalf'), value: Math.max(minRaise, halfPot) },
    { label: t('game.quickPot'), value: Math.max(minRaise, potSize) },
    { label: t('game.quickAllIn'), value: allInAmount },
  ];

  return (
    <div data-tour="raise-panel" className="flex w-full flex-col gap-2.5">
      <div data-tour="raise-amount" className="flex w-full flex-col gap-2.5">
        <div
          data-tour="raise-quick"
          className={fill ? 'grid w-full grid-cols-4 gap-2' : 'flex flex-wrap justify-center gap-1'}
        >
          {quickAmounts.map((qa) => {
            const val = Math.min(qa.value, maxRaise);
            return (
              <button
                key={qa.label}
                onClick={() => onRaiseChange(val)}
                className={`flex cursor-pointer items-center justify-center rounded-full border bg-transparent font-display font-bold text-bone transition-[transform,border-color,background-color] duration-[160ms] ease-brand hover:-translate-y-0.5 hover:border-bone active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone ${
                  fill ? 'py-2 text-fs-200' : 'px-2.5 py-1 text-fs-200'
                } ${
                  raiseAmount === val ? 'border-bone bg-bone/12' : 'border-bone/[0.18]'
                }`}
              >
                {qa.label}
              </button>
            );
          })}
        </div>

        <div data-tour="raise-slider" className="flex w-full items-center gap-2">
          <span className="font-body tracking-[0.04em] opacity-70 min-w-6 text-fs-100">{minRaise}</span>
          <input
            type="range"
            min={minRaise}
            max={maxRaise}
            value={raiseAmount}
            onChange={(e) => onRaiseChange(Number(e.target.value))}
            className="flex-1 cursor-pointer"
          />
          <span className="min-w-[1.875rem] text-center font-display font-bold text-fs-300">{playerChips}</span>
        </div>
      </div>

      <Button data-tour="raise-confirm" variant="primary" size="sm" block onClick={onRaise} disabled={confirmDisabled}>
        {raiseAmount >= allInAmount ? t('game.allInAmount', { amount: playerChips }) : t('game.raiseAmount', { amount: raiseAmount })}
      </Button>
    </div>
  );
};

const RaisePanel: React.FC<RaisePanelProps> = (props) => (
  <motion.div
    initial={{ opacity: 0, y: 8, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={motionT(0.2)}
    className="absolute bottom-[calc(100%+0.5rem)] right-0 z-50 min-w-[12.5rem] max-w-72 origin-bottom-right rounded-[14px] border border-bone/[0.18] bg-ink p-4 shadow-[0_0.25rem_1rem_rgba(0,0,0,0.25)]"
  >
    <RaiseControls {...props} />
  </motion.div>
);

const RaiseSheet: React.FC<RaisePanelProps & { onClose: () => void }> = ({ onClose, ...props }) => {
  return (
    <motion.div
      className="fixed inset-0 z-200 flex items-end justify-center bg-black/60"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={motionT(0.2)}
      onClick={onClose}
    >
      <motion.div
        className="flex w-full max-w-[25rem] flex-col gap-4 rounded-t-[14px] border border-b-[0] border-bone/[0.18] bg-ink px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-6"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={motionT(0.32)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-9 self-center rounded-sm bg-bone/20" />
        <RaiseControls {...props} fill />
      </motion.div>
    </motion.div>
  );
};
// ---------- Overlay de fin de partida ----------

const GameOverOverlay: React.FC<{
  state: PokerState;
  onRestart: () => void;
  onSelectDifficulty: () => void;
  onHome: () => void;
}> = ({ state, onRestart, onSelectDifficulty, onHome }) => {
  const { t } = useI18n();
  const standings = [...state.players]
    .sort((a, b) => {
      if (a.id === state.gameWinner) return -1;
      if (b.id === state.gameWinner) return 1;
      return b.chips - a.chips;
    });
  const humanWon = state.gameWinner === 0;

  return (
    <motion.div
      className="fixed inset-0 z-300 flex items-center justify-center bg-ink-900/85"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: motionT(0.2) }}
      transition={motionT(0.35)}
    >
      <motion.div
        className="flex w-[calc(100%-3rem)] max-w-[26.25rem] flex-col items-center gap-5 rounded-[14px] border border-bone/[0.18] bg-ink px-10 py-9 text-center"
        initial={{ scale: 0.92, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 12, transition: motionT(0.2) }}
        transition={motionT(0.42, 0.1)}
      >
        <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">{t('game.overEyebrow', { n: state.handNumber })}</div>
        <div className="font-display font-bold leading-none tracking-[-0.01em] text-fs-700">
          {humanWon ? t('game.overWon') : t('game.overLost')}
        </div>

        <motion.div
          variants={container(0.08, 0.25)}
          initial="hidden"
          animate="visible"
          className="flex w-full flex-col gap-2"
        >
          {standings.map((p, i) => (
            <motion.div
              key={p.id}
              variants={fadeUp}
              className={`flex w-full items-center justify-between rounded-[0.625rem] border border-bone/[0.18] px-[0.875rem] py-[0.625rem] ${
                p.id === 0 ? 'border-bone bg-bone text-ink' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase">{t('game.place', { n: i + 1 })}</span>
                <span className={`font-body leading-[1.45] text-fs-300${p.id === 0 ? ' font-bold' : ''}`}>{p.id === 0 ? t('common.you') : p.name}</span>
              </div>
              <span className="inline-flex items-center gap-1 font-display font-bold text-fs-100 tracking-[0.14em] uppercase">
                <ChipIcon className={`size-5 ${p.id === 0 ? 'text-ink' : 'text-bone'}`} /> {p.chips}
              </span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={container(0.06, 0.5)}
          initial="hidden"
          animate="visible"
          className="flex w-full flex-col gap-2 border-t border-bone/[0.18] pt-5"
        >
          <motion.div variants={fadeUp}>
            <Button variant="primary" block onClick={onRestart}>{t('game.newGame')}</Button>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Button variant="outline" block onClick={onSelectDifficulty}>{t('game.selectDifficulty')}</Button>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Button variant="ghost" size="sm" block onClick={onHome}>{t('game.backHome')}</Button>
          </motion.div>
        </motion.div>
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
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  /** Pantallas bajas (tablet apaisada o ventanas compactas): comprime la mesa para que quepa de alto. */
  const isShort = useMediaQuery('(max-height: 720px)');
  const user = useUserStore(s => s.user);
  const completeOnboarding = useUserStore(s => s.completeOnboarding);
  const { t } = useI18n();

  const gameRef = useRef<PokerGame | null>(null);
  const [gameState, setGameState] = useState<PokerState | null>(null);
  const [aiPlayers, setAiPlayers] = useState<AIPlayer[]>([]);
  const [raiseAmount, setRaiseAmount] = useState(20);
  const [showRaise, setShowRaise] = useState(false);
  const [expectedAction, setExpectedAction] = useState<'call' | 'check' | 'raise' | null>(null);
  const [raiseTouched, setRaiseTouched] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(TURN_DURATION);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Segundos restantes del turno, fuera de React para evitar lecturas obsoletas. */
  const timerSecondsRef = useRef(TURN_DURATION);
  const [aiTurn, setAiTurn] = useState<{ playerIndex: number; duration: number } | null>(null);
  const [tutorialRun, setTutorialRun] = useState(0);
  const [tutorialReady, setTutorialReady] = useState(false);
  const [coachPaused, setCoachPaused] = useState(false);
  const [gameOverModal, setGameOverModal] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [potAward, setPotAward] = useState<PotAwardData | null>(null);
  const [awardProgress, setAwardProgress] = useState<Record<number, number>>({});
  /** Bote que queda por repartir: se resta conforme aterrizan las fichas. */
  const [potRemaining, setPotRemaining] = useState<number | null>(null);
  const awardedHandRef = useRef<number | null>(null);
  const gameOverTimerRef = useRef<number | null>(null);
  const streetTimerRef = useRef<number | null>(null);
  const gameSpeed = useSettingsStore((s) => s.gameSpeed);
  const speed = speedFactor(gameSpeed);
  /** Duración real (ms) del turno humano, escalada por la velocidad de juego. */
  const turnDurationMs = TURN_DURATION * 1000 * speed;

  useGameSounds(gameState);

  // Aplica la velocidad de juego a las animaciones (framer-motion).
  useEffect(() => {
    setMotionScale(speed);
    return () => setMotionScale(1);
  }, [speed]);

  /**
   * Sincroniza el estado de la partida con la UI. Si la ronda acaba de cerrarse
   * (streetPending), mantiene las apuestas en la mesa durante una breve pausa
   * antes de repartir la siguiente calle.
   */
  const commitState = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    const s = g.getState();
    setGameState(s);
    if (streetTimerRef.current) {
      window.clearTimeout(streetTimerRef.current);
      streetTimerRef.current = null;
    }
    if (s.streetPending) {
      streetTimerRef.current = window.setTimeout(() => {
        streetTimerRef.current = null;
        const current = gameRef.current;
        if (!current) return;
        current.resolveStreet();
        setGameState(current.getState());
      }, STREET_DELAY * speedFactor(useSettingsStore.getState().gameSpeed));
    }
  }, []);

  useEffect(() => () => {
    if (streetTimerRef.current) window.clearTimeout(streetTimerRef.current);
  }, []);

  const isTutorial = gameId === 'guide';
  const isLocal = (!!gameId && gameId.startsWith('local-')) || isTutorial;

  // ---- Inicialización (nueva partida o reanudar) ----
  useEffect(() => {
    if (!isLocal || !gameId) return;

    if (isTutorial) {
      const g = new PokerGame(4, 10, 20, ['Tú', 'Mia', 'Dan', 'Sam']);
      g.setDeck(buildTutorialDeck());
      g.setAutoDeal(false);
      const ais = PERSONALITIES.easy.map((p, i) => createAIPlayer(i + 1, p));
      gameRef.current = g;
      setAiPlayers(ais);
      g.startHand();
      setRaiseAmount(g.getState().minRaise);
      setGameState(g.getState());
      return;
    }

    const shouldResume = searchParams.get('continue') === '1';
    const saved = shouldResume ? loadSavedGame() : null;

    if (saved && saved.gameId === gameId) {
      try {
        const g = PokerGame.deserialize(saved.state);
        g.setAutoDeal(false);
        const personalities = PERSONALITIES[saved.difficulty] ?? PERSONALITIES[getDifficulty(gameId)];
        const ais = personalities.map((p, i) => createAIPlayer(i + 1, p));
        gameRef.current = g;
        setAiPlayers(ais);
        if (g.getState().streetPending) g.resolveStreet();
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
    g.setAutoDeal(false);
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
    if (isTutorial || !isLocal || !gameId || !gameState || !gameRef.current) return;
    const humanOut = gameState.handOver && (gameState.players[0].chips <= 0 || gameState.players[0].eliminated);
    if (gameState.gameOver || humanOut) {
      clearSavedGame();
      return;
    }
    saveGame({
      gameId,
      difficulty: getDifficulty(gameId),
      state: gameRef.current.serialize(),
    });
  }, [gameState, isLocal, gameId, isTutorial]);

  // ---- Animación de reparto del bote ----
  // Al terminar la mano, lanza las fichas del bote hacia cada ganador. Solo una
  // vez por mano (los ganadores pueden ser varios por side pots o botes divididos).
  useEffect(() => {
    if (!gameState) return;
    const { handOver, winner, handNumber, pot, bigBlind, winAmounts } = gameState;
    if (!handOver || !winner || winner.length === 0 || pot <= 0) return;
    if (awardedHandRef.current === handNumber) return;
    awardedHandRef.current = handNumber;
    setAwardProgress({});
    setPotRemaining(pot);
    setPotAward({
      handNumber,
      pot,
      unit: bigBlind,
      winners: winner.map(id => ({ id, amount: winAmounts[id] ?? 0 })),
    });
  }, [gameState]);

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
    const totalMs = turnDurationMs;
    const startedAt = Date.now();
    const totalSeconds = Math.ceil(totalMs / 1000);
    timerSecondsRef.current = totalSeconds;
    setTimerSeconds(totalSeconds);
    timerRef.current = setInterval(() => {
      const remainingMs = Math.max(0, totalMs - (Date.now() - startedAt));
      const seconds = Math.ceil(remainingMs / 1000);
      timerSecondsRef.current = seconds;
      setTimerSeconds(seconds);
      if (remainingMs > 0) return;

      // Al agotarse el tiempo, se resuelve el turno del humano aquí mismo. Así
      // no depende de un render posterior (que podía leer un 0 obsoleto y
      // retirar al jugador nada más empezar su turno).
      stopTimer();
      const g = gameRef.current;
      if (!g) return;
      const s = g.getState();
      if (s.currentPlayer !== 0 || s.handOver || s.streetPending) return;
      if (g.canCheck(0)) g.check(0);
      else g.fold(0);
      commitState();
      setShowRaise(false);
    }, 100);
  }, [stopTimer, commitState, turnDurationMs]);

  const currentPlayerIdx = gameState?.currentPlayer;
  const isHandOver = gameState?.handOver;
  const currentPhase = gameState?.phase;
  const isStreetPending = gameState?.streetPending;
  useEffect(() => {
    if (isTutorial || currentPlayerIdx === undefined || isHandOver === undefined) return;
    if (settingsOpen) {
      stopTimer();
      return;
    }
    if (currentPlayerIdx === 0 && !isHandOver && !isStreetPending) {
      startTimer();
    } else {
      stopTimer();
    }
    return stopTimer;
  }, [currentPlayerIdx, isHandOver, currentPhase, isStreetPending, startTimer, stopTimer, isTutorial, settingsOpen]);

  // Tic tac en los últimos segundos del turno y aviso al agotarse.
  const lastTimerCue = useRef(-1);
  useEffect(() => {
    if (isTutorial || settingsOpen) return;
    if (timerSeconds === lastTimerCue.current) return;
    lastTimerCue.current = timerSeconds;
    if (timerSeconds === 0) playSfx('time_expire');
    else if (timerSeconds <= 5) playSfx('timer_tick');
  }, [timerSeconds, isTutorial, settingsOpen]);

  // ---- Turnos de la IA ----
  useEffect(() => {
    const g = gameRef.current;
    if (!g || !gameState || isTutorial) return;
    if (settingsOpen) {
      setAiTurn(null);
      return;
    }

    const current = gameState.currentPlayer;
    if (current === 0 || gameState.handOver || gameState.streetPending) {
      setAiTurn(null);
      return;
    }

    const ai = aiPlayers.find(a => a.playerIndex === current);
    if (!ai) return;

    // El rival decide en el mismo tiempo que a ×1, escalado por la velocidad.
    const delay = getActionDelay(ai.personality) * speed;
    // Su barra dura lo mismo que la del jugador; como decide antes, nunca se agota.
    setAiTurn({ playerIndex: current, duration: turnDurationMs });

    let cancelled = false;
    let settled = false;

    const applyAction = (type: string, amount?: number) => {
      if (settled || cancelled || !gameRef.current) return;
      const currentState = gameRef.current.getState();
      if (currentState.currentPlayer !== current || currentState.handOver) return;
      settled = true;
      if (type === 'fold') gameRef.current.fold(current);
      else if (type === 'check') gameRef.current.check(current);
      else if (type === 'call') gameRef.current.call(current);
      else if (type === 'raise') gameRef.current.raise(current, amount || currentState.minRaise);
      commitState();
    };

    getAIAction(ai, gameState, delay).then((action) => applyAction(action.type, action.amount));

    // Red de seguridad: si la barra llegara a fallar, el rival nunca se retira;
    // pasa o iguala.
    const safety = window.setTimeout(() => {
      if (settled || cancelled) return;
      const g2 = gameRef.current;
      if (!g2) return;
      const s = g2.getState();
      if (s.currentPlayer !== current || s.handOver || s.streetPending) return;
      settled = true;
      if (g2.canCheck(current)) g2.check(current);
      else g2.call(current);
      commitState();
    }, turnDurationMs);

    return () => { cancelled = true; window.clearTimeout(safety); };
  }, [gameState, aiPlayers, isTutorial, commitState, settingsOpen, speed, turnDurationMs]);

  // ---- Turnos de la IA en la mano guiada: siempre pasa o iguala ----
  useEffect(() => {
    const g = gameRef.current;
    if (!g || !gameState || !isTutorial || !tutorialReady || coachPaused || settingsOpen) return;

    const current = gameState.currentPlayer;
    if (current === 0 || gameState.handOver || gameState.streetPending) {
      setAiTurn(null);
      return;
    }

    const ai = aiPlayers.find(a => a.playerIndex === current);
    const delay = (ai ? getActionDelay(ai.personality) : 800) * speed;
    // Su barra dura lo mismo que la del jugador; como decide antes, nunca se agota.
    setAiTurn({ playerIndex: current, duration: turnDurationMs });

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled || !gameRef.current) return;
      const currentState = gameRef.current.getState();
      if (currentState.currentPlayer !== current || currentState.handOver) return;
      const action = tutorialAIAction(currentState, current);
      if (action.type === 'check') gameRef.current.check(current);
      else gameRef.current.call(current);
      commitState();
    }, delay);

    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [gameState, isTutorial, tutorialReady, coachPaused, aiPlayers, commitState, settingsOpen, speed, turnDurationMs]);

  const updateState = () => {
    if (!gameRef.current) return;
    setShowRaise(false);
    commitState();
  };

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

  const startNewHand = () => {
    const g = gameRef.current;
    if (!g) return;
    setPotAward(null);
    setAwardProgress({});
    g.startHand();
    updateState();
  };

  const restartGame = () => {
    const g = gameRef.current;
    if (!g) return;
    setPotAward(null);
    setAwardProgress({});
    setPotRemaining(null);
    g.reset();
    g.startHand();
    updateState();
  };

  const handlePotAwardLanded = useCallback((winnerId: number, value: number) => {
    setAwardProgress(prev => ({ ...prev, [winnerId]: (prev[winnerId] ?? 0) + value }));
    setPotRemaining(prev => (prev === null ? null : Math.max(0, prev - value)));
    playSfx('chips_stack');
  }, []);

  const finishPotAward = useCallback(() => {
    setAwardProgress(prev => {
      const next = { ...prev };
      for (const w of potAward?.winners ?? []) next[w.id] = w.amount;
      return next;
    });
    setPotRemaining(0);
    setPotAward(null);
  }, [potAward]);

  const finishTutorial = () => {
    completeOnboarding();
    navigate('/local');
  };

  const restartTutorial = () => {
    restartGame();
    setTutorialReady(false);
    setTutorialRun(n => n + 1);
  };

  const openSettings = () => setSettingsOpen(true);

  const leaveGame = () => {
    setLeaveConfirmOpen(true);
  };

  const confirmLeaveGame = () => {
    clearSavedGame();
    navigate('/');
  };

  const settingsOverlay = (
    <AnimatePresence>
      {settingsOpen && (
        <GameSettings
          onClose={() => setSettingsOpen(false)}
          onTutorial={() => navigate('/game/guide')}
          onHandsGuide={() => navigate('/hands', { state: { from: gameId } })}
          onLeave={leaveGame}
        />
      )}
    </AnimatePresence>
  );

  const confirmDialog = (
    <ConfirmDialog
      open={leaveConfirmOpen}
      title={t('game.leaveTitle')}
      message={t('game.leaveMessage')}
      confirmLabel={t('game.leaveConfirm')}
      cancelLabel={t('game.leaveCancel')}
      danger
      onConfirm={confirmLeaveGame}
      onCancel={() => setLeaveConfirmOpen(false)}
    />
  );

  // ---- Guards de render ----

  if (!isLocal) {
    return (
      <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="font-display font-bold leading-none tracking-[-0.01em] text-fs-700">{t('game.unavailableTitle')}</div>
          <div className="font-body leading-[1.45] text-fs-300 opacity-40">
            {t('game.unavailableBody')}
          </div>
          <Button variant="outline" className="rounded-[0.875rem]!" onClick={() => navigate('/')}>
            ← {t('common.backToMenu')}
          </Button>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="font-display font-bold leading-none tracking-[-0.01em] text-fs-700">{t('game.loading')}</div>
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
  const streetPending = state.streetPending;
  const human = state.players[0];
  // En showdown se muestran todos los rivales (también los retirados).
  const rivals = state.players.slice(1);
  // Los rivales eliminados (sin fichas) desaparecen de la mesa.
  const visibleRivals = rivals.filter(r => !r.eliminated);

  const difficulty = getDifficulty(gameId ?? '');
  const avatarTone = DIFFICULTY_AVATAR_TONE[difficulty];
  const avatarRing = DIFFICULTY_AVATAR_RING[difficulty];

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

  const humanRole = blindRoleFor(0);

  const visibleHandRank = (cards: { rank: CardRank; suit: Suit }[]): number | null => {
    if (cards.length < 2) return null;
    if (state.community.length >= 3) return evaluateHand(cards, state.community).rank;
    // Sin cartas comunitarias: la mano es la de las dos cartas propias.
    return cards[0].rank === cards[1].rank ? HAND_RANKS.ONE_PAIR : HAND_RANKS.HIGH_CARD;
  };
  const handLabel = (rank: number | null): string => (rank === null ? '' : t(`handName.${rank}`));

  const humanHandName = handLabel(visibleHandRank(human.cards));

  const winningHandName = winner && winner.length > 0
    ? handLabel(visibleHandRank(state.players[winner[0]].cards))
    : '';

  const handNameFor = (cards: { rank: CardRank; suit: Suit }[]) => handLabel(visibleHandRank(cards));

  const winnerLog = handOver && winner && winner.length > 0
    ? {
        name: winner.map(w => state.players[w].name).join(t('game.and')),
        hand: winner.includes(0) ? humanHandName : winningHandName,
        isHuman: winner.includes(0),
      }
    : null;

  const winningCards = (() => {
    if (!winner || winner.length === 0 || state.phase !== 'showdown' || state.community.length < 3) return new Set<string>();
    const winnerHand = evaluateHand(state.players[winner[0]].cards, state.community);
    const relevant = getRelevantCards(winnerHand);
    return new Set(relevant.map(c => `${c.rank}${c.suit}`));
  })();

  const isDimmed = (card: { rank: string; suit: string }): boolean =>
    winningCards.size > 0 && !winningCards.has(`${card.rank}${card.suit}`);

  const humanIsWinner = winner !== null && winner.includes(0);
  const humanAllIn = human.isAllIn && !handOver;
  // Reparto en curso: las fichas vuelan del bote a los ganadores.
  const potAwarded = handOver && winner !== null && winner.length > 0;
  // El bote mostrado se resta conforme aterrizan las fichas; a 0 se desvanece.
  const displayedPot = handOver && potRemaining !== null ? potRemaining : pot;
  const potEmpty = potAwarded && displayedPot === 0;
  // Fichas del ganador que aún no han aterrizado: se restan del total para que
  // el contador crezca en tiempo real conforme llegan las fichas.
  const awardRemainingFor = (id: number): number => {
    if (!potAwarded) return 0;
    const target = state.winAmounts[id] ?? 0;
    return Math.max(0, target - (awardProgress[id] ?? 0));
  };
  const displayedChips = (id: number, total: number): number => total - awardRemainingFor(id);
  const humanNet = state.winAmounts[0] - state.committed[0];
  // Retirado o perdedor: sus cartas se oscurecen igual que las de los rivales.
  const humanCardsDimmed = human.folded || (handOver && !humanIsWinner);

  const humanInfo = (
    <div
      data-tour="human-seat"
      className={[
        'flex flex-col items-start gap-1 rounded-slot border px-4 py-3',
        'transition-[border-color,background-color,color,opacity] duration-300 ease-brand',
        isMobile ? 'justify-center' : 'min-w-[140px]',
        humanIsWinner
          ? 'border-bone bg-bone text-ink'
          : human.folded
            ? 'border-bone/[0.18] bg-ink opacity-[0.32]'
            : 'border-bone/[0.18] bg-ink',
      ].join(' ')}
    >
      <div className="flex items-center gap-1.5">
        <span className={isMobile ? 'font-display font-bold text-fs-300 tracking-normal normal-case' : 'font-display font-bold leading-none text-fs-400'}>{human.name === 'Tú' ? t('common.you') : human.name}</span>
        {humanRole && (
          <span className="shrink-0" data-tour={humanRole === 'dealer' ? 'dealer' : undefined}>
            <PositionChip role={humanRole} filled={humanIsWinner} />
          </span>
        )}
      </div>
      <div className="flex items-center gap-0.5">
        <span data-chips className="inline-flex">
          <ChipIcon className={`size-5 ${humanIsWinner ? 'text-ink' : 'text-bone'}`} />
        </span>
        {humanAllIn ? (
          <span className={`font-display font-bold text-fs-300 ${humanIsWinner ? 'text-danger-bone' : 'text-danger'}`}>ALL-IN</span>
        ) : (
          <span className={`font-display font-bold tabular-nums text-fs-300 ${human.chips < 100 && !humanIsWinner ? 'text-danger' : ''}`}>{displayedChips(0, human.chips)}</span>
        )}
        <DeltaLine amount={humanAllIn ? 0 : handOver ? (humanIsWinner ? humanNet : 0) : -human.bet} filled={humanIsWinner} className="ml-1" />
      </div>
    </div>
  );

  const humanCards = (
    <div data-tour="human-cards" className="flex flex-col items-center gap-1">
      <HandLabel name={humanHandName} winner={humanIsWinner} />
      {human.cards.length > 0 && (
        <div className="flex gap-2">
          {human.cards.map((c, i) => (
            <motion.div
              key={`${state.handNumber}-${i}`}
              initial={{ opacity: 0, y: -28, rotate: -7 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={motionT(0.42, 0.08 * i)}
            >
              <PokerCard
                size={isMobile || isShort ? 'md' : 'lg'}
                rank={c.rank}
                suit={c.suit}
                dimmed={humanCardsDimmed || isDimmed({ rank: c.rank, suit: c.suit })}
              />
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );

  const renderActionButtons = (size: ButtonSize, { fill = false, stack = false }: { fill?: boolean; stack?: boolean } = {}) => {
    if (handOver) {
      return (
        <div className={`flex flex-col items-center gap-2 ${fill ? 'w-full' : ''}`}>
          {!state.gameOver && (
            <Button variant="primary" size={size} block={fill} className={fill ? 'min-h-11 px-1.5! py-1! tracking-[0.04em]!' : ''} onClick={startNewHand}>
              {t('game.newHand')}
            </Button>
          )}
        </div>
      );
    }

    const raiseButtonInner = (
      <Button
        data-tour="btn-raise"
        variant="primary"
        size={size}
        block={fill}
        className={fill ? 'w-auto! flex-auto min-h-11 px-2! py-1! tracking-[0.02em]!' : ''}
        onClick={() => setShowRaise(!showRaise)}
        disabled={activePlayer !== 0 || streetPending || !canRaise || (isTutorial && expectedAction !== 'raise')}
      >
        {t('game.raise')}
      </Button>
    );

    // En móvil el botón va suelto (sin wrapper) para que flex-auto mida por su texto.
    const raiseButton = fill ? raiseButtonInner : (
      <div className="relative">
        {raiseButtonInner}
        {showRaise && activePlayer === 0 && (
          <RaisePanel
            raiseAmount={raiseAmount}
            onRaiseChange={handleRaiseChange}
            onRaise={() => handleAction('raise')}
            minRaise={state.minRaise}
            maxRaise={Math.max(state.minRaise, maxRaise)}
            potSize={pot}
            playerChips={human.chips}
            callAmount={callAmount}
            confirmDisabled={isTutorial && !raiseTouched}
          />
        )}
      </div>
    );

    const passButton = (
      <Button
        data-tour="btn-pass"
        variant="outline"
        size={size}
        block={fill}
        className={fill ? 'w-auto! flex-auto min-h-11 px-2! py-1! tracking-[0.02em]!' : ''}
        onClick={() => handleAction(canCheck ? 'check' : 'fold')}
        disabled={activePlayer !== 0 || streetPending || (isTutorial && (expectedAction !== 'check' || !canCheck))}
      >
        {canCheck ? t('game.check') : t('game.fold')}
      </Button>
    );

    const callButton = (
      <Button
        data-tour="btn-call"
        variant="outline"
        size={size}
        block={fill}
        className={fill ? 'w-auto! flex-auto min-h-11 px-2! py-1! tracking-[0.02em]!' : ''}
        onClick={() => handleAction('call')}
        disabled={activePlayer !== 0 || streetPending || callAmount === 0 || (isTutorial && expectedAction !== 'call')}
      >
        {callAmount > 0
          ? callAmount >= human.chips
            ? t('game.allInAmount', { amount: human.chips })
            : t('game.callAmount', { amount: callAmount })
          : t('game.call')}
      </Button>
    );

    // Móvil: los tres botones en fila, con la acción más frecuente
    // (Pasar/Retirarse) a la derecha, lo más cerca posible del pulgar.
    if (fill) {
      return (
        <div className="flex w-full gap-1.5">
          {raiseButton}
          {callButton}
          {passButton}
        </div>
      );
    }

    // Tablet: el botón de subir va arriba, con pasar e igualar debajo.
    if (stack) {
      return (
        <div className="flex w-full flex-col items-end gap-2">
          {raiseButton}
          <div className="flex gap-2">
            {passButton}
            {callButton}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-wrap justify-end gap-2">
        {passButton}
        {callButton}
        {raiseButton}
      </div>
    );
  };

  // ---------- MÓVIL ----------

  if (isMobile) {
    return (
      <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
        <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto_1fr] overflow-y-auto px-[0.875rem]">
          <div className="flex flex-col self-start pt-[calc(0.75rem+env(safe-area-inset-top))]">
            <div className="flex items-start justify-between gap-3 pb-1">
              <div className="pointer-events-none min-w-0 flex-1">
                <ActionLog compact state={state} winnerName={winnerLog?.name} winnerHand={winnerLog?.hand} winnerIsHuman={winnerLog?.isHuman} />
              </div>
              <SettingsButton onClick={openSettings} inline />
            </div>

            <div data-tour="rivals" className="flex flex-wrap justify-center gap-2 pt-2">
            <AnimatePresence initial={false}>
            {visibleRivals.map((r, i) => (
              <motion.div
                key={r.id}
                layout
                exit={{ opacity: 0, scale: 0.85, transition: motionT(0.25) }}
                className="flex flex-col items-center gap-1.5"
              >
                <RivalSlot
                  compact
                  enterDelay={i * 0.08}
                  name={r.name}
                  folded={r.folded}
                  eliminated={r.eliminated}
                  isActive={activePlayer === r.id}
                  isWinner={winner !== null && winner.includes(r.id)}
                  chips={displayedChips(r.id, r.chips)}
                  blindRole={blindRoleFor(r.id)} dataTour={`rival-${r.id}`}
                  delta={handOver ? (winner !== null && winner.includes(r.id) ? state.winAmounts[r.id] - state.committed[r.id] : 0) : -r.bet}
                  isAllIn={r.isAllIn}
                  handOver={handOver}
                  avatarTone={avatarTone.tone}
                  avatarImgClassName={avatarTone.imgClassName}
                  avatarRing={avatarRing}
                  timerDuration={aiTurn?.playerIndex === r.id ? aiTurn.duration : undefined}
                  timerKey={`${state.handNumber}-${phase}-${r.id}`}
                />
                <div className="flex min-h-[5.5rem] flex-col items-center gap-1.5">
                  {showdown && !r.folded && r.cards.length > 0 && (
                    <>
                      <ShowdownCards cards={r.cards} size="sm" isDimmed={isDimmed} />
                      <HandLabel name={handNameFor(r.cards)} winner={winner !== null && winner.includes(r.id)} />
                    </>
                  )}
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
            </div>
          </div>

          <div className="py-3">
            <CommunityRow
              phase={phase}
              community={state.community}
              pot={displayedPot}
              potAwarded={potEmpty}
              potLocked={potAwarded}
              cardSize="md"
              isDimmed={isDimmed}
            />
          </div>

          <div className="flex flex-col items-center gap-3 self-end pb-[calc(2.5rem+env(safe-area-inset-bottom))]">
            <div className="flex w-full items-center justify-between gap-3">
              <div className="flex justify-start">{humanCards}</div>
              <div className="flex items-center justify-end self-end">{humanInfo}</div>
            </div>

            <div data-tour="actions" className="w-full">
              {renderActionButtons('sm', { fill: true })}
            </div>

            <div className="h-[3px] w-full">
              {!isTutorial && activePlayer === 0 && !handOver && !streetPending && (
                <TimerBar key={`${state.handNumber}-${phase}-${gameSpeed}-${settingsOpen}`} duration={turnDurationMs} className="mx-2" paused={settingsOpen} />
              )}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showRaise && activePlayer === 0 && !handOver && (
            <RaiseSheet
              raiseAmount={raiseAmount}
              onRaiseChange={handleRaiseChange}
              onRaise={() => handleAction('raise')}
              onClose={() => setShowRaise(false)}
              minRaise={state.minRaise}
              maxRaise={Math.max(state.minRaise, maxRaise)}
              potSize={pot}
              playerChips={human.chips}
              callAmount={callAmount}
              confirmDisabled={isTutorial && !raiseTouched}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {gameOverModal && (
            <GameOverOverlay
              state={state}
              onRestart={restartGame}
              onSelectDifficulty={() => navigate('/local')}
              onHome={() => navigate('/')}
            />
          )}
        </AnimatePresence>

        {potAward && (
          <PotAward key={potAward.handNumber} data={potAward} onLanded={handlePotAwardLanded} onDone={finishPotAward} />
        )}

        {settingsOverlay}

        {confirmDialog}

        {isTutorial && (
          <TutorialCoach
            key={tutorialRun}
            state={state}
            onFinish={finishTutorial}
            onRestart={restartTutorial} onResume={() => setTutorialReady(true)} onRaisePanel={(open) => setShowRaise(open)} onExpectedAction={setExpectedAction} raiseOpen={showRaise} onPause={setCoachPaused}
          />
        )}
      </div>
    );
  }

  // ---------- DESKTOP ----------

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
      <div className="pointer-events-none fixed left-12 top-[max(1.25rem,env(safe-area-inset-top))] z-40 hidden max-w-[16rem] xl:block">
        <ActionLog state={state} winnerName={winnerLog?.name} winnerHand={winnerLog?.hand} winnerIsHuman={winnerLog?.isHuman} />
      </div>

      <div className="hidden xl:block">
        <SettingsButton onClick={openSettings} />
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto_1fr] px-6 lg:px-12">
        <div className={`flex flex-col self-start ${isShort ? 'pt-1' : 'pt-4'}`}>
          <div className="flex shrink-0 items-start justify-between gap-3 xl:hidden">
            <div className="pointer-events-none min-w-0 flex-1">
              <ActionLog compact state={state} winnerName={winnerLog?.name} winnerHand={winnerLog?.hand} winnerIsHuman={winnerLog?.isHuman} />
            </div>
            <SettingsButton onClick={openSettings} inline />
          </div>

          <div data-tour="rivals" className={`flex justify-center ${isShort ? 'mt-1 gap-2' : 'mt-3 gap-3 lg:mt-4 lg:gap-4'}`}>
          <AnimatePresence initial={false}>
          {visibleRivals.map((r, i) => (
            <motion.div
              key={r.id}
              layout
              exit={{ opacity: 0, scale: 0.85, transition: motionT(0.25) }}
              className="flex flex-col items-center gap-2"
            >
              <RivalSlot
                compact={isShort}
                enterDelay={i * 0.08}
                name={r.name}
                folded={r.folded}
                eliminated={r.eliminated}
                isActive={activePlayer === r.id}
                isWinner={winner !== null && winner.includes(r.id)}
                chips={displayedChips(r.id, r.chips)}
                blindRole={blindRoleFor(r.id)} dataTour={`rival-${r.id}`}
                delta={handOver ? (winner !== null && winner.includes(r.id) ? state.winAmounts[r.id] - state.committed[r.id] : 0) : -r.bet}
                isAllIn={r.isAllIn}
                handOver={handOver}
                avatarTone={avatarTone.tone}
                avatarImgClassName={avatarTone.imgClassName}
                avatarRing={avatarRing}
                timerDuration={aiTurn?.playerIndex === r.id ? aiTurn.duration : undefined}
                timerKey={`${state.handNumber}-${phase}-${r.id}`}
              />
              <div className={`flex flex-col items-center gap-2 ${showdown ? (isShort ? 'min-h-[3.75rem]' : 'min-h-[7.1875rem]') : ''}`}>
                {showdown && !r.folded && r.cards.length > 0 && (
                  <>
                    <ShowdownCards cards={r.cards} size={isShort ? 'sm' : 'md'} isDimmed={isDimmed} />
                    <HandLabel name={handNameFor(r.cards)} winner={winner !== null && winner.includes(r.id)} />
                  </>
                )}
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
          </div>
        </div>

        <div className={isShort ? 'py-1' : 'py-4 lg:py-6'}>
          <CommunityRow
            phase={phase}
            community={state.community}
            pot={displayedPot}
            potAwarded={potEmpty}
            potLocked={potAwarded}
            cardSize={isShort ? 'md' : 'xxl'}
            isDimmed={isDimmed}
          />
        </div>

        <div className={`flex flex-col self-end ${isShort ? 'gap-2 pb-2' : 'gap-4 pb-6'}`}>
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
            <div className="justify-self-start">{humanInfo}</div>

            <div className="flex flex-col items-center gap-1">{humanCards}</div>

            <div data-tour="actions" className="flex flex-col items-end gap-2 justify-self-end">
              {renderActionButtons('sm', { stack: !handOver && isTablet })}
            </div>
          </div>

          <div className="h-[3px] w-full">
            {!isTutorial && activePlayer === 0 && !handOver && !streetPending && (
              <TimerBar key={`${state.handNumber}-${phase}-${gameSpeed}-${settingsOpen}`} duration={turnDurationMs} className="mx-2" paused={settingsOpen} />
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {gameOverModal && (
          <GameOverOverlay
            state={state}
            onRestart={restartGame}
            onSelectDifficulty={() => navigate('/local')}
            onHome={() => navigate('/')}
          />
        )}
      </AnimatePresence>

      {potAward && (
        <PotAward key={potAward.handNumber} data={potAward} onLanded={handlePotAwardLanded} onDone={finishPotAward} />
      )}

      {settingsOverlay}

      {confirmDialog}

      {isTutorial && (
        <TutorialCoach
          key={tutorialRun}
          state={state}
          onFinish={finishTutorial}
          onRestart={restartTutorial} onResume={() => setTutorialReady(true)} onRaisePanel={(open) => setShowRaise(open)} onExpectedAction={setExpectedAction} raiseOpen={showRaise} onPause={setCoachPaused}
        />
      )}
    </div>
  );
};

// ---------- Router ----------

const Game: React.FC = () => {
  return <LocalGame />;
};

export default Game;
