import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { section: 'Main',       items: [
    { id: 'dashboard',    icon: '📊', label: 'Dashboard' },
    { id: 'tournaments',  icon: '🏆', label: 'Tournaments' },
  ]},
  { section: 'Management', items: [
    { id: 'teams',        icon: '🧑‍🤝‍🧑', label: 'Teams' },
    { id: 'players',      icon: '👤', label: 'Players' },
    { id: 'venues',       icon: '🏟️',  label: 'Venues' },
    { id: 'umpires',      icon: '🧑‍⚖️', label: 'Umpires' },
  ]},
  { section: 'Match',      items: [
    { id: 'matches',      icon: '📅', label: 'Schedule' },
    { id: 'results',      icon: '✅', label: 'Results' },
  ]},
  { section: 'Analytics',  items: [
    { id: 'standings',    icon: '📋', label: 'Standings' },
    { id: 'statistics',   icon: '📈', label: 'Statistics' },
    { id: 'knockout',     icon: '🥇', label: 'Knockout' },
  ]},
];

export default function Sidebar({ activePage, onNavigate }) {
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">🏆</div>
        <div className="logo-text">
          Tournament
          <span>Management System</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(section => (
          <div key={section.section}>
            <div className="nav-section-title">{section.section}</div>
            {section.items.map(item => (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                className={`nav-link ${activePage === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--clr-text-primary)' }}>
            {user?.full_name || user?.username}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--clr-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {user?.role}
          </div>
        </div>
        <button
          id="btn-logout"
          className="btn btn-secondary btn-sm w-full"
          onClick={logout}
        >
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
}
