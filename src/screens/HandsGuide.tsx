import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { CardRank, Suit } from '../types';
import Button from '../components/Button';
import PokerCard from '../components/PokerCard';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { t } from '../animations/motion';

/* ------------------------------------------------------------------ *
 * Guía de manos — referencia de las diez combinaciones + práctica.
 * ------------------------------------------------------------------ */

const Wordmark: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`flex flex-col items-end font-display font-bold uppercase leading-[0.86] tracking-[-0.015em] ${className ?? 'text-fs-600'}`}>
    <span className="text-[0.85em]">Just</span>
    <span className="text-[0.9em]"><em className="font-light italic tracking-normal">Poker</em></span>
  </div>
);

/** Selector reutilizable: mismo patrón que las tarjetas de Local. */
const OptionButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`cursor-pointer rounded-full border-[1.5px] px-3 py-1.5 font-display font-bold text-fs-100 uppercase tracking-[0.08em] transition-[transform,border-color,background-color,color] duration-[240ms] ease-brand hover:-translate-y-0.5 hover:border-bone active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone ${
      active ? 'border-bone bg-bone text-ink' : 'border-bone/40 bg-ink text-bone'
    }`}
  >
    {children}
  </button>
);

interface HandExample {
  name: string;
  desc: string;
  cards: [CardRank, Suit][];
}

const HANDS: HandExample[] = [
  { name: 'Escalera Real', desc: 'A, K, Q, J y 10 del mismo palo. La mejor mano posible.', cards: [['A', 's'], ['K', 's'], ['Q', 's'], ['J', 's'], ['10', 's']] },
  { name: 'Escalera de Color', desc: 'Cinco cartas seguidas y del mismo palo.', cards: [['9', 'h'], ['8', 'h'], ['7', 'h'], ['6', 'h'], ['5', 'h']] },
  { name: 'Póker', desc: 'Cuatro cartas del mismo valor.', cards: [['Q', 's'], ['Q', 'h'], ['Q', 'd'], ['Q', 'c'], ['7', 's']] },
  { name: 'Full House', desc: 'Un trío más una pareja.', cards: [['J', 's'], ['J', 'h'], ['J', 'd'], ['4', 'c'], ['4', 's']] },
  { name: 'Color', desc: 'Cinco cartas del mismo palo, sin importar el orden.', cards: [['A', 'd'], ['J', 'd'], ['8', 'd'], ['5', 'd'], ['2', 'd']] },
  { name: 'Escalera', desc: 'Cinco cartas seguidas de palos distintos.', cards: [['10', 'c'], ['9', 'd'], ['8', 's'], ['7', 'h'], ['6', 'c']] },
  { name: 'Trío', desc: 'Tres cartas del mismo valor.', cards: [['8', 's'], ['8', 'h'], ['8', 'd'], ['K', 'c'], ['3', 's']] },
  { name: 'Doble Pareja', desc: 'Dos parejas distintas.', cards: [['K', 's'], ['K', 'h'], ['5', 'd'], ['5', 'c'], ['9', 's']] },
  { name: 'Pareja', desc: 'Dos cartas del mismo valor.', cards: [['10', 's'], ['10', 'h'], ['A', 'd'], ['6', 'c'], ['2', 's']] },
  { name: 'Carta Alta', desc: 'Sin ninguna combinación: manda la carta más alta.', cards: [['A', 's'], ['Q', 'd'], ['9', 'c'], ['5', 'h'], ['3', 's']] },
];

