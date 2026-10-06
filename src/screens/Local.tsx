import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { loadSavedGame } from '../game/saveGame';
import { rivalAvatar, rivalAliasKey, rivalSlug, DIFFICULTY_AVATAR_TONE } from '../game/rivals';
import { container, fadeUp, slideSwap } from '../animations/motion';
import { useI18n } from '../i18n';
import { useUserStore } from '../store/userStore';
import { useOnboardingStore } from '../store/onboardingStore';

interface Rival {
  n: string;
}

interface Table {
  id: 'easy' | 'medium' | 'hard';
  roman: string;
  tone: string;
  imgClassName: string;
  rivals: Rival[];
}

const TABLES: Table[] = [
  {
    id: 'easy', roman: 'I',
    ...DIFFICULTY_AVATAR_TONE.easy,
    rivals: [{ n: 'Mia' }, { n: 'Dan' }, { n: 'Sam' }],
  },
  {
    id: 'medium', roman: 'II',
    ...DIFFICULTY_AVATAR_TONE.medium,
    rivals: [{ n: 'Leo' }, { n: 'Nora' }, { n: 'Kai' }],
  },
  {
    id: 'hard', roman: 'III',
    ...DIFFICULTY_AVATAR_TONE.hard,
    rivals: [{ n: 'Víctor' }, { n: 'Elena' }, { n: 'Rex' }],
  },
];

const difficultyCardSizes = {
  sm: { root: 'gap-4 rounded-[14px] px-[1.125rem] py-4', label: 'text-fs-500', rivals: 'text-fs-200' },
  lg: { root: 'gap-6 rounded-[clamp(0.75rem,2.4cqw,1rem)] px-[4.5cqw] py-[4cqw]', label: 'text-[clamp(1.5rem,5.5cqw,2.75rem)]', rivals: 'text-fs-300 leading-[1.35]' },
} as const;

// Tarjeta de dificultad seleccionable. Mismo componente en móvil y escritorio; solo varía el size.
const DifficultyCard: React.FC<{
  table: Table;
  selected: boolean;
  size?: keyof typeof difficultyCardSizes;
  dataTour?: string;
  onClick: () => void;
}> = ({ table, selected, size = 'sm', dataTour, onClick }) => {
  const { t } = useI18n();
  const s = difficultyCardSizes[size];
  return (
    <motion.div
      variants={fadeUp}
      className={['w-full', size === 'lg' ? 'flex-1 min-h-0 @container' : ''].join(' ')}
    >
      <button
        type="button"
        aria-pressed={selected}
        data-tour={dataTour}
        onClick={onClick}
        className={[
          'flex h-full w-full items-center justify-between text-left cursor-pointer border-[1.5px]',
          s.root,
          'transition-[background-color,border-color,transform] duration-[240ms] ease-brand',
          'enabled:hover:-translate-y-0.5 enabled:hover:border-bone enabled:active:translate-y-px',
          'focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-bone',
          selected ? 'border-bone bg-bone text-ink' : 'border-bone/40 bg-ink text-bone',
        ].join(' ')}
      >
        <div className={`font-display font-bold leading-none ${s.label}`}>{t(`difficulty.${table.id}`)}</div>
        <div className={`shrink-0 text-right font-body tracking-[0.04em] opacity-70 ${s.rivals}`}>
          {table.rivals.map(r => r.n).join(' · ')}
        </div>
      </button>
    </motion.div>
  );
};

