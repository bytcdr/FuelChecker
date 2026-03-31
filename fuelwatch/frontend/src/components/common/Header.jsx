import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  return (
    <>
      <header style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        height: 'var(--header-height)',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '24px' }}>
        {/* Logo */}
        <Link to="/" style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-primary)', textDecoration: 'none', flexShrink: 0 }}>
          ⛽ FuelWatch
        </Link>

        {/* Desktop Nav */}
        <nav style={{ display: 'flex', gap: '4px', flex: 1 }} className="desktop-nav">
          {[
            { to: '/', label: 'Home', exact: true },
            { to: '/stations', label: 'Stations' },
            { to: '/submit-station', label: 'Submit Station' },
            { to: '/map', label: 'Map' },
          ].map(({ to, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              style={({ isActive }) => ({
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.9rem',
                fontWeight: 500,
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                background: isActive ? 'var(--color-primary-light)' : 'transparent',
                textDecoration: 'none',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Auth buttons */}
        <div className="desktop-auth" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className="btn btn-sm btn-secondary">Admin</Link>
              )}
              <Link to="/profile" className="btn btn-sm btn-secondary">My Submissions</Link>
              <button onClick={handleLogout} className="btn btn-sm btn-secondary">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-sm btn-secondary">Log In</Link>
              <Link to="/register" className="btn btn-sm btn-primary">Register</Link>
            </>
          )}
        </div>

          <button
            className="mobile-inline-flex"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            style={{
              display: 'none',
              marginLeft: 'auto',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              background: '#fff',
              width: '40px',
              height: '40px',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              cursor: 'pointer',
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-only" style={{ display: 'none', position: 'sticky', top: 'var(--header-height)', zIndex: 90 }}>
          <div className="container" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
            <div className="card" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { to: '/', label: 'Home', exact: true },
                { to: '/stations', label: 'Stations' },
                { to: '/submit-station', label: 'Submit Station' },
                { to: '/map', label: 'Map' },
              ].map(({ to, label, exact }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={exact}
                  onClick={() => setMenuOpen(false)}
                  style={({ isActive }) => ({
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                    background: isActive ? 'var(--color-primary-light)' : 'transparent',
                    textDecoration: 'none',
                  })}
                >
                  {label}
                </NavLink>
              ))}
              {user ? (
                <>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="btn btn-sm btn-secondary" onClick={() => setMenuOpen(false)}>Admin</Link>
                  )}
                  <Link to="/profile" className="btn btn-sm btn-secondary" onClick={() => setMenuOpen(false)}>My Submissions</Link>
                  <button onClick={handleLogout} className="btn btn-sm btn-secondary">Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-sm btn-secondary" onClick={() => setMenuOpen(false)}>Log In</Link>
                  <Link to="/register" className="btn btn-sm btn-primary" onClick={() => setMenuOpen(false)}>Register</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
