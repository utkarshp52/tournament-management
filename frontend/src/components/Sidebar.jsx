import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  {
    section: 'Overview',
    items: [
      { id: 'dashboard',   icon: '📊', label: 'Dashboard' },
      { id: 'tournaments', icon: '🏆', label: 'Tournaments' },
    ],
  },
  {
    section: 'Operations',
    items: [
      { id: 'teams',       icon: '🛡️', label: 'Teams' },
      { id: 'players',     icon: '👥', label: 'Players' },
      { id: 'venues',      icon: '🏟️',  label: 'Venues' },
      { id: 'umpires',     icon: '⚖️', label: 'Officials' },
    ],
  },
  {
    section: 'Fixtures & Scores',
    items: [
      { id: 'matches',     icon: '📅', label: 'Match Schedule' },
      { id: 'results',     icon: '🎯', label: 'Match Results' },
    ],
  },
  {
    section: 'Standings & Reports',
    items: [
      { id: 'standings',   icon: '🥇', label: 'Points Table' },
      { id: 'statistics',  icon: '📈', label: 'Leaderboards' },
      { id: 'knockout',    icon: '⚡', label: 'Knockout Bracket' },
      { id: 'reports',     icon: '📑', label: 'Export Reports' },
    ],
  },
];

export default function Sidebar({ activePage, onNavigate }) {
  const { user, logout } = useAuth();

  // Get user initials for avatar
  const displayName = user?.full_name || user?.username || 'Administrator';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-logo">
        <div className="logo-icon-wrapper">
          <span className="logo-icon">🏆</span>
          <span className="logo-sparkle" />
        </div>
        <div className="logo-text-group">
          <div className="logo-brand-title">TOURNAMENT</div>
          <div className="logo-brand-subtitle">
            <span className="pulse-dot-online" />
            <span>PRO SUITE</span>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((section) => (
          <div key={section.section} className="nav-group">
            <div className="nav-section-title">{section.section}</div>
            <div className="nav-items-stack">
              {section.items.map((item) => {
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-${item.id}`}
                    className={`nav-link-modern ${isActive ? 'active' : ''}`}
                    onClick={() => onNavigate(item.id)}
                  >
                    <span className="nav-icon-box">{item.icon}</span>
                    <span className="nav-label-text">{item.label}</span>
                    {isActive && <span className="active-pill-pip" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User & Session Footer */}
      <div className="sidebar-footer">
        <div className="user-profile-widget">
          <div className="user-avatar-badge">{initials}</div>
          <div className="user-text-info">
            <div className="user-display-name" title={displayName}>
              {displayName}
            </div>
            <div className="user-role-badge">
              <span className="role-chip">{user?.role || 'ADMIN'}</span>
              <span className="status-online-text">Active</span>
            </div>
          </div>
        </div>

        <button
          id="btn-logout"
          className="btn-logout-sleek"
          onClick={logout}
          title="Sign out of tournament manager"
        >
          <span>Sign Out</span>
          <span className="logout-icon">→</span>
        </button>
      </div>
    </aside>
  );
}
