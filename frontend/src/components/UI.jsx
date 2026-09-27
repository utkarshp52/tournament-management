export function Spinner({ text = 'Loading...' }) {
  return (
    <div className="loading-spinner">
      <div className="spinner" />
      <span style={{ fontSize: '14px', color: 'var(--clr-text-muted)' }}>{text}</span>
    </div>
  );
}

export function EmptyState({ icon = '📭', title = 'Nothing here yet', desc = '', action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      {desc && <p className="empty-state-desc">{desc}</p>}
      {action}
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    upcoming:   { cls: 'badge-info',    label: '🕐 Upcoming' },
    ongoing:    { cls: 'badge-success', label: '🟢 Ongoing' },
    completed:  { cls: 'badge-muted',   label: '✅ Completed' },
    cancelled:  { cls: 'badge-danger',  label: '❌ Cancelled' },
    scheduled:  { cls: 'badge-info',    label: '📅 Scheduled' },
    postponed:  { cls: 'badge-warning', label: '⚠️ Postponed' },
  };
  const cfg = map[status] || { cls: 'badge-muted', label: status };
  return <span className={`badge ${cfg.cls}`}>{cfg.label}</span>;
}

export function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '380px' }}>
        <div className="modal-header">
          <h3 className="modal-title">⚠️ Confirm</h3>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--clr-text-secondary)' }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
          <button id="confirm-ok" className="btn btn-danger btn-sm" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export function Alert({ type = 'info', children }) {
  return <div className={`alert alert-${type}`}>{children}</div>;
}