const RivalCard: React.FC<{ rival: Rival; tone: string; imgClassName: string; compact?: boolean }> = ({ rival, tone, imgClassName, compact = false }) => {
  const { t } = useI18n();
  const slug = rivalSlug(rival.n);
  return (
    <div className={`flex items-center ${compact ? 'gap-3' : 'gap-4'}`}>
      <Avatar name={rival.n} src={rivalAvatar(rival.n)} size={compact ? 48 : 56} tone={tone} imgClassName={imgClassName} />
      <div className="flex flex-col gap-1">
        <div className="font-display font-bold leading-none text-fs-300">
          {rival.n} <em className="font-light italic opacity-80">“{t(rivalAliasKey(rival.n) ?? '')}”</em>
        </div>
        <div className="font-body text-fs-100 leading-[1.35] tracking-[0.04em] opacity-70">{t(`local.rival.${slug}.trait`)}</div>
      </div>
    </div>
  );
};

// Detalle de la mesa seleccionada + CTA. Mismo componente en ambos layouts.
const TableDetail: React.FC<{ table: Table; onStart: () => void; compact?: boolean }> = ({ table, onStart, compact = false }) => {
  const { t } = useI18n();
  return (
  <div className={`flex flex-col bg-ink-900 ${compact ? 'gap-4 rounded-[12px] p-5' : 'gap-6 rounded-[14px] p-6 sm:gap-8 sm:p-9'}`}>
    <div className="flex flex-col gap-1">
      <div className="font-display font-bold leading-none text-fs-700">{t(`local.table.${table.id}.title`)}</div>
      <div className={`font-body leading-[1.45] mt-1 opacity-70 ${compact ? 'text-fs-200' : ''}`}>
        <strong className="font-bold">{t('local.difficultyLine', { difficulty: t(`difficulty.${table.id}`) })}</strong> {t(`local.table.${table.id}.blurb`)}
      </div>
    </div>
    <motion.div
      variants={container(0.07)}
      initial="hidden"
      animate="visible"
      className={`flex flex-col ${compact ? 'gap-4' : 'gap-5'}`}
    >
      {table.rivals.map(r => (
        <motion.div key={r.n} variants={fadeUp}>
          <RivalCard rival={r} tone={table.tone} imgClassName={table.imgClassName} compact={compact} />
        </motion.div>
      ))}
    </motion.div>
    <Button variant="primary" data-tour="start-game" onClick={onStart} className={`justify-between! rounded-[14px]! ${compact ? 'min-h-12!' : 'min-h-14!'}`}>
      <span>{t('local.play')}</span>
      <span className={`font-display font-bold leading-none ${compact ? 'text-fs-400' : 'text-fs-500'}`}>→</span>
    </Button>
  </div>
  );
};

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const { t } = useI18n();
  return (
  <Button
    size="sm"
    variant="ghost"
    className="min-h-0! p-0! text-fs-500! leading-none! text-bone!"
    aria-label={t('common.backToMenu')}
    onClick={onClick}
  >
    ←
  </Button>
  );
};

const Wordmark: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`flex flex-col items-end font-display font-bold uppercase leading-[0.86] tracking-[-0.015em] ${className ?? 'text-fs-800'}`}>
    <span className="text-[0.85em]">Just</span>
    <span className="text-[0.9em]"><em className="font-light italic tracking-normal">Poker</em></span>
  </div>
);

const Title: React.FC<{ className?: string }> = ({ className }) => {
  const { t } = useI18n();
  return (
  <div className={`font-display font-bold leading-[0.94] tracking-[-0.015em] ${className ?? ''}`}>
    <span className="whitespace-nowrap"><em className="font-light italic tracking-normal">{t('local.titleEm')}</em> {t('local.titleRest')}</span>
  </div>
  );
};

