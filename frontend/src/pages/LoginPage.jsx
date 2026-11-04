import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please verify your email/password.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setForm({
      email: 'admin@tournament.com',
      password: 'Admin@123',
    });
    setError('');
  };

  return (
    <div className="login-page-container">
      {/* Dynamic Ambient Background Elements */}
      <div className="login-ambient-glow glow-top" />
      <div className="login-ambient-glow glow-bottom" />
      <div className="login-grid-pattern" />

      <div className="login-content-box">
        {/* Brand Crest */}
        <div className="login-brand-header">
          <div className="login-trophy-badge">
            <span className="trophy-emoji">🏆</span>
            <div className="badge-glow-ring" />
          </div>
          <span className="pro-pill-tag">ENTERPRISE EDITION</span>
          <h1 className="login-title">Tournament Manager</h1>
          <p className="login-subtitle">
            Professional Sports Operations & League Management Suite
          </p>
        </div>

        {/* Elevated Form Card */}
        <div className="login-card-elevated">
          {error && (
            <div className="login-alert-banner">
              <span className="alert-icon">⚠️</span>
              <div className="alert-text">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-field-group">
              <label className="input-field-label" htmlFor="login-email">
                Email Address or Username
              </label>
              <div className="input-with-icon">
                <span className="input-adornment">✉️</span>
                <input
                  id="login-email"
                  type="text"
                  className="modern-text-input"
                  placeholder="admin@tournament.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="input-field-group">
              <div className="password-header-flex">
                <label className="input-field-label" htmlFor="login-password">
                  Password
                </label>
                <button
                  type="button"
                  className="btn-toggle-pass"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="input-with-icon">
                <span className="input-adornment">🔒</span>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="modern-text-input"
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn-login-gradient"
              disabled={loading}
            >
              {loading ? (
                <span className="btn-loading-flex">
                  <span className="mini-spinner" />
                  Authenticating...
                </span>
              ) : (
                <span className="btn-label-flex">
                  Sign In to Dashboard →
                </span>
              )}
            </button>
          </form>

          {/* Quick-fill Demo Box */}
          {/* <div className="demo-credentials-pillbox">
            <div className="demo-header-row">
              <span className="demo-badge">QUICK DEMO ACCESS</span>
              <button
                type="button"
                className="btn-auto-fill"
                onClick={handleQuickFill}
                title="Click to automatically fill demo account credentials"
              >
                ⚡ Fill Credentials
              </button>
            </div>
            <div className="demo-credentials-body">
              <div className="demo-cred-row">
                <span className="demo-cred-key">Email:</span>
                <code className="demo-code">admin@tournament.com</code>
              </div>
              <div className="demo-cred-row">
                <span className="demo-cred-key">Password:</span>
                <code className="demo-code">Admin@123</code>
              </div>
            </div>
          </div> */}
        </div>

        {/* Footer info */}
        <div className="login-trust-footer">
          <span>🔒 End-to-end Encrypted Session</span>
          <span className="separator">•</span>
          <span>⚡ High-Availability Cloud</span>
        </div>
      </div>
    </div>
  );
}
