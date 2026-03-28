import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

// The OAuth URLs hit the backend directly (they trigger a browser redirect)
const OAUTH_URLS = {
  google: `${API_BASE}/auth/google`,
};

function OAuthButton({ provider, label, icon, color, textColor = '#fff' }) {
  return (
    <a
      href={OAUTH_URLS[provider]}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
        padding: '12px 20px', borderRadius: 'var(--radius-md)', textDecoration: 'none',
        fontWeight: 600, fontSize: '0.9375rem', background: color, color: textColor,
        border: textColor === '#000' ? '1.5px solid #d1d5db' : 'none',
        transition: 'opacity 0.15s', width: '100%',
      }}
      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
    >
      <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{icon}</span>
      {label}
    </a>
  );
}

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [showLocal, setShowLocal]   = useState(false);
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [error, setError]           = useState(searchParams.get('error') || '');
  const [loading, setLoading]       = useState(false);

  if (user) {
    navigate(user.role === 'admin' ? '/admin' : '/');
    return null;
  }

  const handleLocalLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      navigate(data.user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div className="card">
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>⛽</div>
            <h2>Sign in to FuelWatch</h2>
            <p style={{ fontSize: '0.9rem', marginTop: '4px' }}>
              Sign in to submit fuel prices
            </p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* OAuth buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <OAuthButton
              provider="google"
              label="Continue with Google"
              icon="G"
              color="#4285F4"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--color-border)' }} />
            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
              or sign in with email
            </span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--color-border)' }} />
          </div>

          {/* Collapsed local login (admin fallback) */}
          {!showLocal ? (
            <button
              className="btn btn-secondary btn-full"
              onClick={() => setShowLocal(true)}
              style={{ fontSize: '0.875rem' }}
            >
              Email & Password (Admin)
            </button>
          ) : (
            <form onSubmit={handleLocalLogin}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email" className="form-control"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@fuelwatch.local" required autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password" className="form-control"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password" required autoComplete="current-password"
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLocal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            By signing in you agree to our terms. Your info is used only to track your fuel price contributions.
          </p>
        </div>

        <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Just browsing? <Link to="/stations">View stations</Link> without signing in.
        </p>
      </div>
    </div>
  );
}