const Local: React.FC = () => {
  const [selectedId, setSelectedId] = useState('medium');
  const [dir, setDir] = useState(1);
  const [confirmNew, setConfirmNew] = useState(false);
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  /** Pantallas muy estrechas (<300px): se compacta todo para que no haya scroll. */
  const isTiny = useMediaQuery('(max-width: 299px)');
  const { t } = useI18n();
  const onboardingCompleted = useUserStore(s => s.onboardingCompleted);
  const setDifficulty = useOnboardingStore(s => s.setDifficulty);
  const selected = TABLES.find(t => t.id === selectedId)!;

  const selectTable = (id: string) => {
    if (id === selectedId) return;
    const from = TABLES.findIndex(t => t.id === selectedId);
    const to = TABLES.findIndex(t => t.id === id);
    setDir(to >= from ? 1 : -1);
    setSelectedId(id);
    setDifficulty(id);
  };

  const startGame = () => {
    // En la bienvenida, «Jugar» abre la mano guiada en lugar de una partida real.
    if (!onboardingCompleted) {
      navigate('/game/guide');
      return;
    }
    if (loadSavedGame()) {
      setConfirmNew(true);
      return;
    }
    navigate(`/game/local-${selectedId}`);
  };

  const confirmStartGame = () => {
    setConfirmNew(false);
    navigate(`/game/local-${selectedId}`);
  };

  const renderCards = (size: 'sm' | 'lg') =>
    TABLES.map(t => (
      <DifficultyCard key={t.id} table={t} selected={t.id === selectedId} size={size} dataTour={`difficulty-${t.id}`} onClick={() => selectTable(t.id)} />
    ));

  const shell = (children: React.ReactNode) => (
    <div className="relative flex h-dvh w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
      <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
      <ConfirmDialog
        open={confirmNew}
        title={t('local.confirm.title')}
        message={t('local.confirm.message')}
        confirmLabel={t('local.confirm.confirm')}
        cancelLabel={t('local.confirm.cancel')}
        danger
        onConfirm={confirmStartGame}
        onCancel={() => setConfirmNew(false)}
      />
    </div>
  );

  if (isMobile) {
    return shell(
      <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto px-[1.375rem] ${isTiny ? 'pb-5 pt-5' : 'pb-7 pt-8'}`}>
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <BackButton onClick={() => navigate('/')} />
            <Wordmark className={isTiny ? 'text-fs-500' : 'text-fs-600'} />
          </div>
        </div>
        <motion.div
          variants={container(0.07, 0.05)}
          initial="hidden"
          animate="visible"
          className={isTiny ? 'mt-auto flex flex-col gap-3 pt-3' : 'mt-auto flex flex-col gap-4 pt-5'}
        >
          <motion.div variants={fadeUp}>
            <Title className={isTiny ? 'text-fs-600' : 'text-[clamp(2rem,8.5vw,2.75rem)]'} />
          </motion.div>
          <motion.div variants={container(0.06)} data-tour="difficulty-list" className="flex flex-col gap-2">{renderCards('sm')}</motion.div>
          <motion.div variants={fadeUp}>
            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                variants={slideSwap(dir, 28)}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <TableDetail table={selected} onStart={startGame} compact={isTiny} />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>,
    );
  }

  return shell(
    <>
      <header className="mx-auto flex w-full max-w-[87.5rem] shrink-0 items-start justify-between gap-4 px-10 pt-7 lg:px-20">
        <BackButton onClick={() => navigate('/')} />
        <Wordmark />
      </header>
      <div className="mx-auto flex w-full max-w-[87.5rem] flex-1 items-center justify-center px-10 pb-[3.5rem] pt-4 lg:px-20">
        <div className="flex w-full items-stretch justify-center gap-8 lg:gap-12">
          <motion.div
            variants={container(0.07, 0.05)}
            initial="hidden"
            animate="visible"
            className="flex flex-[48] min-h-0 flex-col gap-6"
          >
            <motion.div variants={fadeUp}>
              <Title className="text-[clamp(2rem,4.5vw,3.25rem)]" />
            </motion.div>
            <motion.div variants={container(0.06)} data-tour="difficulty-list" className="flex min-h-0 flex-1 flex-col gap-3">{renderCards('lg')}</motion.div>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="flex flex-[52] flex-col justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                variants={slideSwap(dir, 28)}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <TableDetail table={selected} onStart={startGame} />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </>,
  );
};

export default Local;
