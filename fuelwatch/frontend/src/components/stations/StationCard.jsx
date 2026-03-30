import React from 'react';
import { Link } from 'react-router-dom';

export default function StationCard({ station }) {
  const location = station.city || station.barangay;
  const sublocation = station.city && station.province ? station.province : null;

  return (
    <Link to={`/stations/${station.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="card card-hover" style={{ height: '100%', minHeight: '80px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--color-text)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {station.name}
            </h3>
            <p style={{ fontSize: '0.85rem', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {station.brand}
            </p>
          </div>
          <span style={{
            background: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px 8px',
            fontSize: '0.75rem',
            fontWeight: 600,
            flexShrink: 0,
            marginLeft: '8px',
          }}>
            {station.brand}
          </span>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {location && (
            <span>📍 {location}{sublocation ? `, ${sublocation}` : ''}</span>
          )}
          {station.address && (
            <span style={{
              color: 'var(--color-text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {station.address}
            </span>
          )}
        </div>
        <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 500 }}>
          View prices →
        </div>
      </div>
    </Link>
  );
}