const HandsExplorer: React.FC = () => {
  const [selected, setSelected] = useState(0);
  const hand = HANDS[selected];

  return (
    <div className="flex w-full max-w-[420px] flex-col gap-3">
      <div className="flex flex-col items-center gap-2 rounded-[14px] bg-ink-900 px-4 py-4">
        <div className="flex gap-1.5">
          {hand.cards.map(([rank, suit], i) => <PokerCard key={i} rank={rank} suit={suit} size="sm" />)}
        </div>
        <div className="font-display font-bold leading-none text-fs-400">{hand.name}</div>
        <div className="max-w-[300px] text-center font-body text-fs-100 tracking-[0.04em] opacity-70">{hand.desc}</div>
      </div>
      <div className="flex flex-col gap-1">
        {HANDS.map((h, i) => (
          <button
            key={h.name}
            type="button"
            onClick={() => setSelected(i)}
            className={`flex cursor-pointer items-center gap-3 rounded-full border-[1.5px] px-3 py-1.5 text-left transition-[transform,border-color,background-color,color] duration-[240ms] ease-brand hover:-translate-y-0.5 hover:border-bone active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone ${
              i === selected ? 'border-bone bg-bone text-ink' : 'border-bone/[0.18] bg-ink text-bone'
            }`}
          >
            <span className="w-[18px] font-display font-bold text-fs-200 opacity-70">{10 - i}</span>
            <span className="flex-1 font-display font-bold text-fs-200">{h.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

interface QuizHand {
  name: string;
  cards: [CardRank, Suit][];
}

interface QuizQuestion {
  a: QuizHand;
  b: QuizHand;
  winner: 'a' | 'b';
  why: string;
}

const QUIZ: QuizQuestion[] = [
  {
    a: { name: 'Full House', cards: [['J', 's'], ['J', 'h'], ['J', 'd'], ['4', 'c'], ['4', 's']] },
    b: { name: 'Color', cards: [['A', 'd'], ['J', 'd'], ['8', 'd'], ['5', 'd'], ['2', 'd']] },
    winner: 'a',
    why: 'Un full house supera siempre a un color.',
  },
  {
    a: { name: 'Escalera', cards: [['10', 'c'], ['9', 'd'], ['8', 's'], ['7', 'h'], ['6', 'c']] },
    b: { name: 'Trío', cards: [['8', 's'], ['8', 'h'], ['8', 'd'], ['K', 'c'], ['3', 's']] },
    winner: 'a',
    why: 'Una escalera gana a un trío, aunque el trío tenga cartas altas.',
  },
  {
    a: { name: 'Doble Pareja', cards: [['K', 's'], ['K', 'h'], ['5', 'd'], ['5', 'c'], ['9', 's']] },
    b: { name: 'Pareja', cards: [['A', 's'], ['A', 'h'], ['6', 'd'], ['2', 'c'], ['3', 's']] },
    winner: 'a',
    why: 'Doble pareja gana a cualquier pareja, incluso si es de ases.',
  },
  {
    a: { name: 'Color', cards: [['A', 'd'], ['J', 'd'], ['8', 'd'], ['5', 'd'], ['2', 'd']] },
    b: { name: 'Escalera', cards: [['10', 'c'], ['9', 'd'], ['8', 's'], ['7', 'h'], ['6', 'c']] },
    winner: 'a',
    why: 'Un color gana a una escalera.',
  },
  {
    a: { name: 'Carta Alta', cards: [['A', 's'], ['Q', 'd'], ['9', 'c'], ['5', 'h'], ['3', 's']] },
    b: { name: 'Pareja', cards: [['2', 's'], ['2', 'h'], ['7', 'd'], ['9', 'c'], ['J', 's']] },
    winner: 'b',
    why: 'Cualquier pareja supera a la carta alta, por alta que sea.',
  },
  {
    a: { name: 'Escalera de Color', cards: [['9', 'h'], ['8', 'h'], ['7', 'h'], ['6', 'h'], ['5', 'h']] },
    b: { name: 'Póker', cards: [['Q', 's'], ['Q', 'h'], ['Q', 'd'], ['Q', 'c'], ['7', 's']] },
    winner: 'a',
    why: 'La escalera de color solo pierde ante la escalera real.',
  },
];

const QuizHandRow: React.FC<{
  side: 'A' | 'B';
  hand: QuizHand;
  revealed: boolean;
  picked: boolean;
  isWinner: boolean;
  disabled: boolean;
  onPick: () => void;
}> = ({ side, hand, revealed, picked, isWinner, disabled, onPick }) => {
  const stateCls = !revealed
    ? 'border-bone/[0.18] bg-ink enabled:hover:border-bone enabled:hover:-translate-y-0.5'
    : isWinner
      ? 'border-success/70 bg-ink'
      : picked
        ? 'border-danger/70 bg-ink'
        : 'border-bone/[0.18] bg-ink opacity-50';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPick}
      aria-label={`Mano ${side}`}
      className={`flex w-full cursor-pointer flex-col items-center gap-2 rounded-full border-[1.5px] px-3 py-3 transition-[transform,border-color,background-color,opacity] duration-[240ms] ease-brand active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone disabled:cursor-default ${stateCls}`}
    >
      <span className="flex gap-1">
        {hand.cards.map(([rank, suit], i) => <PokerCard key={i} rank={rank} suit={suit} size="sm" />)}
      </span>
      <span className="flex items-center gap-2">
        <span className={`inline-flex items-center rounded-pill px-1.5 py-px font-display font-bold text-fs-100 leading-none tracking-[0.08em] uppercase ${revealed && isWinner ? 'bg-success text-ink' : 'bg-bone/15 text-bone'}`}>
          {side}
        </span>
        <span className="font-display font-bold text-fs-300">
          {revealed ? hand.name : `Mano ${side}`}
        </span>
      </span>
    </button>
  );
};

const HandQuiz: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<'a' | 'b' | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const question = QUIZ[index];
  const revealed = picked !== null;

  const pick = (side: 'a' | 'b') => {
    if (picked) return;
    setPicked(side);
    if (side === question.winner) setScore((s) => s + 1);
  };

  const next = () => {
    if (index < QUIZ.length - 1) {
      setIndex(index + 1);
      setPicked(null);
    } else {
      setDone(true);
    }
  };

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  };

  if (done) {
    return (
      <div className="flex w-full max-w-[420px] flex-col items-center gap-4 rounded-[14px] bg-ink-900 px-5 py-6 text-center">
        <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">Resultado</div>
        <div className="font-display font-bold leading-none text-fs-700">
          {score} de {QUIZ.length}
        </div>
        <div className="font-body text-fs-100 leading-[1.45] tracking-[0.04em] opacity-70">
          {score === QUIZ.length
            ? 'Perfecto: dominas el orden de las combinaciones.'
            : 'Repasa el orden en «Las diez manos» y vuelve a intentarlo.'}
        </div>
        <Button size="sm" variant={score === QUIZ.length ? 'outline' : 'primary'} onClick={restart}>
          Repetir
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-[420px] flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {QUIZ.map((_, i) => (
            <span key={i} className={`h-1 rounded-pill transition-[width,background-color] duration-[240ms] ease-brand ${i === index ? 'w-6 bg-bone' : i < index ? 'w-3 bg-bone/60' : 'w-3 bg-bone/25'}`} />
          ))}
        </div>
        <span className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">
          Aciertos {score}
        </span>
      </div>

      <div className="font-body text-fs-100 tracking-[0.04em] opacity-70">
        ¿Cuál de las dos manos es más alta?
      </div>

      <QuizHandRow
        side="A"
        hand={question.a}
        revealed={revealed}
        picked={picked === 'a'}
        isWinner={question.winner === 'a'}
        disabled={revealed}
        onPick={() => pick('a')}
      />
      <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-50">vs</div>
      <QuizHandRow
        side="B"
        hand={question.b}
        revealed={revealed}
        picked={picked === 'b'}
        isWinner={question.winner === 'b'}
        disabled={revealed}
        onPick={() => pick('b')}
      />

      <div className="flex min-h-12 flex-col items-center justify-center gap-2">
        {revealed ? (
          <>
            <span className={`font-display font-bold text-fs-300 ${picked === question.winner ? 'text-success' : 'text-danger'}`}>
              {picked === question.winner ? '¡Correcto!' : 'Casi…'}
            </span>
            <span className="max-w-[340px] text-center font-body text-fs-100 leading-[1.45] tracking-[0.04em] opacity-70">{question.why}</span>
          </>
        ) : (
          <span className="font-body text-fs-100 tracking-[0.04em] opacity-50">Toca una mano para responder.</span>
        )}
      </div>

      {revealed && (
        <Button size="sm" variant="primary" onClick={next}>
          {index < QUIZ.length - 1 ? 'Siguiente pregunta' : 'Ver resultado'}
        </Button>
      )}
    </div>
  );
};

const HandsGuide: React.FC = () => {
  const [mode, setMode] = useState<'explore' | 'quiz'>('explore');
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 767px)');

  const from = (location.state as { from?: string } | null)?.from;
  const back = () => {
    if (from) navigate(`/game/${from}?continue=1`);
    else navigate('/');
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
      <header className="relative z-10 mx-auto flex w-full max-w-[87.5rem] shrink-0 items-start justify-between gap-4 px-[1.375rem] pt-7 lg:px-20">
        <Button
          size="sm"
          variant="ghost"
          className="min-h-0! p-0! text-fs-500! leading-none! text-bone!"
          aria-label="Volver"
          onClick={back}
        >
          ←
        </Button>
        <Wordmark />
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-[87.5rem] min-h-0 flex-1 flex-col items-center gap-5 overflow-y-auto px-[1.375rem] pb-9 pt-6 lg:px-20 lg:pt-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">Guía de manos</div>
          <div className={`font-display font-bold leading-[0.96] tracking-[-0.015em] ${isMobile ? 'text-fs-700' : 'text-fs-800'}`}>
            De la carta alta a la <em className="font-light italic tracking-normal">escalera real</em>
          </div>
          <p className="max-w-[440px] font-body leading-[1.45] opacity-70">
            Diez combinaciones ordenadas de menor a mayor. Tócalas para verlas y pásate a «Practica» para comprobar si las distingues.
          </p>
        </div>

        <div className="flex gap-1.5">
          <OptionButton active={mode === 'explore'} onClick={() => setMode('explore')}>Las diez manos</OptionButton>
          <OptionButton active={mode === 'quiz'} onClick={() => setMode('quiz')}>Practica</OptionButton>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={t(0.22)}
            className="flex w-full flex-col items-center"
          >
            {mode === 'explore' ? <HandsExplorer /> : <HandQuiz />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HandsGuide;
