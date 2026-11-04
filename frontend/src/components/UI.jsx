export function Spinner({ text = 'Loading...' }) {
  return (
    <div className="loading-spinner">
      <div className="spinner" />
      <span style={{ fontSize: '14px', color: 'var(--clr-text-muted)', fontWeight: 500 }}>{text}</span>
    </div>
  );
}

export function EmptyState({ icon = '📭', title = 'Nothing here yet', desc = '', action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <div className="empty-state-title">{title}</div>
      {desc && <p className="empty-state-desc">{desc}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    upcoming:   { cls: 'badge-status-info',    label: 'Upcoming',  dot: '●' },
    ongoing:    { cls: 'badge-status-success', label: 'Live Now',  dot: '●' },
    completed:  { cls: 'badge-status-neutral', label: 'Finished',  dot: '✓' },
    cancelled:  { cls: 'badge-status-danger',  label: 'Cancelled', dot: '✕' },
    scheduled:  { cls: 'badge-status-info',    label: 'Scheduled', dot: '●' },
    postponed:  { cls: 'badge-status-warning', label: 'Postponed', dot: '!' },
  };
  const cfg = map[status] || { cls: 'badge-status-neutral', label: status || 'Unknown', dot: '•' };
  return (
    <span className={`status-badge-pill ${cfg.cls}`}>
      <span className="status-dot">{cfg.dot}</span>
      <span>{cfg.label}</span>
    </span>
  );
}

export function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Confirm Action</h3>
        </div>
        <div className="modal-body">
          <p style={{ color: 'var(--clr-text-secondary)', lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
          <button id="confirm-ok" className="btn btn-danger btn-sm" onClick={onConfirm}>Confirm Delete</button>
        </div>
      </div>
    </div>
  );
}

export function Alert({ type = 'info', children }) {
  return <div className={`alert alert-${type}`}>{children}</div>;
}
