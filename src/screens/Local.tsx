import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../components/Avatar';
import Button from '../components/Button';

const rivalAvatars = import.meta.glob<{ default: string }>(
  '../assets/rivals/*.webp',
  { eager: true, query: 'url' },
);

function rivalAvatar(name: string): string | undefined {
  const slug = name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return rivalAvatars[`../assets/rivals/${slug}.webp`]?.default;
}
import Watermark from '../components/Watermark';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { loadSavedGame } from '../game/saveGame';

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
    tone: 'bg-success brightness-[0.55]',
    imgClassName: 'contrast-[0.85] saturate-75',
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
    tone: 'bg-bone brightness-[0.7]',
    imgClassName: 'contrast-100 saturate-100',
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
    tone: 'bg-danger brightness-[0.5]',
    imgClassName: 'contrast-125 saturate-150',
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
  onClick: () => void;
}> = ({ table, selected, size = 'sm', onClick }) => {
  const s = difficultyCardSizes[size];
  return (
    <div className={['w-full', size === 'lg' ? 'flex-1 min-h-0 @container' : ''].join(' ')}>
      <button
        type="button"
        aria-pressed={selected}
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
    </div>
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
    <div className="flex flex-col gap-5">
      {table.rivals.map(r => <RivalCard key={r.n} rival={r} tone={table.tone} imgClassName={table.imgClassName} />)}
    </div>
    <Button variant="primary" onClick={onStart} className="justify-between! rounded-[14px]! min-h-14!">
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
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const selected = TABLES.find(t => t.id === selectedId)!;

  const startGame = () => {
    if (loadSavedGame() && !window.confirm('Tienes una partida en curso. Si empiezas una nueva, se descartará. ¿Continuar?')) {
      return;
    }
    navigate(`/game/local-${selectedId}`);
  };

  const renderCards = (size: 'sm' | 'lg') =>
    TABLES.map(t => (
      <DifficultyCard key={t.id} table={t} selected={t.id === selectedId} size={size} onClick={() => setSelectedId(t.id)} />
    ));

  const shell = (children: React.ReactNode) => (
    <div className="relative flex h-screen w-full flex-col overflow-hidden font-body text-fs-300 leading-[1.25] text-bone">
      <div className="absolute inset-0 -z-20 bg-ink" aria-hidden="true" />
      <Watermark />
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
        <div className="mt-auto flex flex-col gap-4 pt-5">
          <Title className="text-[clamp(2rem,8.5vw,2.75rem)]" />
          <div className="flex flex-col gap-2">{renderCards('sm')}</div>
          <TableDetail table={selected} onStart={startGame} />
        </div>
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
          <div className="flex flex-[48] min-h-0 flex-col gap-6">
            <Title className="text-[clamp(2rem,4.5vw,3.25rem)]" />
            <div className="flex min-h-0 flex-1 flex-col gap-3">{renderCards('lg')}</div>
          </div>
          <div className="flex flex-[52] flex-col justify-center">
            <TableDetail table={selected} onStart={startGame} />
          </div>
        </div>
      </div>
    </>,
  );
};

export default Local;
