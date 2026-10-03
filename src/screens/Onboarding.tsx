import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import type { CardRank, Suit } from '../types';
import TopBar from '../components/TopBar';
import Button from '../components/Button';
import ProgressDots from '../components/ProgressDots';
import PokerCard from '../components/PokerCard';
import Avatar from '../components/Avatar';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useUserStore } from '../store/userStore';

interface Step {
  eyebrow: string;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    eyebrow: '01 / Empieza aquí',
    title: 'Dos formas de jugar.',
    body: 'Local contra una mesa de IA, o en línea con otros jugadores. Sin dinero real. Sin pagos. Sin límite.',
  },
  {
    eyebrow: '02 / Las reglas',
    title: 'Dos cartas tuyas, cinco de todos.',
    body: 'Cada jugador recibe dos cartas ocultas y se reparten hasta cinco comunitarias. Gana quien forma la mejor mano de cinco combinando las suyas con las de la mesa.',
  },
  {
    eyebrow: '03 / Las manos',
    title: 'De la pareja a la escalera real.',
    body: 'Hay diez combinaciones, ordenadas de menor a mayor. Son la base de cada decisión: cuanto más arriba, más difícil de conseguir… y más valor tiene.',
  },
  {
    eyebrow: '04 / Una mano',
    title: 'Pre-flop, flop, turn, river.',
    body: 'Las comunitarias se revelan por rondas: tres en el flop, una en el turn y la última en el river. En cada ronda, todos vuelven a apostar.',
  },
  {
    eyebrow: '05 / Las apuestas',
    title: 'Pasar, igualar, subir… o retirarse.',
    body: 'Las ciegas pequeña y grande abren cada mano con apuestas obligadas. En tu turno: pasa si nadie apostó, iguala la apuesta, súbela para presionar… o retírate y guarda tus fichas. Si no te llega para igualar, vas all-in.',
  },
  {
    eyebrow: '06 / La partida',
    title: 'Pierde tus fichas y quedas fuera.',
    body: 'Todos empiezan con 1.000 fichas. El bote de cada mano va al ganador. Si te quedas a cero, quedas eliminado. Gana la partida quien reúne todas las fichas de la mesa.',
  },
  {
    eyebrow: '07 / Modo local',
    title: 'Elige la dificultad, siéntate.',
    body: 'Tres niveles. Cada uno con una mesa fija de tres rivales con personalidad propia.',
  },
  {
    eyebrow: '08 / Modo online',
    title: 'Pública o privada.',
    body: 'Una mesa aleatoria que suma puntos al ranking, o una sala privada con código de 4 dígitos para tus amigos.',
  },
];

const HAND_RANKINGS: { name: string; example: string }[] = [
  { name: 'Escalera Real', example: 'A K Q J 10 del mismo palo' },
  { name: 'Escalera de Color', example: 'Cinco seguidas del mismo palo' },
  { name: 'Póker', example: 'Cuatro cartas iguales' },
  { name: 'Full House', example: 'Un trío y una pareja' },
  { name: 'Color', example: 'Cinco del mismo palo' },
  { name: 'Escalera', example: 'Cinco seguidas' },
  { name: 'Trío', example: 'Tres cartas iguales' },
  { name: 'Doble Pareja', example: 'Dos parejas distintas' },
  { name: 'Pareja', example: 'Dos cartas iguales' },
  { name: 'Carta Alta', example: 'Ninguna combinación' },
];

function ModesIllustration() {
  return (
    <div className="flex items-center justify-center gap-4">
      <div className="flex h-[200px] w-[148px] flex-col justify-between rounded-[14px] border-[1.5px] border-bone px-[1.125rem] py-[1.375rem]">
        <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">Local</div>
        <div className="flex flex-col font-display font-bold text-[30px] leading-[0.95]">
          <div>vs.</div>
          <div><em className="font-light italic tracking-normal opacity-80">IA</em></div>
        </div>
      </div>
      <div className="flex h-[200px] w-[148px] flex-col justify-between rounded-[14px] bg-bone px-[1.125rem] py-[1.375rem] text-ink">
        <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">Online</div>
        <div className="flex flex-col font-display font-bold text-[30px] leading-[0.95]">
          <div>vs.</div>
          <div><em className="font-light italic tracking-normal opacity-80">humanos</em></div>
        </div>
      </div>
    </div>
  );
}

function RulesIllustration() {
  const board: [CardRank, Suit][] = [['K', 'd'], ['7', 'c'], ['A', 'd'], ['3', 's'], ['9', 'h']];
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <PokerCard rank="A" suit="s" size="md" />
        <PokerCard rank="A" suit="h" size="md" />
      </div>
      <div className="font-body text-fs-100 tracking-[0.04em] opacity-60">tus cartas</div>
      <div className="flex gap-1">
        {board.map(([r, su], i) => <PokerCard key={i} rank={r} suit={su} size="xs" />)}
      </div>
      <div className="font-body text-fs-100 tracking-[0.04em] opacity-60">la mesa</div>
      <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase text-bone">→ Trío de ases</div>
    </div>
  );
}

