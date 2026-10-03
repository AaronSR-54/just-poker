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
    <div className="row gap-4" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: 148, height: 200, borderRadius: 14, border: '1.5px solid var(--bone)', padding: '22px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div className="jp-eyebrow" style={{ opacity: 0.6 }}>Local</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, lineHeight: 0.95 }}>vs.<br /><em className="italic" style={{ opacity: 0.8 }}>IA</em></div>
      </div>
      <div style={{ width: 148, height: 200, borderRadius: 14, background: 'var(--bone)', color: 'var(--ink)', padding: '22px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div className="jp-eyebrow" style={{ opacity: 0.7 }}>Online</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, lineHeight: 0.95 }}>vs.<br /><em className="italic" style={{ opacity: 0.8 }}>humanos</em></div>
      </div>
    </div>
  );
}

function RulesIllustration() {
  const board: [CardRank, Suit][] = [['K', 'd'], ['7', 'c'], ['A', 'd'], ['3', 's'], ['9', 'h']];
  return (
    <div className="col gap-4" style={{ alignItems: 'center' }}>
      <div className="row gap-2" style={{ alignItems: 'center' }}>
        <PokerCard rank="A" suit="s" size="md" />
        <PokerCard rank="A" suit="h" size="md" />
      </div>
      <div className="jp-caption" style={{ opacity: 0.6 }}>tus cartas</div>
      <div className="row gap-1">
        {board.map(([r, su], i) => <PokerCard key={i} rank={r} suit={su} size="xs" />)}
      </div>
      <div className="jp-caption" style={{ opacity: 0.6 }}>la mesa</div>
      <div className="jp-label" style={{ color: 'var(--bone)' }}>→ Trío de ases</div>
    </div>
  );
}

function HandsIllustration() {
  return (
    <div className="col gap-1" style={{ alignItems: 'stretch', minWidth: 300 }}>
      {HAND_RANKINGS.map((h, i) => (
        <div
          key={h.name}
          className="row gap-3"
          style={{
            alignItems: 'center',
            padding: '5px 12px',
            borderRadius: 8,
            background: i === 0 ? 'var(--bone)' : 'rgba(205,197,183,0.04)',
            color: i === 0 ? 'var(--ink)' : 'var(--bone)',
          }}
        >
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, width: 18, opacity: 0.7 }}>
            {10 - i}
          </span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, flex: 1 }}>{h.name}</span>
          <span className="jp-caption" style={{ fontSize: 10, opacity: 0.65 }}>{h.example}</span>
        </div>
      ))}
    </div>
  );
}

function RoundsIllustration() {
  return (
    <div className="col gap-3" style={{ alignItems: 'center' }}>
      <div className="row gap-5" style={{ alignItems: 'flex-end' }}>
        {[
          { ph: 'Pre-flop', cards: [] as [CardRank, Suit][] },
          { ph: 'Flop', cards: [['A', 's'], ['K', 's'], ['10', 's']] as [CardRank, Suit][] },
          { ph: 'Turn', cards: [['A', 's'], ['K', 's'], ['10', 's'], ['Q', 'h']] as [CardRank, Suit][] },
          { ph: 'River', cards: [['A', 's'], ['K', 's'], ['10', 's'], ['Q', 'h'], ['J', 's']] as [CardRank, Suit][] },
        ].map(s => (
          <div key={s.ph} className="col gap-2" style={{ alignItems: 'center' }}>
            <div className="row gap-1" style={{ minHeight: 48 }}>
              {s.cards.length === 0 && (
                <div style={{ width: 34, height: 48, border: '1px dashed rgba(205,197,183,0.4)', borderRadius: 4 }} />
              )}
              {s.cards.map(([r, su], i) => <PokerCard key={i} rank={r} suit={su} size="xs" />)}
            </div>
            <div className="jp-caption" style={{ fontSize: 10 }}>{s.ph}</div>
          </div>
        ))}
      </div>
      <div className="jp-caption" style={{ opacity: 0.6 }}>ronda de apuestas tras cada paso</div>
    </div>
  );
}

function BettingIllustration() {
  return (
    <div className="col gap-4" style={{ alignItems: 'center' }}>
      <div className="row gap-2" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
        <span className="jp-badge neutral" style={{ padding: '8px 16px', fontSize: 11 }}>Pasar</span>
        <span className="jp-badge info" style={{ padding: '8px 16px', fontSize: 11 }}>Igualar 20</span>
        <span className="jp-badge neutral" style={{ padding: '8px 16px', fontSize: 11, background: 'var(--bone)', color: 'var(--ink)' }}>Subir</span>
        <span className="jp-badge warning" style={{ padding: '8px 16px', fontSize: 11 }}>Retirarse</span>
      </div>
      <div className="row gap-3" style={{ alignItems: 'center' }}>
        <span className="jp-blind-dot sb" style={{ width: 22, height: 22, fontSize: 9 }}>SB</span>
        <span className="jp-blind-dot bb" style={{ width: 22, height: 22, fontSize: 9 }}>BB</span>
        <span className="jp-caption">las ciegas apuestan siempre, antes de repartir</span>
      </div>
      <div className="jp-caption" style={{ maxWidth: 300, textAlign: 'center', opacity: 0.7 }}>
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
    <div className="col gap-3" style={{ alignItems: 'center' }}>
      <div className="row gap-4" style={{ alignItems: 'flex-end' }}>
        {players.map(p => (
          <div key={p.n} className="col gap-2" style={{ alignItems: 'center', width: 72, opacity: p.out ? 0.35 : 1 }}>
            <Avatar name={p.n} size={56} muted={p.out} />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{p.n}</div>
            <div className="jp-caption" style={{ fontSize: 10 }}>
              {p.out ? 'Eliminado' : `🪙 ${p.chips}`}
            </div>
          </div>
        ))}
      </div>
      <div className="jp-caption" style={{ opacity: 0.7 }}>quédate sin fichas y la partida sigue sin ti</div>
    </div>
  );
}

