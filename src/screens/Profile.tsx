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
    <div className="h-1.5 w-full overflow-hidden rounded-pill bg-bone/12">
      <div
        className="h-full rounded-pill bg-bone transition-[width] duration-[480ms] ease-out-brand"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};

const HistoryRow: React.FC<{ rec: GameRecord }> = ({ rec }) => {
  const { place, pts, playedAt, rivals, mode } = rec;
  const placeLabel = place === 1 ? '1.º' : place === 2 ? '2.º' : place === 3 ? '3.º' : '4.º';
  return (
    <div
      className={`flex items-center gap-4 rounded-[10px] px-[1.125rem] py-[0.875rem] ${
        place === 1 ? 'bg-bone text-ink' : 'border border-bone/10 bg-bone/[0.04] text-bone'
      }`}
    >
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-full font-display font-bold text-fs-300 ${
          place === 1 ? 'bg-ink text-bone' : 'bg-bone/12 text-bone'
        }`}
      >
        {placeLabel}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="font-body text-fs-100 tracking-[0.04em] opacity-70">{rivals.join(' · ')}</div>
        <div className="font-body tracking-[0.04em] opacity-70 text-[10px]">
          {mode === 'local' ? 'Local' : 'Online'} · {timeAgo(playedAt)}
        </div>
      </div>

      <div className={`font-display font-bold text-fs-300 ${place === 1 ? 'opacity-90' : 'opacity-70'}`}>
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
  <div className="flex flex-col items-center gap-1">
    <div
      className={`flex size-11 items-center justify-center rounded-full transition-all duration-300 ${
        reached ? 'border-2 border-bone bg-bone/12' : 'border-2 border-bone/[0.18] bg-transparent'
      }`}
    >
      <span className={`font-display font-bold text-[18px] ${reached ? 'opacity-100' : 'opacity-30'}`}>
        {rank.roman}
      </span>
    </div>
    <div className={`text-center font-body text-[9px] tracking-[0.04em] ${reached ? 'opacity-80' : 'opacity-40'}`}>
      {rank.name}
    </div>
    <div className={`text-center font-body text-[9px] tracking-[0.04em] ${reached ? 'opacity-60' : 'opacity-40'}`}>
      {reached ? (when ?? '—') : `${rank.min} pts`}
    </div>
  </div>
);

const StatCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex min-w-[100px] flex-1 flex-col gap-1 rounded-[10px] border border-bone/[0.18] px-4 py-[0.875rem]">
    <div className="font-display font-bold text-[22px]">{value}</div>
    <div className="font-body tracking-[0.04em] opacity-70 text-[10px]">{label}</div>
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
    <div className="flex w-full flex-col gap-3">
      <input
        className="block w-full rounded-md border-[1.5px] border-current bg-transparent px-4 py-[0.875rem] font-body text-fs-300 text-inherit outline-none focus:shadow-[0_0_0_0.1875rem_rgba(205,197,183,0.18)]"
        value={nameDraft}
        onChange={e => setNameDraft(e.target.value)}
        placeholder="Tu nombre"
        maxLength={16}
        onKeyDown={e => { if (e.key === 'Enter') saveProfile(); }}
      />
      <div className="font-body tracking-[0.04em] text-[10px] opacity-60">
        El avatar se genera con las iniciales de tu nombre.
      </div>
    </div>
  );

  const statsRow = (
    <div className="flex flex-wrap gap-2">
      <StatCard label="Manos jugadas" value={String(stats.handsPlayed)} />
      <StatCard label="Manos ganadas" value={`${winRate}%`} />
      <StatCard label="Partidas" value={String(stats.localGames + stats.onlineGames)} />
      <StatCard label="Mesas ganadas" value={String(stats.localWins + stats.onlineWins)} />
    </div>
  );

  const milestonesSection = (
    <div className="mt-1 flex flex-col gap-2">
      <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">Rangos</div>
      <div className="flex flex-wrap justify-between gap-2">
        {milestones.map(m => (
          <MilestoneDot key={m.r.roman} rank={m.r} reached={m.reached} when={m.when} />
        ))}
      </div>
    </div>
  );

  const historySection = (
    <div className="mt-1 flex flex-col gap-3">
      <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">Historial de partidas</div>
      <div className="flex flex-col gap-2">
        {history.length === 0 ? (
          <div className="font-body text-fs-100 tracking-[0.04em] opacity-70 py-3">
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
      <div className="relative flex h-screen w-full flex-col overflow-hidden bg-ink font-body text-fs-300 leading-[1.25] text-bone">
        <div className="flex items-center justify-between border-b border-bone/[0.18] px-[1.125rem] py-[0.875rem]">
          <div className="flex cursor-pointer items-center gap-2" onClick={() => navigate('/')}>
            <span className="font-display font-bold text-fs-300">←</span>
            <div className="font-display font-bold text-fs-300 uppercase tracking-[0.08em]">Menú</div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-[1.125rem] py-6">
          <div className="flex flex-col items-center gap-3">
            <Avatar name={user.username} size={80} />
            <div className="font-display font-bold leading-none text-[20px]">{user.username}</div>
            <RankBlock rank={currentRank} />
            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold text-[28px]">{points}</span>
              <span className="font-body tracking-[0.04em] opacity-70 text-fs-100">puntos</span>
            </div>
            <div className="w-full">
              <ProgressBar value={progressInRank} max={100} />
            </div>
            <div className="font-body tracking-[0.04em] opacity-70 text-[10px]">
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
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-ink font-body text-fs-300 leading-[1.25] text-bone">
      <TopBar
        right={
          <div className="cursor-pointer" onClick={() => navigate('/')}>
            <span className="font-display font-bold text-fs-300 tracking-[0.08em]">← Menú</span>
          </div>
        }
      />

      <div
        className="flex flex-1 items-start gap-12 overflow-y-auto px-[3.75rem] py-10"
      >
        {/* Columna izquierda */}
        <div className="flex flex-[0_0_20rem] flex-col gap-5">
          <div className="flex flex-col items-start gap-4">
            <Avatar name={user.username} size={120} />
            <div className="font-display font-bold leading-none text-[32px]">{user.username}</div>
            <RankBlock rank={currentRank} />
            <div className="flex items-baseline gap-2">
              <span className="font-display font-bold text-[42px]">{points}</span>
              <span className="font-body tracking-[0.04em] opacity-70 text-fs-300">puntos</span>
            </div>
            <div className="w-full">
              <ProgressBar value={progressInRank} max={100} />
            </div>
            <div className="font-body text-fs-100 tracking-[0.04em] opacity-70">
              {nextRank ? `${nextRank.min - points} pts para ${nextRank.name}` : 'Has alcanzado el rango máximo'}
            </div>
          </div>

          <Button size="sm" variant="outline" onClick={() => (editing ? saveProfile() : setEditing(true))}>
            {editing ? 'Guardar perfil' : 'Editar perfil'}
          </Button>
          {editSection}
        </div>

        {/* Columna derecha */}
        <div className="flex max-w-[560px] flex-1 flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="font-display font-bold text-fs-100 tracking-[0.14em] uppercase opacity-65">Estadísticas</div>
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
