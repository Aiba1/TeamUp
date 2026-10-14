import { Link } from 'react-router-dom';
import { useStore } from '../store.jsx';

export default function Tournaments() {
  const { state, dispatch } = useStore();

  return (
    <>
      <header className="page-head">
        <h1>Tournaments</h1>
        <Link to="/tournaments/new" className="btn">
          + New tournament
        </Link>
      </header>

      {state.tournaments.length === 0 ? (
        <div className="card empty">
          <p>You haven't created any tournaments yet.</p>
          <Link to="/tournaments/new" className="btn">
            Start the wizard
          </Link>
        </div>
      ) : (
        <div className="cards">
          {state.tournaments.map((t) => (
            <div key={t.id} className="card tcard">
              <div className="tcard-top">
                <span className="tag">{t.game}</span>
                <span className="tag alt">{t.format === 'single' ? 'Single elimination' : 'Round robin'}</span>
              </div>
              <h3>{t.name}</h3>
              <p className="muted">
                {t.teams.length} teams · starts {t.startDate || 'TBD'}
              </p>
              <div className="row">
                <Link to={`/tournaments/${t.id}`} className="btn sm">
                  Open bracket
                </Link>
                <button className="btn ghost sm" onClick={() => dispatch({ type: 'tournament/delete', id: t.id })}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
