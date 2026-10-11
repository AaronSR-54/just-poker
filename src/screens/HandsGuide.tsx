import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { CardRank, CardSize, Suit } from '../types';
import PageHeader from '../components/PageHeader';
import PokerCard from '../components/PokerCard';
import Screen from '../components/Screen';
import ScreenTitle from '../components/ScreenTitle';
import SegmentedControl from '../components/SegmentedControl';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { container, fadeIn, slideSwap } from '../animations/motion';
import { useI18n } from '../i18n';

/* ------------------------------------------------------------------ *
 * Guía de manos — referencia de las diez combinaciones.
 * ------------------------------------------------------------------ */

const Title: React.FC<{ className?: string }> = ({ className }) => {
  const { t } = useI18n();
  return (
    <ScreenTitle
      em={t('handsGuide.titleEm')}
      rest={t('handsGuide.titleMain')}
      emLast
      className={`leading-[0.96] ${className ?? ''}`}
    />
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

const HandList: React.FC<{ selected: number; onSelect: (i: number) => void; fill?: boolean }> = ({ selected, onSelect, fill }) => {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ top: false, bottom: false });

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () =>
      setEdges({
        top: el.scrollTop > 1,
        bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 1,
      });
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [fill]);

  return (
    <div className={`flex min-h-0 gap-2 ${fill ? 'h-full' : ''}`}>
      <div className="relative min-h-0 flex-1">
        <div className={`pointer-events-none absolute inset-x-0 -top-px z-10 h-6 bg-gradient-to-b from-ink to-ink/0 transition-opacity duration-200 ${edges.top ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />
        <div className={`pointer-events-none absolute inset-x-0 -bottom-px z-10 h-6 bg-gradient-to-t from-ink to-ink/0 transition-opacity duration-200 ${edges.bottom ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />
        <div ref={scrollRef} className="h-full overflow-y-auto">
          <SegmentedControl
            columns={1}
            fill={fill}
            ariaLabel={t('handsGuide.listLabel')}
            value={selected}
            onChange={onSelect}
            options={HANDS.map((h, i) => ({ value: i, label: t(`handName.${h.rank}`) }))}
          />
        </div>
      </div>
      {/* Indicador de orden: de mejor mano (arriba) a peor mano (abajo). */}
      <div className="flex w-4 shrink-0 flex-col items-center py-1 text-bone/45" aria-hidden="true">
        <span className="font-display font-bold text-fs-100 uppercase tracking-[0.14em] [writing-mode:vertical-rl]">{t('handsGuide.best')}</span>
        <span className="mt-1 w-px flex-1 bg-bone/25" />
        <span className="my-0.5 font-display font-bold leading-none text-fs-300">↓</span>
        <span className="mb-1 w-px flex-1 bg-bone/25" />
        <span className="font-display font-bold text-fs-100 uppercase tracking-[0.14em] [writing-mode:vertical-rl]">{t('handsGuide.worst')}</span>
      </div>
    </div>
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
    <PageHeader
      onBack={back}
      backLabel={t('common.back')}
      className="flex w-full items-start justify-between gap-4"
      wordmarkClassName="text-fs-600"
    />
  );

  if (!isDesktop) {
    return (
      <Screen>
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
              <HandList selected={selected} onSelect={selectHand} fill />
            </motion.div>
          </motion.div>
        </div>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader
        onBack={back}
        backLabel={t('common.back')}
        className="relative z-10 mx-auto flex w-full max-w-[87.5rem] shrink-0 items-start justify-between gap-4 px-10 pt-7 lg:px-20"
        wordmarkClassName="text-fs-600"
      />
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
            <HandList selected={selected} onSelect={selectHand} />
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
    </Screen>
  );
};

export default HandsGuide;
