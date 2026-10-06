import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { CardRank, CardSize, Suit } from '../types';
import Button from '../components/Button';
import PokerCard from '../components/PokerCard';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { container, fadeIn, slideSwap } from '../animations/motion';
import { useI18n } from '../i18n';

/* ------------------------------------------------------------------ *
 * Guía de manos — referencia de las diez combinaciones.
 * ------------------------------------------------------------------ */

const Wordmark: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`flex flex-col items-end font-display font-bold uppercase leading-[0.86] tracking-[-0.015em] ${className ?? 'text-fs-600'}`}>
    <span className="text-[0.85em]">Just</span>
    <span className="text-[0.9em]"><em className="font-light italic tracking-normal">Poker</em></span>
  </div>
);

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const { t } = useI18n();
  return (
    <Button
      size="sm"
      variant="ghost"
      className="min-h-0! p-0! text-fs-500! leading-none! text-bone!"
      aria-label={t('common.back')}
      onClick={onClick}
    >
      ←
    </Button>
  );
};

const Title: React.FC<{ className?: string }> = ({ className }) => {
  const { t } = useI18n();
  return (
    <div className={`font-display font-bold leading-[0.96] tracking-[-0.015em] ${className ?? ''}`}>
      {t('handsGuide.titleMain')} <em className="font-light italic tracking-normal">{t('handsGuide.titleEm')}</em>
    </div>
  );
};

interface HandExample {
  rank: number;
  cards: [CardRank, Suit][];
  score: number[];
}

const HANDS: HandExample[] = [
  { rank: 9, cards: [['A', 's'], ['K', 's'], ['Q', 's'], ['J', 's'], ['10', 's']], score: [0, 1, 2, 3, 4] },
  { rank: 8, cards: [['9', 'h'], ['8', 'h'], ['7', 'h'], ['6', 'h'], ['5', 'h']], score: [0, 1, 2, 3, 4] },
  { rank: 7, cards: [['Q', 's'], ['Q', 'h'], ['Q', 'd'], ['Q', 'c'], ['7', 's']], score: [0, 1, 2, 3] },
  { rank: 6, cards: [['J', 's'], ['J', 'h'], ['J', 'd'], ['4', 'c'], ['4', 's']], score: [0, 1, 2, 3, 4] },
  { rank: 5, cards: [['A', 'd'], ['J', 'd'], ['8', 'd'], ['5', 'd'], ['2', 'd']], score: [0, 1, 2, 3, 4] },
  { rank: 4, cards: [['10', 'c'], ['9', 'd'], ['8', 's'], ['7', 'h'], ['6', 'c']], score: [0, 1, 2, 3, 4] },
  { rank: 3, cards: [['8', 's'], ['8', 'h'], ['8', 'd'], ['K', 'c'], ['3', 's']], score: [0, 1, 2] },
  { rank: 2, cards: [['K', 's'], ['K', 'h'], ['5', 'd'], ['5', 'c'], ['9', 's']], score: [0, 1, 2, 3] },
  { rank: 1, cards: [['10', 's'], ['10', 'h'], ['A', 'd'], ['6', 'c'], ['2', 's']], score: [0, 1] },
  { rank: 0, cards: [['A', 's'], ['Q', 'd'], ['9', 'c'], ['5', 'h'], ['3', 's']], score: [0] },
];

const DEFAULT_HAND = HANDS.findIndex((h) => h.rank === 0);

const detailSizes = {
  sm: { root: 'gap-2 px-4 py-4', cards: 'sm', name: 'text-fs-400', desc: 'max-w-[300px] text-fs-100' },
  md: { root: 'gap-3 p-6', cards: 'md', name: 'text-fs-600', desc: 'max-w-[340px] text-fs-200 leading-[1.45]' },
  lg: { root: 'gap-4 p-8', cards: 'lg', name: 'text-fs-700', desc: 'max-w-[380px] text-fs-300 leading-[1.45]' },
} as const satisfies Record<string, { root: string; cards: CardSize; name: string; desc: string }>;

const HandDetail: React.FC<{ hand: HandExample; size?: keyof typeof detailSizes; fill?: boolean }> = ({ hand, size = 'sm', fill = false }) => {
  const { t } = useI18n();
  const s = detailSizes[size];
  return (
    <div className={`flex w-full flex-col items-center justify-center rounded-[14px] bg-ink-900 text-center ${fill ? 'flex-1' : ''} ${s.root}`}>
      <div className={`font-display font-bold leading-none ${s.name}`}>
        {t(`handName.${hand.rank}`)}
      </div>
      <div className="flex gap-1.5">
        {hand.cards.map(([rank, suit], i) => (
          <PokerCard key={i} rank={rank} suit={suit} size={s.cards} dimmed={!hand.score.includes(i)} />
        ))}
      </div>
      <div className={`font-body tracking-[0.04em] opacity-70 ${s.desc}`}>
        {t(`handDesc.${hand.rank}`)}
      </div>
    </div>
  );
};