function LocalIllustration() {
  return (
    <div className="col gap-5" style={{ alignItems: 'center' }}>
      <div className="row gap-4" style={{ alignItems: 'flex-end' }}>
        {[
          { n: 'Mia', t: 'Demasiado abierta' },
          { n: 'Dan', t: 'Farolea al azar' },
          { n: 'Sam', t: 'Imita a los demás' },
        ].map(p => (
          <div key={p.n} className="col gap-2" style={{ alignItems: 'center', width: 88 }}>
            <Avatar name={p.n} size={64} />
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{p.n}</div>
            <div className="jp-caption" style={{ textAlign: 'center', fontSize: 10 }}>{p.t}</div>
          </div>
        ))}
      </div>
      <div className="row gap-2" style={{ alignItems: 'center' }}>
        <span className="jp-caption">Fácil</span>
        <ProgressDots total={3} index={0} />
        <span className="jp-caption">Difícil</span>
      </div>
    </div>
  );
}

function OnlineIllustration() {
  return (
    <div className="col gap-4" style={{ alignItems: 'center' }}>
      <div className="row gap-4">
        <div style={{ width: 172, height: 130, borderRadius: 14, border: '1.5px solid var(--bone)', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="jp-eyebrow" style={{ opacity: 0.6 }}>Sala pública</div>
          <div className="jp-h3">Cuenta para<br />el ranking</div>
        </div>
        <div style={{ width: 172, height: 130, borderRadius: 14, border: '1.5px dashed var(--bone)', padding: '18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="jp-eyebrow" style={{ opacity: 0.6 }}>Sala privada</div>
          <div className="row gap-2" style={{ alignItems: 'baseline' }}>
            {['7', '3', 'K', '9'].map((c, i) => (
              <span key={i} style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, lineHeight: 1 }}>{c}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="jp-caption" style={{ textAlign: 'center', maxWidth: 320 }}>Las privadas no cuentan para el ranking.</div>
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
        className="col gap-2"
        style={{ textAlign: 'left' }}
      >
        <div className="jp-eyebrow">{s.eyebrow}</div>
        <div className={isMobile ? 'jp-h2' : 'jp-h1'} style={isMobile ? { fontSize: 28, lineHeight: 1.05 } : { fontSize: 48, lineHeight: 0.96 }}>{s.title}</div>
        <div className="jp-body" style={isMobile ? { opacity: 0.78, marginTop: 4 } : { fontSize: 16, opacity: 0.8, lineHeight: 1.55, maxWidth: 400, marginTop: 8 }}>{s.body}</div>
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
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <OnboardingIllustration step={stepIndex} />
      </motion.div>
    </AnimatePresence>
  );

  if (isMobile) {
    return (
      <div className="jp-screen">
        <div className="jp-bar">
          <div className="brand">Just <em>Poker</em></div>
          <Button size="sm" variant="ghost" onClick={finish}>Omitir</Button>
        </div>
        <div className="col" style={{ flex: 1, padding: '24px 22px', justifyContent: 'space-between', overflowY: 'auto' }}>
          <div className="col gap-4" style={{ flex: 1, justifyContent: 'center' }}>
            <div style={{ minHeight: 190, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {illustration}
            </div>
            {stepContent}
          </div>
          <div className="col gap-4" style={{ marginTop: 16 }}>
            <div className="row" style={{ justifyContent: 'center' }}>
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
    <div className="jp-screen">
      <TopBar right={<Button size="sm" variant="ghost" onClick={finish}>Omitir</Button>} />
      <div className="row" style={{ flex: 1, padding: '40px 60px', gap: 60, alignItems: 'center' }}>
        <div className="col gap-5" style={{ flex: 1, maxWidth: 440 }}>
          {stepContent}
          <div className="row gap-4" style={{ alignItems: 'center', marginTop: 16 }}>
            <Button variant="primary" glow onClick={next}>
              {stepIndex < last ? 'Siguiente' : 'Empezar'}
            </Button>
            <ProgressDots total={STEPS.length} index={stepIndex} />
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
          {illustration}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
