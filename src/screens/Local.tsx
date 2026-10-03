import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import { useMediaQuery } from '../hooks/useMediaQuery';

interface Rival {
  n: string;
  t: string;
}

interface Table {
  id: string;
  diff: string;
  roman: string;
  title: string;
  blurb: string;
  rivals: Rival[];
}

const TABLES: Table[] = [
  {
    id: 'easy', diff: 'Fácil', roman: 'I',
    title: 'La mesa de los Novatos',
    blurb: 'Para ir cómodo. Los rivales cometen errores predecibles.',
    rivals: [
      { n: 'Mia', t: 'Juega demasiadas manos, se retira bajo presión.' },
      { n: 'Dan', t: 'Farolea al azar, sin lógica.' },
      { n: 'Sam', t: 'Imita a los demás, sin estrategia.' },
    ],
  },
  {
    id: 'medium', diff: 'Media', roman: 'II',
    title: 'La mesa de los Regulares',
    blurb: 'Juego sólido. Hay que medir cada apuesta.',
    rivals: [
      { n: 'Leo', t: 'Agresivo-prudente, juega por el libro.' },
      { n: 'Nora', t: 'Lee patrones de apuesta, muy paciente.' },
      { n: 'Kai', t: 'Semi-farolea, difícil de leer.' },
    ],
  },
  {
    id: 'hard', diff: 'Difícil', roman: 'III',
    title: 'La mesa de los Tiburones',
    blurb: 'Sin perdón. Calculan probabilidades en cada calle.',
    rivals: [
      { n: 'Víctor', t: 'Frío, calcula probabilidades constantemente.' },
      { n: 'Elena', t: 'Tiende trampas con manos fuertes, casi nunca se retira.' },
      { n: 'Rex', t: 'Hiperagresivo, sube en cada ronda.' },
    ],
  },
];

function TableCard({ table, selected, dense = false, onClick }: { table: Table; selected: boolean; dense?: boolean; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1, borderRadius: 14, padding: dense ? '20px 18px' : '26px 24px',
        background: selected ? 'var(--bone)' : 'transparent',
        color: selected ? 'var(--ink)' : 'var(--bone)',
        border: selected ? '1.5px solid var(--bone)' : '1.5px solid rgba(205,197,183,0.22)',
        boxShadow: selected ? '0 0 0 8px rgba(205,197,183,0.18)' : 'none',
        display: 'flex', flexDirection: 'column', gap: dense ? 14 : 18,
        cursor: 'pointer',
        transition: 'background 240ms, border-color 240ms, box-shadow 240ms',
      }}
    >
      <div className="row between" style={{ alignItems: 'flex-start' }}>
        <div className="col gap-1">
          <div className="jp-eyebrow" style={{ opacity: selected ? 0.7 : 0.55 }}>Dificultad · {table.roman}</div>
          <div className="jp-h3" style={{ fontSize: dense ? 18 : 22 }}>{table.diff}</div>
        </div>
        <div style={{ width: 30, height: 30, borderRadius: '50%', border: '1.5px solid currentColor', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {selected && <span style={{ width: 12, height: 12, borderRadius: '50%', background: 'currentColor' }} />}
        </div>
      </div>
      <div className="col gap-1">
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: dense ? 17 : 19, lineHeight: 1.1 }}>
          "{table.title}"
        </div>
        <div className="jp-caption" style={{ opacity: 0.75, maxWidth: 280 }}>{table.blurb}</div>
      </div>
      <div className="col gap-3" style={{ marginTop: 4 }}>
        {table.rivals.map(r => (
          <div key={r.n} className="row gap-3" style={{ alignItems: 'center' }}>
            <Avatar name={r.n} size={dense ? 40 : 48} />
            <div className="col" style={{ gap: 2, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{r.n}</div>
              <div className="jp-caption" style={{ opacity: 0.75, fontSize: 11, lineHeight: 1.35 }}>{r.t}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const Local: React.FC = () => {
  const [selectedId, setSelectedId] = useState('medium');
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const selected = TABLES.find(t => t.id === selectedId)!;

  if (isMobile) {
    return (
      <div className="jp-screen">
        <div className="jp-bar">
          <Button size="sm" variant="ghost" style={{ paddingLeft: 0, border: 'none' }} onClick={() => navigate('/')}>← Atrás</Button>
          <div className="brand" style={{ fontSize: 13 }}>Local</div>
          <span style={{ width: 60 }} />
        </div>
        <div className="col" style={{ flex: 1, padding: '22px 18px 22px', justifyContent: 'space-between' }}>
          <div className="col gap-4">
            <div className="col gap-2">
              <div className="jp-eyebrow">Elige una mesa</div>
              <div className="jp-h2" style={{ fontSize: 30, lineHeight: 1.02 }}>Tres niveles.<br /><em>Tres mesas.</em></div>
            </div>
            <div className="row gap-2">
              {TABLES.map(t => (
                <div key={t.id} onClick={() => setSelectedId(t.id)} style={{
                  flex: 1, padding: '10px 6px', textAlign: 'center', borderRadius: 999,
                  background: selectedId === t.id ? 'var(--bone)' : 'transparent',
                  color: selectedId === t.id ? 'var(--ink)' : 'var(--bone)',
                  border: selectedId === t.id ? 'none' : '1px solid rgba(205,197,183,0.3)',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>{t.diff}</div>
              ))}
            </div>
            <TableCard table={selected} selected dense onClick={() => {}} />
          </div>
          <div className="col gap-2">
            <Button variant="primary" block glow onClick={() => navigate(`/game/local-${selectedId}`)}>Sentarse</Button>
            <div className="jp-caption" style={{ textAlign: 'center', opacity: 0.55 }}>
              Te enfrentarás a {selected.rivals.map(r => r.n).join(', ')}.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="jp-screen">
      <TopBar
        right={
          <div className="row gap-3" style={{ alignItems: 'center' }}>
            <div className="jp-caption" style={{ opacity: 0.5 }}>Modo · Local</div>
            <Avatar name="Tú" size={32} />
          </div>
        }
      />
      <div className="col" style={{ flex: 1, padding: '48px 70px 50px', justifyContent: 'space-between' }}>
        <div className="col gap-3" style={{ maxWidth: 780 }}>
          <div className="jp-eyebrow">Elige tu mesa</div>
          <div className="jp-h1" style={{ fontSize: 64, lineHeight: 0.96 }}>Tres niveles. <em>Tres mesas.</em></div>
          <div className="jp-body" style={{ opacity: 0.7, maxWidth: 520, marginTop: 6 }}>
            Cada mesa tiene tres rivales con personalidades distintas. Elegir la dificultad es elegir contra quién juegas.
          </div>
        </div>
        <div className="row gap-4" style={{ alignItems: 'stretch' }}>
          {TABLES.map(t => (
            <TableCard key={t.id} table={t} selected={t.id === selectedId} onClick={() => setSelectedId(t.id)} />
          ))}
        </div>
        <div className="row between" style={{ alignItems: 'center' }}>
          <Button variant="ghost" style={{ paddingLeft: 0 }} onClick={() => navigate('/')}>← Volver al menú</Button>
          <div className="row gap-4" style={{ alignItems: 'center' }}>
            <div className="jp-caption" style={{ opacity: 0.6 }}>
              {selected.diff} · {selected.rivals.map(r => r.n).join(' · ')}
            </div>
            <Button variant="primary" glow onClick={() => navigate(`/game/local-${selectedId}`)}>Sentarse</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Local;
