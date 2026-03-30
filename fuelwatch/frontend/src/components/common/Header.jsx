import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

const NAV_LINKS = [
  { to: '/', label: 'Home', exact: true },
  { to: '/stations', label: 'Stations' },
  { to: '/map', label: 'Map' },
];

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  // Close drawer on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Close drawer on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [menuOpen]);

  const navLinkStyle = ({ isActive }) => ({
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
    background: isActive ? 'var(--color-primary-light)' : 'transparent',
    textDecoration: 'none',
  });

  return (
    <>
      <header style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 200,
        height: 'var(--header-height)',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '24px' }}>
          {/* Logo */}
          <Link to="/" style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-primary)', textDecoration: 'none', flexShrink: 0 }}>
            ⛽ GasTolina
          </Link>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', gap: '4px', flex: 1 }} className="desktop-nav">
            {NAV_LINKS.map(({ to, label, exact }) => (
              <NavLink key={to} to={to} end={exact} style={navLinkStyle}>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop Auth — hidden on mobile via CSS */}
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

          {/* Hamburger — visible on mobile only */}
          <button
            className="hamburger-btn"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              marginLeft: 'auto',
              color: 'var(--color-text)',
              fontSize: '1.5rem',
              lineHeight: 1,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 199,
            background: 'rgba(0,0,0,0.35)',
          }}
          aria-hidden="true"
        />
      )}
      <div
        ref={drawerRef}
        className="mobile-drawer"
        style={{
          position: 'fixed',
          top: 'var(--header-height)',
          left: 0,
          right: 0,
          zIndex: 199,
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)',
          transform: menuOpen ? 'translateY(0)' : 'translateY(-110%)',
          transition: 'transform 220ms ease',
          display: 'none',
          flexDirection: 'column',
          padding: 'var(--spacing-md)',
          gap: 'var(--spacing-xs)',
        }}
      >
        {NAV_LINKS.map(({ to, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={() => setMenuOpen(false)}
            style={({ isActive }) => ({
              display: 'block',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              fontSize: '1rem',
              fontWeight: 500,
              color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
              background: isActive ? 'var(--color-primary-light)' : 'transparent',
              textDecoration: 'none',
            })}
          >
            {label}
          </NavLink>
        ))}

        <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: '8px 0' }} />

        {user ? (
          <>
            {user.role === 'admin' && (
              <Link to="/admin" className="btn btn-secondary btn-full" onClick={() => setMenuOpen(false)}>Admin</Link>
            )}
            <Link to="/profile" className="btn btn-secondary btn-full" onClick={() => setMenuOpen(false)}>My Submissions</Link>
            <button onClick={handleLogout} className="btn btn-secondary btn-full">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary btn-full" onClick={() => setMenuOpen(false)}>Log In</Link>
            <Link to="/register" className="btn btn-primary btn-full" onClick={() => setMenuOpen(false)}>Register</Link>
          </>
        )}
      </div>

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav,
          .desktop-auth { display: none !important; }
          .hamburger-btn { display: block !important; }
          .mobile-drawer { display: flex !important; }
        }
      `}</style>
    </>
  );
}
