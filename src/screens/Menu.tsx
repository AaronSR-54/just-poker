import React from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Avatar from '../components/Avatar';
import RankBadge from '../components/RankBadge';
import Button from '../components/Button';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useUserStore } from '../store/userStore';

const Menu: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const user = useUserStore(s => s.user);
  const stats = useUserStore(s => s.stats);

  if (isMobile) {
    return (
      <div className="jp-screen">
        <div className="jp-bar">
          <div className="brand">Just <em>Poker</em></div>
          <div className="row gap-3" style={{ alignItems: 'center' }}>
            <Avatar name={user.username} size={32} />
            <RankBadge points={user.points} compact />
          </div>
        </div>
        <div className="col" style={{ flex: 1, padding: '32px 22px 28px', justifyContent: 'space-between' }}>
          <div className="col gap-3" style={{ marginTop: 10 }}>
            <div className="jp-eyebrow">Bienvenido{user.username !== 'Tú' ? `, ${user.username}` : ''}</div>
            <div className="jp-h1" style={{ fontSize: 48, lineHeight: 0.95 }}>
              ¿Cómo<br />quieres<br /><em>jugar?</em>
            </div>
          </div>
          <div className="col gap-3">
            <button
              className="jp-card"
              style={{ background: 'transparent', border: '1.5px solid var(--bone)', color: 'var(--bone)', textAlign: 'left', padding: '22px 20px', borderRadius: 14, cursor: 'pointer' }}
              onClick={() => navigate('/local')}
            >
              <div className="jp-eyebrow" style={{ opacity: 0.6, marginBottom: 8 }}>01</div>
              <div className="jp-h3" style={{ marginBottom: 6 }}>Jugar en local</div>
              <div className="jp-caption" style={{ opacity: 0.7 }}>Contra una mesa de IA.</div>
            </button>
            <button
              className="jp-card"
              style={{ background: 'var(--bone)', color: 'var(--ink)', border: '1.5px solid var(--bone)', textAlign: 'left', padding: '22px 20px', borderRadius: 14, cursor: 'pointer' }}
              onClick={() => navigate('/online')}
            >
              <div className="jp-eyebrow" style={{ opacity: 0.6, marginBottom: 8 }}>02</div>
              <div className="jp-h3" style={{ marginBottom: 6 }}>Jugar online</div>
              <div className="jp-caption" style={{ opacity: 0.65 }}>Hasta 4 jugadores. Cuenta para el ranking.</div>
            </button>
            <Button variant="ghost" style={{ justifyContent: 'flex-start', padding: '14px 4px', color: 'var(--bone)', border: 'none' }} onClick={() => navigate('/profile')}>
              <span style={{ opacity: 0.7 }}>Mi perfil →</span>
            </Button>
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
            <Avatar name={user.username} size={40} />
            <div className="col" style={{ gap: 2 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{user.username}</div>
              <RankBadge points={user.points} />
            </div>
          </div>
        }
      />
      <div className="col" style={{ flex: 1, padding: '60px 80px 70px', justifyContent: 'space-between' }}>
        <div className="col gap-3" style={{ maxWidth: 780 }}>
          <div className="jp-eyebrow">Bienvenido{user.username !== 'Tú' ? ` de vuelta, ${user.username}` : ' de vuelta'}</div>
          <div className="jp-h1" style={{ fontSize: 112, lineHeight: 0.94 }}>
            ¿Cómo quieres<br /><em>jugar hoy?</em>
          </div>
        </div>
        <div className="row gap-5" style={{ alignItems: 'stretch' }}>
          <button
            style={{
              flex: 1, minHeight: 240,
              background: 'transparent', color: 'var(--bone)',
              border: '1.5px solid var(--bone)', borderRadius: 14,
              padding: '32px 36px', textAlign: 'left',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/local')}
          >
            <div className="col gap-2">
              <div className="jp-eyebrow" style={{ opacity: 0.55 }}>01 / Modo</div>
              <div className="jp-h1" style={{ fontSize: 64, lineHeight: 0.96 }}>Jugar en <em>local</em></div>
            </div>
            <div className="row between" style={{ alignItems: 'flex-end' }}>
              <div className="jp-body" style={{ opacity: 0.75, maxWidth: 280 }}>
                Una mesa de IA con dificultad elegida. Para practicar o desconectar.
              </div>
              <span style={{ fontSize: 32, fontFamily: 'var(--font-display)', fontWeight: 700 }}>→</span>
            </div>
          </button>
          <button
            style={{
              flex: 1, minHeight: 240,
              background: 'var(--bone)', color: 'var(--ink)',
              border: '1.5px solid var(--bone)', borderRadius: 14,
              padding: '32px 36px', textAlign: 'left',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/online')}
          >
            <div className="col gap-2">
              <div className="jp-eyebrow" style={{ opacity: 0.55 }}>02 / Modo</div>
              <div className="jp-h1" style={{ fontSize: 64, lineHeight: 0.96 }}>Jugar <em>online</em></div>
            </div>
            <div className="row between" style={{ alignItems: 'flex-end' }}>
              <div className="jp-body" style={{ opacity: 0.75, maxWidth: 300, color: 'var(--ink)' }}>
                Hasta 4 jugadores. Las partidas públicas suman al ranking.
              </div>
              <span style={{ fontSize: 32, fontFamily: 'var(--font-display)', fontWeight: 700 }}>→</span>
            </div>
          </button>
        </div>
        <div className="row between" style={{ alignItems: 'center' }}>
          <Button variant="ghost" style={{ paddingLeft: 0 }} onClick={() => navigate('/profile')}>Mi perfil →</Button>
          <div className="jp-caption" style={{ opacity: 0.5 }}>
            {stats.handsPlayed > 0
              ? `${stats.handsPlayed} manos jugadas · ${Math.round((stats.handsWon / stats.handsPlayed) * 100)}% ganadas`
              : 'Gratis para siempre · Sin dinero real · Sin pagos'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Menu;
