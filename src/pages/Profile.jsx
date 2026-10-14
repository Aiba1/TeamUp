import { useState } from 'react';
import { GAMES, ROLES, levelsFor } from '../api.js';
import ActivityOptions from '../components/ActivityOptions.jsx';
import { useStore } from '../store.jsx';

export default function Profile() {
  const { state, dispatch } = useStore();
  const game = state.user.game || GAMES[0];
  const [form, setForm] = useState({
    username: state.user.username,
    game,
    role: state.user.role || ROLES[game][0],
    rank: state.user.rank || levelsFor(game)[0],
  });
  const [saved, setSaved] = useState(false);

  const set = (key) => (e) => {
    setSaved(false);
    const patch = { [key]: e.target.value };
    if (key === 'game') {
      patch.role = ROLES[e.target.value][0];
      patch.rank = levelsFor(e.target.value)[0];
    }
    setForm({ ...form, ...patch });
  };

  const save = (e) => {
    e.preventDefault();
    dispatch({ type: 'user/update', patch: form });
    setSaved(true);
  };

  return (
    <>
      <header className="page-head">
        <h1>Profile</h1>
      </header>
      <div className="grid-2">
        <form className="card wizard" onSubmit={save}>
          <label>
            Username
            <input value={form.username} onChange={set('username')} />
          </label>
          <label>
            Main activity
            <select value={form.game} onChange={set('game')}>
              <ActivityOptions />
            </select>
          </label>
          <label>
            Role / position
            <select value={form.role} onChange={set('role')}>
              {ROLES[form.game].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label>
            Level
            <select value={form.rank} onChange={set('rank')}>
              {levelsFor(form.game).map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <div className="row end">
            {saved && <span className="ok-text">Saved ✓</span>}
            <button className="btn">Save</button>
          </div>
        </form>
        <section className="card">
          <h3>Session</h3>
          <p className="muted">Mock JWT issued by /auth/login (will be replaced by the real API):</p>
          <code className="token">{state.token}</code>
        </section>
      </div>
    </>
  );
}
