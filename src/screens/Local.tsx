import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { loadSavedGame } from '../game/saveGame';
import { rivalAvatar, DIFFICULTY_AVATAR_TONE } from '../game/rivals';
import { container, fadeUp, slideSwap } from '../animations/motion';
import { useUserStore } from '../store/userStore';
import { useOnboardingStore } from '../store/onboardingStore';

interface Rival {
  n: string;
  alias: string;
  t: string;
}

interface Table {
  id: string;
  diff: string;
  roman: string;
  title: string;
  blurb: string;
  tone: string;
  imgClassName: string;
  rivals: Rival[];
}

const TABLES: Table[] = [
  {
    id: 'easy', diff: 'Fácil', roman: 'I',
    title: 'El Remanso',
    blurb: 'Sin prisa ni presión.',
    ...DIFFICULTY_AVATAR_TONE.easy,
    rivals: [
      { n: 'Mia', alias: 'la Impulsiva', t: 'Juega demasiadas manos, se retira bajo presión.' },
      { n: 'Dan', alias: 'Papel de Fumar', t: 'Farolea al azar, sin lógica.' },
      { n: 'Sam', alias: 'Perfil Bajo', t: 'Imita a los demás, sin estrategia.' },
    ],
  },
  {
    id: 'medium', diff: 'Media', roman: 'II',
    title: 'La Guarida',
    blurb: 'El equilibrio justo.',
    ...DIFFICULTY_AVATAR_TONE.medium,
    rivals: [
      { n: 'Leo', alias: 'El Libro', t: 'Agresivo-prudente, juega por el libro.' },
      { n: 'Nora', alias: 'la Lectora', t: 'Lee patrones de apuesta, muy paciente.' },
      { n: 'Kai', alias: 'Dos Caras', t: 'Semi-farolea, difícil de leer.' },
    ],
  },
  {
    id: 'hard', diff: 'Difícil', roman: 'III',
    title: 'La Fosa',
    blurb: 'Solo para quien sabe lo que hace.',
    ...DIFFICULTY_AVATAR_TONE.hard,
    rivals: [
      { n: 'Víctor', alias: 'La Calculadora', t: 'Frío, calcula probabilidades constantemente.' },
      { n: 'Elena', alias: 'La Trampa', t: 'Tiende trampas con manos fuertes, casi nunca se retira.' },
      { n: 'Rex', alias: 'Todo o Nada', t: 'Hiperagresivo, sube en cada ronda.' },
    ],
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
          selected ? 'border-bone bg-bone text-ink' : 'border-bone/40 text-bone',
        ].join(' ')}
      >
        <div className={`font-display font-bold leading-none ${s.label}`}>{table.diff}</div>
        <div className={`shrink-0 text-right font-body tracking-[0.04em] opacity-70 ${s.rivals}`}>
          {table.rivals.map(r => r.n).join(' · ')}
        </div>
      </button>
    </motion.div>
  );
};

const RivalCard: React.FC<{ rival: Rival; tone: string; imgClassName: string }> = ({ rival, tone, imgClassName }) => (
  <div className="flex items-center gap-4">
    <Avatar name={rival.n} src={rivalAvatar(rival.n)} size={56} tone={tone} imgClassName={imgClassName} />
    <div className="flex flex-col gap-1">
      <div className="font-display font-bold leading-none text-fs-300">
        {rival.n} <em className="font-light italic opacity-80">"{rival.alias}"</em>
      </div>
      <div className="font-body text-fs-100 leading-[1.35] tracking-[0.04em] opacity-70">{rival.t}</div>
    </div>
  </div>
);

// Detalle de la mesa seleccionada + CTA. Mismo componente en ambos layouts.
const TableDetail: React.FC<{ table: Table; onStart: () => void }> = ({ table, onStart }) => (
  <div className="flex flex-col gap-8 rounded-[14px] bg-ink-900 p-9">
    <div className="flex flex-col gap-1">
      <div className="font-display font-bold leading-none text-fs-700">{table.title}</div>
      <div className="font-body leading-[1.45] mt-1 opacity-70">
        <strong className="font-bold">Dificultad {table.diff}.</strong> {table.blurb}
      </div>
    </div>
    <motion.div
      variants={container(0.07)}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-5"
    >
      {table.rivals.map(r => (
        <motion.div key={r.n} variants={fadeUp}>
          <RivalCard rival={r} tone={table.tone} imgClassName={table.imgClassName} />
        </motion.div>
      ))}
    </motion.div>
    <Button variant="primary" data-tour="start-game" onClick={onStart} className="justify-between! rounded-[14px]! min-h-14!">
      <span>Jugar</span>
      <span className="font-display font-bold leading-none text-fs-500">→</span>
    </Button>
  </div>
);

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <Button
    size="sm"
    variant="ghost"
    className="min-h-0! p-0! text-fs-500! leading-none! text-bone!"
    aria-label="Volver al menú"
    onClick={onClick}
  >
    ←
  </Button>
);

const Wordmark: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`flex flex-col items-end font-display font-bold uppercase leading-[0.86] tracking-[-0.015em] ${className ?? 'text-fs-800'}`}>
    <span className="text-[0.85em]">Just</span>
    <span className="text-[0.9em]"><em className="font-light italic tracking-normal">Poker</em></span>
  </div>
);

const Title: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`font-display font-bold leading-[0.94] tracking-[-0.015em] ${className ?? ''}`}>
    <span className="whitespace-nowrap"><em className="font-light italic tracking-normal">Elige la</em> dificultad</span>
  </div>
);

const Local: React.FC = () => {
  const [selectedId, setSelectedId] = useState('medium');
  const [dir, setDir] = useState(1);
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
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
    if (loadSavedGame() && !window.confirm('Tienes una partida en curso. Si empiezas una nueva, se descartará. ¿Continuar?')) {
      return;
    }
    navigate(`/game/local-${selectedId}`);
  };

  const renderCards = (size: 'sm' | 'lg') =>
    TABLES.map(t => (
      <DifficultyCard key={t.id} table={t} selected={t.id === selectedId} size={size} dataTour={`difficulty-${t.id}`} onClick={() => selectTable(t.id)} />
    ));

  const shell = (children: React.ReactNode) => (
    <div className="relative flex h-screen w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );

  if (isMobile) {
    return shell(
      <div className="flex flex-1 flex-col px-[1.375rem] pb-7 pt-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <BackButton onClick={() => navigate('/')} />
            <Wordmark className="text-fs-600" />
          </div>
        </div>
        <motion.div
          variants={container(0.07, 0.05)}
          initial="hidden"
          animate="visible"
          className="mt-auto flex flex-col gap-4 pt-5"
        >
          <motion.div variants={fadeUp}>
            <Title className="text-[clamp(2rem,8.5vw,2.75rem)]" />
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
                <TableDetail table={selected} onStart={startGame} />
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