const HandList: React.FC<{ selected: number; onSelect: (i: number) => void; size?: 'sm' | 'lg'; fill?: boolean; dense?: boolean }> = ({ selected, onSelect, size = 'sm', fill = false, dense = false }) => {
  const { t } = useI18n();
  const large = size === 'lg';
  return (
    <motion.div
      variants={container(0.04)}
      initial="hidden"
      animate="visible"
      className={`${dense ? 'grid grid-cols-2 gap-1' : 'flex flex-col gap-1'} ${fill ? 'h-full' : ''}`}
    >
      {HANDS.map((h, i) => (
        <motion.button
          key={h.rank}
          variants={fadeIn}
          type="button"
          onClick={() => onSelect(i)}
          className={`flex w-full cursor-pointer items-center rounded-full border-[1.5px] text-left transition-[transform,border-color,background-color,color] duration-[240ms] ease-brand hover:-translate-y-0.5 hover:border-bone active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone ${
            dense ? 'gap-1.5 px-2 py-1.5' : large ? 'gap-3 px-4 py-2.5' : 'gap-3 px-3 py-1.5'
          } ${fill && !dense ? 'flex-1' : ''} ${i === selected ? 'border-bone bg-bone text-ink' : 'border-bone/[0.18] bg-ink text-bone'}`}
        >
          <span className={`font-display font-bold opacity-70 ${dense ? 'w-4 text-fs-200 min-[300px]:text-fs-300' : large ? 'w-6 text-fs-300' : 'w-[18px] text-fs-200 min-[300px]:text-fs-300'}`}>{10 - i}</span>
          <span className={`flex-1 font-display font-bold ${large ? 'text-fs-300' : 'text-fs-200 min-[300px]:text-fs-300'}`}>{t(`handName.${h.rank}`)}</span>
        </motion.button>
      ))}
    </motion.div>
  );
};

const HandsGuide: React.FC = () => {
  const [selected, setSelected] = useState(DEFAULT_HAND);
  const [dir, setDir] = useState(1);
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isWide = useMediaQuery('(min-width: 1280px)');
  const isMobile = useMediaQuery('(max-width: 767px)');
  /** Pantallas bajas (móviles 16:9): lista de manos a dos columnas para evitar scroll. */
  const isShort = useMediaQuery('(max-height: 720px)');
  const { t } = useI18n();
  const hand = HANDS[selected];

  const from = (location.state as { from?: string } | null)?.from;
  const back = () => {
    if (from) navigate(`/game/${from}?continue=1`);
    else navigate('/');
  };

  const selectHand = (i: number) => {
    if (i === selected) return;
    setDir(i >= selected ? 1 : -1);
    setSelected(i);
  };

  const detail = (size: keyof typeof detailSizes, fill = false) => (
    <AnimatePresence mode="wait">
      <motion.div
        key={hand.rank}
        variants={slideSwap(dir, 28)}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={fill ? 'flex min-h-0 flex-1' : undefined}
      >
        <HandDetail hand={hand} size={size} fill={fill} />
      </motion.div>
    </AnimatePresence>
  );

  const header = (
    <div className="flex w-full items-start justify-between gap-4">
      <BackButton onClick={back} />
      <Wordmark className={isDesktop ? undefined : 'text-fs-600'} />
    </div>
  );

  if (!isDesktop) {
    return (
      <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-[1.375rem] pb-7 pt-8">
          {header}
          <motion.div
            variants={container(0.07, 0.05)}
            initial="hidden"
            animate="visible"
            className="mx-auto mt-5 flex min-h-0 w-full max-w-[540px] flex-1 flex-col gap-4"
          >
            <motion.div variants={fadeIn} className="flex shrink-0 flex-col gap-2">
              <Title className="text-fs-700" />
              <p className="max-w-[440px] font-body leading-[1.45] opacity-70">{t('handsGuide.intro')}</p>
            </motion.div>
            <motion.div variants={fadeIn} className="shrink-0">{detail(isMobile ? 'sm' : 'md')}</motion.div>
            <motion.div variants={fadeIn} className="flex min-h-0 flex-1 flex-col">
              <HandList selected={selected} onSelect={selectHand} fill dense={isShort} />
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
      <header className="relative z-10 mx-auto flex w-full max-w-[87.5rem] shrink-0 items-start justify-between gap-4 px-10 pt-7 lg:px-20">
        <BackButton onClick={back} />
        <Wordmark />
      </header>
      <div className="relative z-10 mx-auto flex w-full max-w-[87.5rem] min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden px-10 pb-10 pt-4 lg:px-20">
        <div className="my-auto grid w-full grid-cols-2 gap-8 lg:gap-12">
          <motion.div
            variants={container(0.07, 0.05)}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6"
          >
            <motion.div variants={fadeIn} className="flex flex-col gap-2">
              <Title className="text-[clamp(2rem,4.5vw,3.25rem)]" />
              <p className="max-w-[440px] font-body leading-[1.45] opacity-70">{t('handsGuide.intro')}</p>
            </motion.div>
            <HandList selected={selected} onSelect={selectHand} size="lg" />
          </motion.div>
          <motion.div
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            className="flex flex-col overflow-hidden"
          >
            {detail(isWide ? 'lg' : 'md', true)}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HandsGuide;
