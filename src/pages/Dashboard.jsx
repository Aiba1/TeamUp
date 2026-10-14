import { Link } from 'react-router-dom';
import { PLAYERS } from '../api.js';
import { useStore } from '../store.jsx';

export default function Dashboard() {
  const { state } = useStore();
  const { tournaments, user } = state;
  const lfg = PLAYERS.filter((p) => p.lookingForTeam && p.game === user.game).slice(0, 4);

  return (
    <>
      <header className="page-head">
        <div>
          <h1>Hi, {user.username} 👋</h1>
          <p className="muted">Here's what's happening in TeamUp.</p>
        </div>
        <Link to="/tournaments/new" className="btn">
          + New tournament
        </Link>
      </header>

      <div className="stats">
        <div className="card stat">
          <span className="muted">Tournaments</span>
          <strong>{tournaments.length}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Players looking for team</span>
          <strong>{PLAYERS.filter((p) => p.lookingForTeam).length}</strong>
        </div>
        <div className="card stat">
          <span className="muted">Your main activity</span>
          <strong>{user.game}</strong>
        </div>
      </div>

      <div className="grid-2">
        <section className="card">
          <h3>Recent tournaments</h3>
          {tournaments.length === 0 ? (
            <p className="muted">
              No tournaments yet. <Link to="/tournaments/new">Create one</Link>
            </p>
          ) : (
            <ul className="list">
              {tournaments.slice(0, 5).map((t) => (
                <li key={t.id}>
                  <Link to={`/tournaments/${t.id}`}>{t.name}</Link>
                  <span className="tag">{t.format === 'single' ? 'Single elim' : 'Round robin'}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card">
          <h3>Looking for team · {user.game}</h3>
          <ul className="list">
            {lfg.map((p) => (
              <li key={p.id}>
                <span>
                  {p.name} <span className="muted">· {p.role}</span>
                </span>
                <span className="tag">{p.rank}</span>
              </li>
            ))}
          </ul>
          <Link to="/teammates" className="muted">
            See all →
          </Link>
        </section>
      </div>
    </>
  );
}
