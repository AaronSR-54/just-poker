import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Avatar from '../components/Avatar';
import RankBlock from '../components/RankBlock';
import Button from '../components/Button';
import { RANKS, rankFor } from '../types';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useUserStore, type GameRecord } from '../store/userStore';

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'ahora mismo';
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return h === 1 ? 'hace 1 hora' : `hace ${h} horas`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'ayer' : `hace ${d} días`;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// ---- Sub-componentes ----

const ProgressBar: React.FC<{ value: number; max: number }> = ({ value, max }) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      style={{
        width: '100%',
        height: 6,
        borderRadius: 999,
        background: 'rgba(205,197,183,0.12)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 999,
          background: 'var(--bone)',
          transition: 'width 480ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      />
    </div>
  );
};

const HistoryRow: React.FC<{ rec: GameRecord }> = ({ rec }) => {
  const { place, pts, playedAt, rivals, mode } = rec;
  const placeLabel = place === 1 ? '1.º' : place === 2 ? '2.º' : place === 3 ? '3.º' : '4.º';
  return (
    <div
      className="row gap-4"
      style={{
        padding: '14px 18px',
        borderRadius: 10,
        background: place === 1 ? 'var(--bone)' : 'rgba(205,197,183,0.04)',
        color: place === 1 ? 'var(--ink)' : 'var(--bone)',
        alignItems: 'center',
        border: place === 1 ? 'none' : '1px solid rgba(205,197,183,0.10)',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: place === 1 ? 'var(--ink)' : 'rgba(205,197,183,0.12)',
          color: 'var(--bone)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {placeLabel}
      </div>

      <div className="col gap-0" style={{ flex: 1, minWidth: 0 }}>
        <div className="jp-caption" style={{ opacity: place === 1 ? 0.7 : 0.6 }}>
          {rivals.join(' · ')}
        </div>
        <div className="jp-caption" style={{ opacity: place === 1 ? 0.5 : 0.4, fontSize: 10 }}>
          {mode === 'local' ? 'Local' : 'Online'} · {timeAgo(playedAt)}
        </div>
      </div>

      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 14,
          opacity: place === 1 ? 0.9 : 0.7,
        }}
      >
        {pts > 0 ? `+${pts} pts` : '0 pts'}
      </div>
    </div>
  );
};

