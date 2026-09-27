export default function TopBar({ title, actions }) {
  return (
    <div className="topbar">
      <h2 className="topbar-title">{title}</h2>
      <div className="topbar-actions">{actions}</div>
    </div>
  );
}
