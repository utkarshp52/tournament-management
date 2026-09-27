import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--clr-bg)', padding: '24px' }}>

      {/* Background decorations */}
      <div style={{
        position: 'fixed', top: '-200px', left: '-200px',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />
      <div style={{
        position: 'fixed', bottom: '-200px', right: '-200px',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(139,92,246,0.1), transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: '440px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px', height: '64px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '28px', margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(99,102,241,0.4)'
          }}>🏆</div>
          <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '28px', fontWeight: '800', marginBottom: '4px' }}>
            Tournament Manager
          </h1>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: '14px' }}>
            Sign in to manage your tournaments
          </p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {error && (
              <div className="alert alert-danger">{error}</div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="form-control"
                placeholder="admin@tournament.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary btn-lg w-full"
              disabled={loading}
            >
              {loading ? '⏳ Signing in...' : '🔐 Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '24px', padding: '16px', background: 'var(--clr-bg-2)', borderRadius: '10px', fontSize: '12px', color: 'var(--clr-text-muted)' }}>
            <strong style={{ color: 'var(--clr-text-secondary)' }}>Demo credentials:</strong><br />
            Email: <code style={{ color: 'var(--clr-primary-light)' }}>admin@tournament.com</code><br />
            Password: <code style={{ color: 'var(--clr-primary-light)' }}>Admin@123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
