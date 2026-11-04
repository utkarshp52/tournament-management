export default function TopBar({ title, actions }) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="topbar">
      <div className="topbar-left-group">
        <h2 className="topbar-title">{title}</h2>
        <div className="topbar-meta-tags">
          <span className="badge-pro-league">
            <span className="pro-dot" />
            ENTERPRISE
          </span>
          <span className="badge-cloud-status">
            <span className="cloud-pulse-icon">●</span>
            LIVE DB
          </span>
        </div>
      </div>

      <div className="topbar-right-group">
        <div className="topbar-date-display">{currentDate}</div>
        {actions && <div className="topbar-actions">{actions}</div>}
      </div>
    </header>
  );
}
