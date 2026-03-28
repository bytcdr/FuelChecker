import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{
      background: 'var(--color-surface)',
      borderTop: '1px solid var(--color-border)',
      padding: '24px 0',
      marginTop: 'auto',
    }}>
      <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
          © {new Date().getFullYear()} FuelWatch Tuguegarao · Community-powered fuel prices
        </div>
        <div style={{ display: 'flex', gap: '16px', fontSize: '0.875rem' }}>
          <Link to="/stations" style={{ color: 'var(--color-text-muted)' }}>Stations</Link>
          <Link to="/map" style={{ color: 'var(--color-text-muted)' }}>Map</Link>
          <Link to="/register" style={{ color: 'var(--color-text-muted)' }}>Contribute</Link>
        </div>
      </div>
    </footer>
  );
}
