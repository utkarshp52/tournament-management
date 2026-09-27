import { useEffect } from 'react';

export default function Modal({ title, onClose, children, footer, size = 'md' }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const maxWidth = { sm: '400px', md: '560px', lg: '720px', xl: '900px' }[size] || '560px';

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth }}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button
            id="modal-close"
            className="btn btn-secondary btn-icon"
            onClick={onClose}
            aria-label="Close"
          >✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
