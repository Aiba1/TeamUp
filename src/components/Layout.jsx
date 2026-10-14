import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useStore } from '../store.jsx';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/tournaments', label: 'Tournaments' },
  { to: '/teammates', label: 'Find teammates' },
  { to: '/profile', label: 'Profile' },
];

export default function Layout() {
  const { state, dispatch } = useStore();
  const navigate = useNavigate();

  const logout = () => {
    dispatch({ type: 'auth/logout' });
    navigate('/login');
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="logo">
          Team<span>Up</span>
        </div>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className="navlink">
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="avatar">{state.user?.username?.[0]?.toUpperCase()}</div>
          <div className="who">
            <strong>{state.user?.username}</strong>
            <small>{state.user?.email}</small>
          </div>
          <button className="btn ghost sm" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
