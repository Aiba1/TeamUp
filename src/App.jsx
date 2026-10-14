import { Navigate, Route, Routes } from 'react-router-dom';
import { useStore } from './store.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Tournaments from './pages/Tournaments.jsx';
import TournamentWizard from './pages/TournamentWizard.jsx';
import TournamentDetail from './pages/TournamentDetail.jsx';
import TeammateSearch from './pages/TeammateSearch.jsx';
import Profile from './pages/Profile.jsx';

function RequireAuth({ children }) {
  const { state } = useStore();
  return state.token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="tournaments" element={<Tournaments />} />
        <Route path="tournaments/new" element={<TournamentWizard />} />
        <Route path="tournaments/:id" element={<TournamentDetail />} />
        <Route path="teammates" element={<TeammateSearch />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
