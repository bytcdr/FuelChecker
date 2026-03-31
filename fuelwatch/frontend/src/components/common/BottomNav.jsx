import React from 'react';
import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Home', icon: '🏠', exact: true },
  { to: '/stations', label: 'Stations', icon: '⛽' },
  { to: '/map', label: 'Map', icon: '🗺️' },
  { to: '/submit-price', label: 'Submit', icon: '📝' },
];

export default function BottomNav() {
  return (
    <nav
      className="mobile-only"
      style={{
        display: 'none',
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: 'var(--mobile-nav-height)',
        background: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        zIndex: 120,
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', height: '100%' }}>
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.exact}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              gap: '2px',
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
              textDecoration: 'none',
              fontWeight: isActive ? 700 : 500,
            })}
          >
            <span style={{ fontSize: '1rem' }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