function HandsIllustration() {
  return (
    <div className="flex min-w-[300px] flex-col gap-1">
      {HAND_RANKINGS.map((h, i) => (
        <div
          key={h.name}
          className={`flex items-center gap-3 rounded-lg px-3 py-[0.3125rem] ${
            i === 0 ? 'bg-bone text-ink' : 'bg-bone/[0.04] text-bone'
          }`}
        >
          <span className="w-[18px] font-display font-bold text-[12px] opacity-70">
            {10 - i}
          </span>
          <span className="flex-1 font-display font-bold text-[13px]">{h.name}</span>
          <span className="font-body text-[10px] tracking-[0.04em] opacity-65">{h.example}</span>
        </div>
      ))}
    </div>
  );
}

function RoundsIllustration() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-end gap-5">
        {[
          { ph: 'Pre-flop', cards: [] as [CardRank, Suit][] },
          { ph: 'Flop', cards: [['A', 's'], ['K', 's'], ['10', 's']] as [CardRank, Suit][] },
          { ph: 'Turn', cards: [['A', 's'], ['K', 's'], ['10', 's'], ['Q', 'h']] as [CardRank, Suit][] },
          { ph: 'River', cards: [['A', 's'], ['K', 's'], ['10', 's'], ['Q', 'h'], ['J', 's']] as [CardRank, Suit][] },
        ].map(s => (
          <div key={s.ph} className="flex flex-col items-center gap-2">
            <div className="flex min-h-12 gap-1">
              {s.cards.length === 0 && (
                <div className="h-12 w-[34px] rounded-sm border border-dashed border-bone/40" />
              )}
              {s.cards.map(([r, su], i) => <PokerCard key={i} rank={r} suit={su} size="xs" />)}
            </div>
            <div className="font-body text-[10px] tracking-[0.04em] opacity-70">{s.ph}</div>
          </div>
        ))}
      </div>
      <div className="font-body text-fs-100 tracking-[0.04em] opacity-60">ronda de apuestas tras cada paso</div>
    </div>
  );
}

function BettingIllustration() {
  const chip = 'inline-flex items-center rounded-pill px-4 py-2 font-display font-bold text-[11px] tracking-[0.08em] uppercase leading-none';
  const dot = 'inline-flex size-[22px] items-center justify-center rounded-full font-display font-bold text-[9px] tracking-[0.04em]';
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-wrap justify-center gap-2">
        <span className={`${chip} bg-bone/10 text-bone`}>Pasar</span>
        <span className={`${chip} bg-info/15 text-info`}>Igualar 20</span>
        <span className={`${chip} bg-bone text-ink`}>Subir</span>
        <span className={`${chip} bg-danger/20 text-danger`}>Retirarse</span>
      </div>
      <div className="flex items-center gap-3">
        <span className={`${dot} bg-info/20 text-info`}>SB</span>
        <span className={`${dot} bg-danger/20 text-danger`}>BB</span>
        <span className="font-body text-fs-100 tracking-[0.04em] opacity-70">las ciegas apuestan siempre, antes de repartir</span>
      </div>
      <div className="font-body text-fs-100 tracking-[0.04em] max-w-[300px] text-center opacity-70">
        Subir obliga a los demás a pagar la diferencia o retirarse.
      </div>
    </div>
  );
}

function MatchIllustration() {
  const players = [
    { n: 'Tú', chips: 1450, out: false },
    { n: 'Mia', chips: 0, out: true },
    { n: 'Dan', chips: 1950, out: false },
    { n: 'Sam', chips: 600, out: false },
  ];
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-end gap-4">
        {players.map(p => (
          <div key={p.n} className={`flex w-[72px] flex-col items-center gap-2 ${p.out ? 'opacity-35' : ''}`}>
            <Avatar name={p.n} size={56} muted={p.out} />
            <div className="font-display font-bold text-[11px] tracking-[0.12em] uppercase">{p.n}</div>
            <div className="font-body tracking-[0.04em] opacity-70 text-[10px]">
              {p.out ? 'Eliminado' : `🪙 ${p.chips}`}
            </div>
          </div>
        ))}
      </div>
      <div className="font-body text-fs-100 tracking-[0.04em] opacity-70">quédate sin fichas y la partida sigue sin ti</div>
    </div>
  );
}

