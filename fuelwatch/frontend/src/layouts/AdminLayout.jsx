import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const navItems = [
  { to: '/admin', label: 'Dashboard', exact: true },
  { to: '/admin/submissions', label: 'Submissions' },
  { to: '/admin/stations', label: 'Stations' },
  { to: '/admin/reports', label: 'Reports' },
  { to: '/admin/users', label: 'Users' },
];

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{
        background: '#1e293b',
        color: '#fff',
        padding: '0 24px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <span style={{ fontWeight: 700, fontSize: '1rem', color: '#f97316' }}>
            FuelWatch Admin
          </span>
          <nav style={{ display: 'flex', gap: '4px' }}>
            {navItems.map(({ to, label, exact }) => (
              <NavLink
                key={to}
                to={to}
                end={exact}
                style={({ isActive }) => ({
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: isActive ? '#fff' : '#94a3b8',
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  textDecoration: 'none',
                  transition: '150ms',
                })}
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.875rem', color: '#94a3b8' }}>
          <span>{user?.name}</span>
          <NavLink to="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>← Public Site</NavLink>
          <button
            onClick={handleLogout}
            style={{ background: 'rgba(220,38,38,0.2)', color: '#fca5a5', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.875rem' }}
          >
            Logout
          </button>
        </div>
      </header>
      <main style={{ flex: 1, padding: '32px 24px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
