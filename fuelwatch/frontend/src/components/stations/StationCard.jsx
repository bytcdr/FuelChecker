import React from 'react';
import { Link } from 'react-router-dom';

export default function StationCard({ station }) {
  return (
    <Link to={`/stations/${station.id}`} style={{ textDecoration: 'none' }}>
      <div className="card card-hover" style={{ height: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <h3 style={{ fontSize: '1rem', color: 'var(--color-text)', margin: 0 }}>{station.name}</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '2px' }}>{station.brand}</p>
          </div>
          <span style={{
            background: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px 8px',
            fontSize: '0.75rem',
            fontWeight: 600,
            flexShrink: 0,
          }}>
            {station.brand}
          </span>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {station.barangay && (
            <span>📍 {station.barangay}</span>
          )}
          {station.address && (
            <span style={{ color: 'var(--color-text-muted)' }}>{station.address}</span>
          )}
        </div>
        <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 500 }}>
          View prices →
        </div>
      </div>
    </Link>
  );
}
