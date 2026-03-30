import React from 'react';

const MAJOR_BRANDS = ['Petron', 'Shell', 'Caltex', 'Phoenix', 'Seaoil', 'PTT', 'Flying V', 'Total', 'Unioil'];

const BRAND_COLORS = {
  Petron:    '#E31837',
  Shell:     '#FFC200',
  Caltex:    '#003087',
  Phoenix:   '#FF6600',
  Seaoil:    '#0055AA',
  PTT:       '#00A650',
  'Flying V':'#008000',
  Total:     '#EF3A1D',
  Unioil:    '#7C3AED',
};

export default function StationFilters({ activeBrand = '', onChange }) {
  return (
    <div>
      <div style={labelStyle}>Filter by Brand</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        <button
          onClick={() => onChange('')}
          style={pillStyle(!activeBrand, '#2563eb')}
        >
          All Brands
        </button>
        {MAJOR_BRANDS.map((brand) => {
          const active = activeBrand === brand;
          const color  = BRAND_COLORS[brand] || '#2563eb';
          return (
            <button
              key={brand}
              onClick={() => onChange(active ? '' : brand)}
              style={pillStyle(active, color)}
            >
              {brand}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function pillStyle(active, color) {
  return {
    padding: '5px 16px',
    borderRadius: '999px',
    fontSize: '0.82rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: `1.5px solid ${active ? color : '#e2e8f0'}`,
    background: active ? color : '#fff',
    color: active ? '#fff' : 'var(--color-text)',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  };
}

const labelStyle = {
  fontSize: '0.78rem',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--color-text-muted)',
  marginBottom: '8px',
};
