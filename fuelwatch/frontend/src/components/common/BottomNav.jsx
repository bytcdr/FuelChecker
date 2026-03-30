import React from 'react';
import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Home', icon: '⛽', exact: true },
  { to: '/stations', label: 'Stations', icon: '📋' },
  { to: '/map', label: 'Map', icon: '🗺️' },
  { to: '/submit-price', label: 'Submit', icon: '📝' },
];

export default function BottomNav() {
  return (
    <>
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'var(--mobile-nav-height)',
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          display: 'none',
          alignItems: 'stretch',
          zIndex: 150,
          boxShadow: '0 -2px 8px rgba(0,0,0,0.08)',
        }}
        className="bottom-nav"
      >
        {TABS.map(({ to, label, icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            style={({ isActive }) => ({
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              textDecoration: 'none',
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
              fontSize: '0.65rem',
              fontWeight: isActive ? 700 : 500,
              background: 'none',
              borderTop: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
              transition: 'color var(--transition), border-color var(--transition)',
              paddingTop: '2px',
            })}
          >
            <span style={{ fontSize: '1.35rem', lineHeight: 1 }}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <style>{`
        @media (max-width: 640px) {
          .bottom-nav { display: flex !important; }
        }
      `}</style>
    </>
  );
}