function LocalIllustration() {
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex items-end gap-4">
        {[
          { n: 'Mia', t: 'Demasiado abierta' },
          { n: 'Dan', t: 'Farolea al azar' },
          { n: 'Sam', t: 'Imita a los demás' },
        ].map(p => (
          <div key={p.n} className="flex w-[88px] flex-col items-center gap-2">
            <Avatar name={p.n} size={64} />
            <div className="font-display font-bold text-[11px] tracking-[0.12em] uppercase">{p.n}</div>
            <div className="font-body tracking-[0.04em] opacity-70 text-center text-[10px]">{p.t}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="font-body text-fs-100 tracking-[0.04em] opacity-70">Fácil</span>
        <ProgressDots total={3} index={0} />
        <span className="font-body text-fs-100 tracking-[0.04em] opacity-70">Difícil</span>
      </div>
    </div>
  );
}

function OnlineIllustration() {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4">
        <div className="flex h-[130px] w-[172px] flex-col justify-between rounded-[14px] border-[1.5px] border-bone px-[1.125rem] py-[1.125rem]">
          <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">Sala pública</div>
          <div className="flex flex-col font-display font-bold leading-none text-fs-600">
            <div>Cuenta para</div>
            <div>el ranking</div>
          </div>
        </div>
        <div className="flex h-[130px] w-[172px] flex-col justify-between rounded-[14px] border-[1.5px] border-dashed border-bone px-[1.125rem] py-[1.125rem]">
          <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">Sala privada</div>
          <div className="flex items-baseline gap-2">
            {['7', '3', 'K', '9'].map((c, i) => (
              <span key={i} className="font-display font-bold text-[28px] leading-none">{c}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="font-body text-fs-100 tracking-[0.04em] opacity-70 max-w-[320px] text-center">Las privadas no cuentan para el ranking.</div>
    </div>
  );
}

function OnboardingIllustration({ step }: { step: number }) {
  switch (step) {
    case 0: return <ModesIllustration />;
    case 1: return <RulesIllustration />;
    case 2: return <HandsIllustration />;
    case 3: return <RoundsIllustration />;
    case 4: return <BettingIllustration />;
    case 5: return <MatchIllustration />;
    case 6: return <LocalIllustration />;
    case 7: return <OnlineIllustration />;
    default: return null;
  }
}
const Onboarding: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);
  const navigate = useNavigate();
  const completeOnboarding = useUserStore(st => st.completeOnboarding);
  const s = STEPS[stepIndex];
  const last = STEPS.length - 1;

  const isMobile = useMediaQuery('(max-width: 767px)');

  const finish = () => {
    completeOnboarding();
    navigate('/');
  };

  const next = () => {
    if (stepIndex < last) setStepIndex(stepIndex + 1);
    else finish();
  };

  const stepContent = (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepIndex}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -24 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col gap-2 text-left"
      >
        <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">{s.eyebrow}</div>
        <div className={`font-display font-bold tracking-[-0.01em] ${isMobile ? 'text-[28px] leading-[1.05]' : 'text-[48px] leading-[0.96]'}`}>{s.title}</div>
        <div className={`font-body leading-[1.45] ${isMobile ? 'mt-1 opacity-78' : 'mt-2 max-w-[400px] text-fs-400 leading-[1.55] opacity-80'}`}>{s.body}</div>
      </motion.div>
    </AnimatePresence>
  );

  const illustration = (
    <AnimatePresence mode="wait">
      <motion.div
        key={stepIndex}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25 }}
        className="flex items-center justify-center"
      >
        <OnboardingIllustration step={stepIndex} />
      </motion.div>
    </AnimatePresence>
  );

  if (isMobile) {
    return (
      <div className="relative flex h-screen w-full flex-col overflow-hidden bg-ink font-body text-fs-300 leading-[1.25] text-bone">
        <div className="flex shrink-0 items-center justify-between border-b border-bone/10 px-[1.125rem] py-[0.875rem]">
          <div className="font-display font-bold text-fs-400 uppercase tracking-[0.08em]">Just <em className="font-light italic tracking-normal">Poker</em></div>
          <Button size="sm" variant="ghost" onClick={finish}>Omitir</Button>
        </div>
        <div className="flex flex-1 flex-col justify-between overflow-y-auto px-[1.375rem] py-6">
          <div className="flex flex-1 flex-col justify-center gap-4">
            <div className="flex min-h-[190px] items-center justify-center">
              {illustration}
            </div>
            {stepContent}
          </div>
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex justify-center">
              <ProgressDots total={STEPS.length} index={stepIndex} />
            </div>
            <Button variant="primary" block glow onClick={next}>
              {stepIndex < last ? 'Siguiente' : 'Empezar'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-ink font-body text-fs-300 leading-[1.25] text-bone">
      <TopBar right={<Button size="sm" variant="ghost" onClick={finish}>Omitir</Button>} />
      <div className="flex flex-1 items-center gap-[60px] px-[3.75rem] py-10">
        <div className="flex max-w-[440px] flex-1 flex-col gap-5">
          {stepContent}
          <div className="mt-4 flex items-center gap-4">
            <Button variant="primary" glow onClick={next}>
              {stepIndex < last ? 'Siguiente' : 'Empezar'}
            </Button>
            <ProgressDots total={STEPS.length} index={stepIndex} />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center overflow-y-auto">
          {illustration}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
