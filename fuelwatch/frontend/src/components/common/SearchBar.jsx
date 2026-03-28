import React from 'react';

export default function SearchBar({ value, onChange, placeholder = 'Search...', style }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      <span style={{
        position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
        fontSize: '1rem', color: 'var(--color-text-muted)', pointerEvents: 'none',
      }}>🔍</span>
      <input
        type="text"
        className="form-control"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ paddingLeft: '38px' }}
      />
    </div>
  );
}
