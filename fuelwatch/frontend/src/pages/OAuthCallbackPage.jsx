import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

/**
 * Landing page for OAuth redirects.
 * The backend redirects here as:
 *   /auth/callback?token=JWT&name=...&role=...
 * or on failure:
 *   /auth/callback?error=oauth_cancelled
 */
export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token: existingToken } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const role  = searchParams.get('role');

    if (error) {
      navigate('/login?error=' + encodeURIComponent(
        error === 'oauth_cancelled' ? 'Sign-in was cancelled.' : 'Sign-in failed. Please try again.'
      ), { replace: true });
      return;
    }

    if (token) {
      localStorage.setItem('fw_token', token);
      // Force a full page reload so AuthContext re-reads the token and fetches /me
      const destination = role === 'admin' ? '/admin' : '/';
      window.location.replace(destination);
    } else {
      navigate('/login?error=' + encodeURIComponent('No token received.'), { replace: true });
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '16px',
    }}>
      <div className="spinner" />
      <p style={{ color: 'var(--color-text-secondary)' }}>Completing sign-in…</p>
    </div>
  );
}
