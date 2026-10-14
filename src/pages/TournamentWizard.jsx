import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAMES } from '../api.js';
import ActivityOptions from '../components/ActivityOptions.jsx';
import { roundRobin, singleElimination } from '../bracket.js';
import { useStore } from '../store.jsx';

const STEPS = ['Basics', 'Format', 'Teams', 'Review'];

const FORMATS = [
  {
    id: 'single',
    title: 'Single elimination',
    desc: 'Lose once and you are out. Fast, good for many teams. Byes added automatically.',
  },
  {
    id: 'roundrobin',
    title: 'Round robin',
    desc: 'Everyone plays everyone. Fairer, but the number of matches grows quickly.',
  },
];

export default function TournamentWizard() {
  const { dispatch } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: '',
    game: GAMES[0],
    startDate: '',
    format: 'single',
    teams: ['Team Alpha', 'Team Bravo', 'Team Charlie', 'Team Delta'],
  });
  const [newTeam, setNewTeam] = useState('');
  const [error, setError] = useState('');

  const set = (key) => (e) => setData({ ...data, [key]: e.target.value });

  const validate = () => {
    if (step === 0 && !data.name.trim()) return 'Tournament name is required';
    if (step === 2 && data.teams.length < 2) return 'Add at least 2 teams';
    return '';
  };

  const next = () => {
    const err = validate();
    setError(err);
    if (!err) setStep(step + 1);
  };

  const addTeam = (e) => {
    e.preventDefault();
    const name = newTeam.trim();
    if (!name) return;
    if (data.teams.includes(name)) return setError('Team names must be unique');
    setError('');
    setData({ ...data, teams: [...data.teams, name] });
    setNewTeam('');
  };

  const create = () => {
    const tournament = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date().toISOString(),
      rounds: data.format === 'single' ? singleElimination(data.teams) : roundRobin(data.teams),
    };
    dispatch({ type: 'tournament/create', tournament });
    navigate(`/tournaments/${tournament.id}`);
  };

  const matchCount =
    data.format === 'single' ? data.teams.length - 1 : (data.teams.length * (data.teams.length - 1)) / 2;

  return (
    <>
      <header className="page-head">
        <h1>New tournament</h1>
      </header>

      <ol className="stepper">
        {STEPS.map((s, i) => (
          <li key={s} className={i === step ? 'active' : i < step ? 'done' : ''}>
            <span>{i < step ? '✓' : i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      <div className="card wizard">
        {step === 0 && (
          <>
            <label>
              Tournament name
              <input value={data.name} onChange={set('name')} placeholder="e.g. KBTU Autumn Cup" autoFocus />
            </label>
            <label>
              Activity
              <select value={data.game} onChange={set('game')}>
                <ActivityOptions />
              </select>
            </label>
            <label>
              Start date
              <input type="date" value={data.startDate} onChange={set('startDate')} />
            </label>
          </>
        )}

        {step === 1 && (
          <div className="formats">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`format ${data.format === f.id ? 'selected' : ''}`}
                onClick={() => setData({ ...data, format: f.id })}
              >
                <strong>{f.title}</strong>
                <span className="muted">{f.desc}</span>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <>
            <form className="row" onSubmit={addTeam}>
              <input value={newTeam} onChange={(e) => setNewTeam(e.target.value)} placeholder="Team name" />
              <button className="btn">Add</button>
            </form>
            <ul className="list">
              {data.teams.map((t, i) => (
                <li key={t}>
                  <span>
                    <span className="muted">#{i + 1}</span> {t}
                  </span>
                  <button
                    className="btn ghost sm"
                    onClick={() => setData({ ...data, teams: data.teams.filter((x) => x !== t) })}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {step === 3 && (
          <dl className="review">
            <dt>Name</dt>
            <dd>{data.name}</dd>
            <dt>Activity</dt>
            <dd>{data.game}</dd>
            <dt>Start date</dt>
            <dd>{data.startDate || 'TBD'}</dd>
            <dt>Format</dt>
            <dd>{FORMATS.find((f) => f.id === data.format).title}</dd>
            <dt>Teams</dt>
            <dd>{data.teams.join(', ')}</dd>
            <dt>Matches</dt>
            <dd>{matchCount}</dd>
          </dl>
        )}

        {error && <p className="error">{error}</p>}

        <div className="row end">
          {step > 0 && (
            <button className="btn ghost" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          {step < STEPS.length - 1 ? (
            <button className="btn" onClick={next}>
              Next
            </button>
          ) : (
            <button className="btn" onClick={create}>
              Create tournament
            </button>
          )}
        </div>
      </div>
    </>
  );
}