const MilestoneDot: React.FC<{
  rank: { roman: string; name: string; min: number };
  reached: boolean;
  when: string | null;
}> = ({ rank, reached, when }) => (
  <div className="col gap-1" style={{ alignItems: 'center' }}>
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: reached ? '2px solid var(--bone)' : '2px solid rgba(205,197,183,0.18)',
        background: reached ? 'rgba(205,197,183,0.12)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 300ms',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: 18,
          opacity: reached ? 1 : 0.3,
        }}
      >
        {rank.roman}
      </span>
    </div>
    <div className="jp-caption" style={{ fontSize: 9, textAlign: 'center', opacity: reached ? 0.8 : 0.4 }}>
      {rank.name}
    </div>
    <div className="jp-caption" style={{ fontSize: 9, textAlign: 'center', opacity: reached ? 0.6 : 0.4 }}>
      {reached ? (when ?? '—') : `${rank.min} pts`}
    </div>
  </div>
);

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div
    className="col gap-1"
    style={{
      padding: '14px 16px',
      borderRadius: 10,
      border: 'var(--jp-stroke-hair)',
      flex: 1,
      minWidth: 100,
    }}
  >
    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>{value}</div>
    <div className="jp-caption" style={{ fontSize: 10 }}>{label}</div>
  </div>
);
// ---- Componente principal ----

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const user = useUserStore(s => s.user);
  const history = useUserStore(s => s.history);
  const stats = useUserStore(s => s.stats);
  const milestoneDates = useUserStore(s => s.milestoneDates);
  const updateProfile = useUserStore(s => s.updateProfile);

  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(user.username);

  const points = user.points;
  const currentRank = rankFor(points);
  const nextRank = RANKS.find(r => r.min > points) ?? null;
  const progressInRank = nextRank
    ? ((points - currentRank.min) / (nextRank.min - currentRank.min)) * 100
    : 100;

  const milestones = RANKS.map(r => ({
    r,
    reached: points >= r.min,
    when: milestoneDates[r.roman] ? formatDate(milestoneDates[r.roman]) : null,
  }));

  const winRate = stats.handsPlayed > 0
    ? Math.round((stats.handsWon / stats.handsPlayed) * 100)
    : 0;

  const saveProfile = () => {
    const name = nameDraft.trim().slice(0, 16) || 'Tú';
    updateProfile(name, name.slice(0, 2).toUpperCase());
    setEditing(false);
  };

  const editSection = editing && (
    <div className="col gap-3" style={{ width: '100%' }}>
      <input
        className="jp-input"
        value={nameDraft}
        onChange={e => setNameDraft(e.target.value)}
        placeholder="Tu nombre"
        maxLength={16}
        style={{ fontSize: 14 }}
        onKeyDown={e => { if (e.key === 'Enter') saveProfile(); }}
      />
      <div className="jp-caption" style={{ fontSize: 10, opacity: 0.6 }}>
        El avatar se genera con las iniciales de tu nombre.
      </div>
    </div>
  );

  const statsRow = (
    <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
      <StatCard label="Manos jugadas" value={String(stats.handsPlayed)} />
      <StatCard label="Manos ganadas" value={`${winRate}%`} />
      <StatCard label="Partidas" value={String(stats.localGames + stats.onlineGames)} />
      <StatCard label="Mesas ganadas" value={String(stats.localWins + stats.onlineWins)} />
    </div>
  );

  const milestonesSection = (
    <div className="col gap-2" style={{ marginTop: 4 }}>
      <div className="jp-eyebrow">Rangos</div>
      <div className="row gap-2" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        {milestones.map(m => (
          <MilestoneDot key={m.r.roman} rank={m.r} reached={m.reached} when={m.when} />
        ))}
      </div>
    </div>
  );

  const historySection = (
    <div className="col gap-3" style={{ marginTop: 4 }}>
      <div className="jp-eyebrow">Historial de partidas</div>
      <div className="col gap-2">
        {history.length === 0 ? (
          <div className="jp-caption" style={{ opacity: 0.6, padding: '12px 0' }}>
            Aún no has jugado ninguna partida. Siéntate a una mesa para empezar.
          </div>
        ) : (
          history.map(h => <HistoryRow key={h.id} rec={h} />)
        )}
      </div>
    </div>
  );

  // ---- MÓVIL ----

  if (isMobile) {
    return (
      <div className="jp-screen">
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(205,197,183,0.18)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="row gap-2" style={{ alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14 }}>←</span>
            <div className="brand" style={{ fontSize: 14 }}>Menú</div>
          </div>
        </div>

        <div className="col gap-4" style={{ flex: 1, padding: '24px 18px', overflowY: 'auto' }}>
          <div className="col gap-3" style={{ alignItems: 'center' }}>
            <Avatar name={user.username} size={80} />
            <div className="jp-h3" style={{ fontSize: 20 }}>{user.username}</div>
            <RankBlock rank={currentRank} />
            <div className="row gap-2" style={{ alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28 }}>{points}</span>
              <span className="jp-caption" style={{ fontSize: 11 }}>puntos</span>
            </div>
            <div style={{ width: '100%' }}>
              <ProgressBar value={progressInRank} max={100} />
            </div>
            <div className="jp-caption" style={{ fontSize: 10 }}>
              {nextRank ? `${nextRank.min - points} pts para ${nextRank.name}` : 'Has alcanzado el rango máximo'}
            </div>
            <Button size="sm" variant="outline" onClick={() => (editing ? saveProfile() : setEditing(true))}>
              {editing ? 'Guardar' : 'Editar perfil'}
            </Button>
            {editSection}
          </div>

          {statsRow}
          {milestonesSection}
          {historySection}
        </div>
      </div>
    );
  }

  // ---- DESKTOP ----

  return (
    <div className="jp-screen">
      <TopBar
        right={
          <div style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, letterSpacing: '0.08em' }}>← Menú</span>
          </div>
        }
      />

      <div
        className="row gap-8"
        style={{
          flex: 1,
          padding: '40px 60px',
          alignItems: 'flex-start',
          overflowY: 'auto',
        }}
      >
        {/* Columna izquierda */}
        <div className="col gap-5" style={{ flex: '0 0 320px' }}>
          <div className="col gap-4" style={{ alignItems: 'flex-start' }}>
            <Avatar name={user.username} size={120} />
            <div className="jp-h2" style={{ fontSize: 32 }}>{user.username}</div>
            <RankBlock rank={currentRank} />
            <div className="row gap-2" style={{ alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 42 }}>{points}</span>
              <span className="jp-caption" style={{ fontSize: 13 }}>puntos</span>
            </div>
            <div style={{ width: '100%' }}>
              <ProgressBar value={progressInRank} max={100} />
            </div>
            <div className="jp-caption">
              {nextRank ? `${nextRank.min - points} pts para ${nextRank.name}` : 'Has alcanzado el rango máximo'}
            </div>
          </div>

          <Button size="sm" variant="outline" onClick={() => (editing ? saveProfile() : setEditing(true))}>
            {editing ? 'Guardar perfil' : 'Editar perfil'}
          </Button>
          {editSection}
        </div>

        {/* Columna derecha */}
        <div className="col gap-6" style={{ flex: 1, maxWidth: 560 }}>
          <div className="col gap-3">
            <div className="jp-eyebrow">Estadísticas</div>
            {statsRow}
          </div>
          {milestonesSection}
          {historySection}
        </div>
      </div>
    </div>
  );
};

export default Profile;
