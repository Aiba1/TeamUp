import { Link, useParams } from 'react-router-dom';
import { setWinner, standings } from '../bracket.js';
import { useStore } from '../store.jsx';

function Match({ m, onPick }) {
  const slot = (team) => (
    <button
      className={`slot ${m.winner && m.winner === team ? 'win' : ''} ${m.winner && m.winner !== team ? 'lose' : ''}`}
      disabled={!team || !m.a || !m.b}
      onClick={() => onPick(team)}
    >
      {team ?? <span className="muted">TBD / bye</span>}
    </button>
  );
  return (
    <div className="match">
      {slot(m.a)}
      {slot(m.b)}
    </div>
  );
}

function roundName(r, total) {
  const left = total - r;
  if (left === 1) return 'Final';
  if (left === 2) return 'Semifinals';
  if (left === 3) return 'Quarterfinals';
  return `Round ${r + 1}`;
}

export default function TournamentDetail() {
  const { id } = useParams();
  const { state, dispatch } = useStore();
  const t = state.tournaments.find((x) => x.id === id);

  if (!t) {
    return (
      <div className="card empty">
        <p>Tournament not found.</p>
        <Link to="/tournaments">Back to list</Link>
      </div>
    );
  }

  const update = (rounds) => dispatch({ type: 'tournament/update', id: t.id, patch: { rounds } });

  const pickSingle = (r, i, team) => update(setWinner(t.rounds, r, i, team));

  const pickRR = (r, i, team) =>
    update(
      t.rounds.map((round, ri) =>
        round.map((m, mi) => (ri === r && mi === i ? { ...m, winner: m.winner === team ? null : team } : m))
      )
    );

  const champion = t.format === 'single' ? t.rounds.at(-1)[0].winner : null;

  return (
    <>
      <header className="page-head">
        <div>
          <Link to="/tournaments" className="muted">
            ← Tournaments
          </Link>
          <h1>{t.name}</h1>
          <p className="muted">
            {t.game} · {t.format === 'single' ? 'Single elimination' : 'Round robin'} · {t.teams.length} teams · starts{' '}
            {t.startDate || 'TBD'}
          </p>
        </div>
        {champion && <div className="champion">🏆 {champion}</div>}
      </header>

      <p className="muted hint">Click a team to mark it as the match winner. Click again to undo.</p>

      {t.format === 'single' ? (
        <div className="bracket">
          {t.rounds.map((round, r) => (
            <div key={r} className="round">
              <h4>{roundName(r, t.rounds.length)}</h4>
              <div className="round-matches">
                {round.map((m, i) => (
                  <Match key={i} m={m} onPick={(team) => pickSingle(r, i, team)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid-2">
          <section className="card">
            <h3>Schedule</h3>
            {t.rounds.map((round, r) => (
              <div key={r} className="rr-round">
                <h4>Round {r + 1}</h4>
                {round.map((m, i) => (
                  <Match key={i} m={m} onPick={(team) => pickRR(r, i, team)} />
                ))}
              </div>
            ))}
          </section>
          <section className="card">
            <h3>Standings</h3>
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Team</th>
                  <th>P</th>
                  <th>W</th>
                  <th>L</th>
                </tr>
              </thead>
              <tbody>
                {standings(t.teams, t.rounds).map((s, i) => (
                  <tr key={s.team}>
                    <td>{i + 1}</td>
                    <td>{s.team}</td>
                    <td>{s.played}</td>
                    <td>{s.wins}</td>
                    <td>{s.losses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </>
  );
}
