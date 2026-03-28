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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
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
      </div>
    </header>
  );
}
