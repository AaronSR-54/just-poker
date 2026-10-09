import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ConfirmDialog from '../components/ConfirmDialog';
import CtaButton from '../components/CtaButton';
import PageHeader from '../components/PageHeader';
import Panel from '../components/Panel';
import PersonCard from '../components/PersonCard';
import ScreenTitle from '../components/ScreenTitle';
import SelectableCard from '../components/SelectableCard';
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

// Tarjeta de dificultad seleccionable. Mismo componente en móvil y escritorio; solo varía el size.
const DifficultyCard: React.FC<{
  table: Table;
  selected: boolean;
  size?: 'sm' | 'lg';
  dataTour?: string;
  dense?: boolean;
  onClick: () => void;
}> = ({ table, selected, size = 'sm', dataTour, dense = false, onClick }) => {
  const { t } = useI18n();
  return (
    <SelectableCard
      label={t(`difficulty.${table.id}`)}
      secondary={table.rivals.map(r => r.n).join(' · ')}
      selected={selected}
      size={size}
      stretch={false}
      dense={dense}
      dataTour={dataTour}
      onClick={onClick}
    />
  );
};

const RivalCard: React.FC<{ rival: Rival; tone: string; imgClassName: string; compact?: boolean }> = ({ rival, tone, imgClassName, compact = false }) => {
  const { t } = useI18n();
  const slug = rivalSlug(rival.n);
  return (
    <PersonCard
      name={rival.n}
      quip={t(rivalAliasKey(rival.n) ?? '')}
      secondary={t(`local.rival.${slug}.trait`)}
      avatarSrc={rivalAvatar(rival.n)}
      avatarTone={tone}
      avatarImgClassName={imgClassName}
      compact={compact}
    />
  );
};

// Detalle de la mesa seleccionada + CTA. Mismo componente en ambos layouts.
const TableDetail: React.FC<{ table: Table; onStart: () => void; compact?: boolean }> = ({ table, onStart, compact = false }) => {
  const { t } = useI18n();
  return (
  <Panel compact={compact}>
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
    <CtaButton compact={compact} dataTour="start-game" onClick={onStart}>
      {t('local.play')}
    </CtaButton>
  </Panel>
  );
};

const Title: React.FC<{ className?: string }> = ({ className }) => {
  const { t } = useI18n();
  return <ScreenTitle em={t('local.titleEm')} rest={t('local.titleRest')} className={className} />;
};

const Local: React.FC = () => {
  const [selectedId, setSelectedId] = useState('medium');
  const [dir, setDir] = useState(1);
  const [confirmNew, setConfirmNew] = useState(false);
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  /** Pantallas muy estrechas (<300px): se compacta todo para que no haya scroll. */
  const isTiny = useMediaQuery('(max-width: 299px)');
  /** Pantallas bajas (móviles 16:9): se compacta para evitar scroll vertical. */
  const isShort = useMediaQuery('(max-height: 720px)');
  const dense = isTiny || isShort;
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

  const renderCards = (size: 'sm' | 'lg', denseCards = false) =>
    TABLES.map(t => (
      <DifficultyCard key={t.id} table={t} selected={t.id === selectedId} size={size} dense={denseCards} dataTour={`difficulty-${t.id}`} onClick={() => selectTable(t.id)} />
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
      <div className={`flex min-h-0 flex-1 flex-col overflow-y-auto px-[1.375rem] ${dense ? 'pb-5 pt-5' : 'pb-7 pt-8'}`}>
        <PageHeader
          onBack={() => navigate('/')}
          backLabel={t('common.backToMenu')}
          className="flex w-full items-start justify-between gap-4"
          wordmarkClassName={isTiny ? 'text-fs-500' : 'text-fs-600'}
        />
        <motion.div
          variants={container(0.07, 0.05)}
          initial="hidden"
          animate="visible"
          className={dense ? 'mt-auto flex flex-col gap-3 pt-3' : 'mt-auto flex flex-col gap-4 pt-5'}
        >
          <motion.div variants={fadeUp}>
            <Title className={isTiny ? 'text-fs-600' : 'text-[clamp(2rem,8.5vw,2.75rem)]'} />
          </motion.div>
          <motion.div variants={container(0.06)} data-tour="difficulty-list" className="flex flex-col gap-2">{renderCards('sm', dense)}</motion.div>
          <motion.div variants={fadeUp}>
            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                variants={slideSwap(dir, 28)}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <TableDetail table={selected} onStart={startGame} compact={dense} />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>,
    );
  }

  return shell(
    <>
      <PageHeader onBack={() => navigate('/')} backLabel={t('common.backToMenu')} />
      <div className="mx-auto flex w-full max-w-[87.5rem] flex-1 items-center justify-center px-10 pb-[3.5rem] pt-4 lg:px-20">
        <div className="flex w-full items-center justify-center gap-8 lg:gap-12">
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
