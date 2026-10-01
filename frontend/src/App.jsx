import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import TournamentsPage from './pages/TournamentsPage';
import TeamsPage from './pages/TeamsPage';
import PlayersPage from './pages/PlayersPage';
import VenuesPage from './pages/VenuesPage';
import UmpiresPage from './pages/UmpiresPage';
import MatchesPage from './pages/MatchesPage';
import ResultsPage from './pages/ResultsPage';
import StandingsPage from './pages/StandingsPage';
import StatisticsPage from './pages/StatisticsPage';
import KnockoutPage from './pages/KnockoutPage';
import Sidebar from './components/Sidebar';
import { Spinner } from './components/UI';

const PAGES = {
  dashboard:   Dashboard,
  tournaments: TournamentsPage,
  teams:       TeamsPage,
  players:     PlayersPage,
  venues:      VenuesPage,
  umpires:     UmpiresPage,
  matches:     MatchesPage,
  results:     ResultsPage,
  standings:   StandingsPage,
  statistics:  StatisticsPage,
  knockout:    KnockoutPage,
};

function AppInner() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner text="Initializing..." />
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const PageComponent = PAGES[activePage] || Dashboard;

  return (
    <div className="app-layout">
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="main-content">
        <PageComponent onNavigate={setActivePage} />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
