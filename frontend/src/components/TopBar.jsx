export default function TopBar({ title, actions }) {
  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h2 className="topbar-title">{title}</h2>
        <span className="badge badge-primary" style={{ fontSize: '10.5px', padding: '3px 10px', letterSpacing: '0.8px', fontWeight: '800' }}>
          ⚡ PRO LEAGUE
        </span>
      </div>
      <div className="topbar-actions">{actions}</div>
    </header>
  );
}
