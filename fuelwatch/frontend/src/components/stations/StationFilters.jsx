import React from 'react';

export default function StationFilters({ filters, onChange, brands = [], barangays = [] }) {
  const handleChange = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div className="form-group" style={{ margin: 0, flex: '1 1 180px' }}>
        <label className="form-label">Brand</label>
        <select
          className="form-control"
          value={filters.brand || ''}
          onChange={(e) => handleChange('brand', e.target.value)}
        >
          <option value="">All Brands</option>
          {brands.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      <div className="form-group" style={{ margin: 0, flex: '1 1 180px' }}>
        <label className="form-label">Barangay</label>
        <select
          className="form-control"
          value={filters.barangay || ''}
          onChange={(e) => handleChange('barangay', e.target.value)}
        >
          <option value="">All Barangays</option>
          {barangays.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {(filters.brand || filters.barangay) && (
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onChange({ ...filters, brand: '', barangay: '' })}
          style={{ alignSelf: 'flex-end', marginBottom: '0' }}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
