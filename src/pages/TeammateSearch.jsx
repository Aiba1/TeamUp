import { useMemo, useState } from 'react';
import { ALL_LEVELS, PLAYERS, ROLES, levelsFor } from '../api.js';
import ActivityOptions from '../components/ActivityOptions.jsx';

export default function TeammateSearch() {
  const [q, setQ] = useState('');
  const [game, setGame] = useState('');
  const [role, setRole] = useState('');
  const [rank, setRank] = useState('');
  const [onlyLfg, setOnlyLfg] = useState(true);
  const [invited, setInvited] = useState([]);

  const roles = game ? ROLES[game] : [...new Set(Object.values(ROLES).flat())];
  const levels = game ? levelsFor(game) : ALL_LEVELS;

  const results = useMemo(
    () =>
      PLAYERS.filter(
        (p) =>
          p.name.toLowerCase().includes(q.toLowerCase()) &&
          (!game || p.game === game) &&
          (!role || p.role === role) &&
          (!rank || p.rank === rank) &&
          (!onlyLfg || p.lookingForTeam)
      ),
    [q, game, role, rank, onlyLfg]
  );

  return (
    <>
      <header className="page-head">
        <h1>Find teammates</h1>
      </header>

      <div className="card filters">
        <input placeholder="Search by name…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select
          value={game}
          onChange={(e) => {
            setGame(e.target.value);
            setRole('');
            setRank('');
          }}
        >
          <option value="">All activities</option>
          <ActivityOptions />
        </select>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Any role</option>
          {roles.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <select value={rank} onChange={(e) => setRank(e.target.value)}>
          <option value="">Any level</option>
          {levels.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
        <label className="check">
          <input type="checkbox" checked={onlyLfg} onChange={(e) => setOnlyLfg(e.target.checked)} />
          Looking for team
        </label>
      </div>

      <p className="muted">{results.length} players found</p>

      <div className="cards">
        {results.map((p) => (
          <div key={p.id} className="card player">
            <div className="avatar lg">{p.name[0]}</div>
            <div className="player-info">
              <strong>{p.name}</strong>
              <span className="muted">
                {p.game} · {p.role}
              </span>
              <div className="row">
                <span className="tag">{p.rank}</span>
                <span className="tag alt">{p.lang}</span>
                {p.lookingForTeam && <span className="tag ok">LFT</span>}
              </div>
            </div>
            <button
              className={`btn sm ${invited.includes(p.id) ? 'ghost' : ''}`}
              disabled={invited.includes(p.id)}
              onClick={() => setInvited([...invited, p.id])}
            >
              {invited.includes(p.id) ? 'Invited' : 'Invite'}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
